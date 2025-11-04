import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { EventManager, type Event as EventManagerEvent } from "@/components/ui/event-manager";
import { EventDetailDialog } from "@/components/erp/EventDetailDialog";

interface DBEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  type: "booking" | "maintenance" | "work-order" | "custom";
  priority: "low" | "medium" | "high";
  bookingId?: string;
  status?: string;
}

const ERPSchedule = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventManagerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [diveCenterId, setDiveCenterId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isVendor = roles?.some(r => (r.role as string) === 'vendor');
    if (!isVendor) {
      toast.error("Access denied");
      navigate("/profile");
      return;
    }

    fetchEvents();
  };

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: centers } = await supabase
      .from("dive_centers")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!centers) {
      setLoading(false);
      return;
    }
    
    setDiveCenterId(centers.id);

    // Fetch bookings
    const { data: bookings } = await supabase
      .from("dive_bookings")
      .select("*")
      .eq("dive_center_id", centers.id);

    // Build experience map for titles/locations
    const experienceIds = (bookings || [])
      .map((b: any) => b.experience_id)
      .filter((id: string | null | undefined) => !!id);

    let experiencesMap: Record<string, { title: string | null; location: string | null }> = {};
    if (experienceIds.length > 0) {
      const { data: exps } = await supabase
        .from("experiences")
        .select("id, title, location")
        .in("id", experienceIds);
      if (exps) {
        experiencesMap = exps.reduce((acc: Record<string, { title: string | null; location: string | null }>, e: any) => {
          acc[e.id] = { title: e.title, location: e.location };
          return acc;
        }, {});
      }
    }

    // Fetch maintenance logs
    const { data: maintenance } = await supabase
      .from("maintenance_logs")
      .select("*")
      .eq("dive_center_id", centers.id);

    // Fetch custom events
    const { data: customEvents } = await supabase
      .from("custom_events")
      .select("*")
      .eq("dive_center_id", centers.id);

    const allEvents: EventManagerEvent[] = [];

    // Convert bookings to events
    if (bookings) {
      bookings.forEach(booking => {
        const startTime = new Date(booking.dive_date);
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
        const priority = booking.status === "confirmed" ? "high" : "medium";
        
        allEvents.push({
          id: `booking-${booking.id}`,
          title: (experiencesMap[booking.experience_id]?.title as string | undefined) || booking.group_name || "Dive Booking",
          description: `${booking.participants_count} divers - ${booking.dive_type || "Custom"}${booking.location || experiencesMap[booking.experience_id]?.location ? ` at ${booking.location || experiencesMap[booking.experience_id]?.location}` : ''}`,
          startTime,
          endTime,
          color: priority === "high" ? "red" : priority === "medium" ? "yellow" : "green",
          category: "booking",
        });
      });
    }

    // Convert maintenance to events
    if (maintenance) {
      maintenance.forEach(maint => {
        if (maint.next_due_date) {
          const startTime = new Date(maint.next_due_date);
          const endTime = new Date(startTime.getTime() + 1 * 60 * 60 * 1000); // Add 1 hour
          
          allEvents.push({
            id: `maintenance-${maint.id}`,
            title: `Maintenance: ${maint.maintenance_type}`,
            description: maint.description || undefined,
            startTime,
            endTime,
            color: "yellow",
            category: "maintenance",
          });
        }
      });
    }

    // Convert custom events
    if (customEvents) {
      customEvents.forEach(event => {
        allEvents.push({
          id: `custom-${event.id}`,
          title: event.title,
          description: event.description || undefined,
          startTime: new Date(event.start_time),
          endTime: new Date(event.end_time),
          color: event.color || "blue",
          category: event.category || "custom",
          completed: event.completed || false,
          diveType: event.dive_type || undefined,
          eventGroupId: event.event_group_id || undefined,
        });
      });
    }

    setEvents(allEvents);
    setLoading(false);
  };

  const handleEventCreate = async (event: Omit<EventManagerEvent, "id">) => {
    if (!diveCenterId) return;
    
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    const isMultiDay = startDate.toDateString() !== endDate.toDateString();
    
    if (isMultiDay) {
      // Create one event per day with a shared group ID
      const groupId = crypto.randomUUID();
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const events = [];
      for (let i = 0; i < days; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(startDate.getDate() + i);
        dayStart.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
        
        const dayEnd = new Date(dayStart);
        if (i === days - 1) {
          // Last day uses the original end time
          dayEnd.setHours(endDate.getHours(), endDate.getMinutes(), 0, 0);
        } else {
          // Other days end at same time as start
          dayEnd.setHours(event.endTime.getHours(), event.endTime.getMinutes(), 0, 0);
        }
        
        events.push({
          dive_center_id: diveCenterId,
          title: event.title,
          description: event.description,
          start_time: dayStart.toISOString(),
          end_time: dayEnd.toISOString(),
          category: event.category || "custom",
          color: event.color || "blue",
          completed: false,
          dive_type: event.diveType,
          event_group_id: groupId,
        });
      }
      
      const { error } = await supabase
        .from("custom_events")
        .insert(events);

      if (error) {
        toast.error("Failed to create multi-day event");
        console.error(error);
      } else {
        toast.success(`Multi-day event created (${days} days)`);
        fetchEvents();
      }
    } else {
      // Single day event
      const { error } = await supabase
        .from("custom_events")
        .insert({
          dive_center_id: diveCenterId,
          title: event.title,
          description: event.description,
          start_time: event.startTime.toISOString(),
          end_time: event.endTime.toISOString(),
          category: event.category || "custom",
          color: event.color || "blue",
          completed: false,
          dive_type: event.diveType,
        });

      if (error) {
        toast.error("Failed to create event");
        console.error(error);
      } else {
        toast.success("Event created successfully");
        fetchEvents();
      }
    }
  };

  const handleEventUpdate = async (id: string, event: Partial<EventManagerEvent>) => {
    // Extract the actual database ID from the prefixed ID
    const [prefix, dbId] = id.split("-");
    
    if (prefix === "booking") {
      // Update booking
      const { error } = await supabase
        .from("dive_bookings")
        .update({
          dive_date: event.startTime?.toISOString().split("T")[0],
        })
        .eq("id", dbId);

      if (error) {
        toast.error("Failed to update event");
      } else {
        toast.success("Event updated");
        fetchEvents();
      }
    } else if (prefix === "custom") {
      // Check if this is part of a group
      const { data: eventData } = await supabase
        .from("custom_events")
        .select("event_group_id")
        .eq("id", dbId)
        .single();

      const updateData: any = {};
      if (event.title !== undefined) updateData.title = event.title;
      if (event.description !== undefined) updateData.description = event.description;
      if (event.startTime) updateData.start_time = event.startTime.toISOString();
      if (event.endTime) updateData.end_time = event.endTime.toISOString();
      if (event.category) updateData.category = event.category;
      if (event.color !== undefined) updateData.color = event.color;
      if (event.completed !== undefined) updateData.completed = event.completed;
      if (event.diveType !== undefined) updateData.dive_type = event.diveType;

      if (eventData?.event_group_id) {
        // Update all events in the group (except dates)
        const groupUpdateData: any = {};
        if (event.title !== undefined) groupUpdateData.title = event.title;
        if (event.description !== undefined) groupUpdateData.description = event.description;
        if (event.category) groupUpdateData.category = event.category;
        if (event.color !== undefined) groupUpdateData.color = event.color;
        if (event.completed !== undefined) groupUpdateData.completed = event.completed;
        if (event.diveType !== undefined) groupUpdateData.dive_type = event.diveType;

        const { error } = await supabase
          .from("custom_events")
          .update(groupUpdateData)
          .eq("event_group_id", eventData.event_group_id);

        if (error) {
          toast.error("Failed to update multi-day event");
        } else {
          toast.success("Multi-day event updated");
          fetchEvents();
        }
      } else {
        // Single event update
        const { error } = await supabase
          .from("custom_events")
          .update(updateData)
          .eq("id", dbId);

        if (error) {
          toast.error("Failed to update event");
        } else {
          toast.success("Event updated");
          fetchEvents();
        }
      }
    }
  };

  const handleEventDelete = async (id: string) => {
    const [prefix, dbId] = id.split("-");
    
    if (prefix === "custom") {
      // Check if this is part of a group
      const { data: eventData } = await supabase
        .from("custom_events")
        .select("event_group_id")
        .eq("id", dbId)
        .single();

      if (eventData?.event_group_id) {
        // Delete all events in the group
        const { error } = await supabase
          .from("custom_events")
          .delete()
          .eq("event_group_id", eventData.event_group_id);

        if (error) {
          toast.error("Failed to delete multi-day event");
        } else {
          toast.success("Multi-day event deleted");
          fetchEvents();
        }
      } else {
        // Single event delete
        const { error } = await supabase
          .from("custom_events")
          .delete()
          .eq("id", dbId);

        if (error) {
          toast.error("Failed to delete event");
        } else {
          toast.success("Event deleted");
          fetchEvents();
        }
      }
    } else {
      toast.error("Cannot delete system events");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/erp")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary" />
                Calendar Management
              </h1>
              <p className="text-sm text-muted-foreground">View and manage all scheduled events</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading calendar...
          </div>
        ) : (
          <EventManager
            events={events}
            onEventCreate={handleEventCreate}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
            onEventClick={(eventId) => {
              setSelectedEventId(eventId.replace(/^(booking|maintenance|custom)-/, ''));
              setDetailDialogOpen(true);
            }}
            defaultView="month"
          />
        )}

        <EventDetailDialog
          eventId={selectedEventId}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </main>
    </div>
  );
};

export default ERPSchedule;
