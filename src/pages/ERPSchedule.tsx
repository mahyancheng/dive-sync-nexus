import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { CalendarView } from "@/components/erp/CalendarView";
import { EventsList } from "@/components/erp/EventsList";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  type: "booking" | "maintenance" | "work-order" | "custom";
  priority: "low" | "medium" | "high";
}

const ERPSchedule = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [diveCenterId, setDiveCenterId] = useState<string | null>(null);

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
      .select("*, experience:experiences(title, location)")
      .eq("dive_center_id", centers.id);

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
          title: booking.experience?.title || booking.dive_type || "Custom Dive",
          description: `${booking.participants_count} divers - ${booking.group_name || ""}`,
          date: new Date(booking.dive_date),
          location: booking.experience?.location,
          type: "booking",
          priority: booking.status === "confirmed" ? "high" : "medium"
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
    toast.info("Event details coming soon");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex items-center justify-between mb-8">
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
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading calendar...
          </div>
        ) : (
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
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ERPSchedule;
