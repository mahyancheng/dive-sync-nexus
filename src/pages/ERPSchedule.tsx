import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Plus, Grid3x3, List } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { CalendarView } from "@/components/erp/CalendarView";
import { EventsList } from "@/components/erp/EventsList";
import { EventDetailDialog } from "@/components/erp/EventDetailDialog";
import { CreateEventDialog } from "@/components/erp/CreateEventDialog";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface Event {
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
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [diveCenterId, setDiveCenterId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");

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

    const allEvents: Event[] = [];

    // Convert bookings to events
    if (bookings) {
      bookings.forEach(booking => {
        allEvents.push({
          id: `booking-${booking.id}`,
          title: (experiencesMap[booking.experience_id]?.title as string | undefined) || booking.group_name || "Dive Booking",
          description: `${booking.participants_count} divers - ${booking.dive_type || "Custom"}`,
          date: new Date(booking.dive_date),
          location: booking.location || (experiencesMap[booking.experience_id]?.location as string | undefined) || undefined,
          type: "booking",
          priority: booking.status === "confirmed" ? "high" : "medium",
          bookingId: booking.id,
          status: booking.status
        });
      });
    }

    // Convert maintenance to events
    if (maintenance) {
      maintenance.forEach(maint => {
        if (maint.next_due_date) {
          allEvents.push({
            id: `maintenance-${maint.id}`,
            title: `Maintenance: ${maint.maintenance_type}`,
            description: maint.description,
            date: new Date(maint.next_due_date),
            type: "maintenance",
            priority: "medium"
          });
        }
      });
    }

    setEvents(allEvents);
    setLoading(false);
  };

  const handleEventClick = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setEventDetailOpen(true);
    }
  };

  // Group events by date for list view
  const groupedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
    return sorted.reduce<Record<string, Event[]>>((acc, event) => {
      const dateKey = format(event.date, "EEEE, MMMM d, yyyy");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      return acc;
    }, {});
  }, [events]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
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
            {diveCenterId && (
              <CreateEventDialog 
                diveCenterId={diveCenterId} 
                onEventCreated={fetchEvents}
              />
            )}
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 rounded-lg border bg-background p-1 w-fit">
            <Button 
              variant={view === "calendar" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setView("calendar")} 
              className="h-8"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="ml-2">Calendar</span>
            </Button>
            <Button 
              variant={view === "list" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setView("list")} 
              className="h-8"
            >
              <List className="h-4 w-4" />
              <span className="ml-2">List</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading calendar...
          </div>
        ) : view === "calendar" ? (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Calendar View - 3 columns */}
            <div className="xl:col-span-3">
              <CalendarView
                events={events}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>

            {/* Events List - 1 column */}
            <div>
              <EventsList
                events={events}
                onEventClick={handleEventClick}
                selectedDate={selectedDate}
                onClearFilters={() => setSelectedDate(null)}
              />
            </div>
          </div>
        ) : (
          /* List View */
          <Card className="p-6">
            {Object.entries(groupedEvents).length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No events found
              </div>
            ) : (
              Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <div key={date} className="mb-6 last:mb-0">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {dateEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event.id)}
                        className="w-full rounded-lg border bg-card p-4 text-left hover:shadow-sm hover:bg-accent transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-semibold">{event.title}</div>
                              {event.status === "completed" && (
                                <span className="text-xs text-muted-foreground">✓ Completed</span>
                              )}
                            </div>
                            {event.description && (
                              <div className="text-sm text-muted-foreground mb-2">
                                {event.description}
                              </div>
                            )}
                            {event.location && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                📍 {event.location}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                event.priority === "high"
                                  ? "bg-red-500/10 text-red-500"
                                  : event.priority === "medium"
                                  ? "bg-yellow-500/10 text-yellow-500"
                                  : "bg-green-500/10 text-green-500"
                              }`}
                            >
                              {event.priority}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {event.type}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </Card>
        )}

        {/* Event Detail Dialog */}
        {diveCenterId && (
          <EventDetailDialog
            event={selectedEvent}
            diveCenterId={diveCenterId}
            open={eventDetailOpen}
            onOpenChange={setEventDetailOpen}
            onUpdated={fetchEvents}
          />
        )}
      </main>
    </div>
  );
};

export default ERPSchedule;
