import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Clock, MapPin, Users, Ship, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { AddBookingDialog } from "@/components/erp/AddBookingDialog";
import { EditBookingDialog } from "@/components/erp/EditBookingDialog";
import { GenerateMockDataButton } from "@/components/erp/GenerateMockDataButton";
import { ConditionTracker } from "@/components/erp/ConditionTracker";
import { FleetManager } from "@/components/erp/FleetManager";
import { CateringManager } from "@/components/erp/CateringManager";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ERPSchedule = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [diveCenterId, setDiveCenterId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

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

      const { data, error } = await supabase
        .from("dive_bookings")
        .select(`
          *,
          customer:profiles!dive_bookings_customer_id_fkey(username, avatar_url),
          experience:experiences(title, location),
          boat:boats(name, max_capacity),
          conditions:dive_conditions(*),
          catering:trip_catering(*)
        `)
        .eq("dive_center_id", centers.id)
        .order("dive_date", { ascending: true });

      if (!error && data) {
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleDeleteBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from("dive_bookings")
      .delete()
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to delete booking");
    } else {
      toast.success("Booking deleted successfully");
      fetchBookings();
    }
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
                Dive Schedule
              </h1>
              <p className="text-sm text-muted-foreground">Manage bookings and dive trips</p>
            </div>
          </div>
          <div className="flex gap-2">
            {diveCenterId && (
              <>
                <GenerateMockDataButton diveCenterId={diveCenterId} onDataGenerated={fetchBookings} />
                <AddBookingDialog diveCenterId={diveCenterId} onBookingAdded={fetchBookings} />
              </>
            )}
          </div>
        </div>

        {/* Fleet & Facility Management */}
        {diveCenterId && (
          <div className="mb-6">
            <FleetManager diveCenterId={diveCenterId} />
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="glass-effect">
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading bookings...
              </CardContent>
            </Card>
          ) : bookings.length === 0 ? (
            <Card className="glass-effect">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No bookings scheduled</p>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id} className="glass-effect border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Badge variant="outline" className={
                          booking.payment_status === "paid" ? "border-green-500 text-green-500" :
                          booking.payment_status === "deposit" ? "border-yellow-500 text-yellow-500" :
                          "border-red-500 text-red-500"
                        }>
                          {booking.payment_status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">
                          {booking.experience?.title || booking.dive_type || "Custom Dive"}
                        </h3>
                        {booking.group_name && (
                          <Badge variant="outline">{booking.group_name}</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatDate(booking.dive_date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {booking.experience?.location || "Location TBD"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {booking.participants_count} {booking.participants_count === 1 ? "diver" : "divers"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Ship className="w-4 h-4" />
                          {booking.boat?.name || "Shore Dive"}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <ConditionTracker
                          bookingId={booking.id}
                          conditions={booking.conditions?.[0]}
                          onConditionUpdated={fetchBookings}
                        />
                        <CateringManager
                          bookingId={booking.id}
                          catering={booking.catering?.[0]}
                          participantsCount={booking.participants_count}
                          onCateringUpdated={fetchBookings}
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold text-primary">
                        ${booking.total_amount}
                      </div>
                      <div className="flex gap-2">
                        <EditBookingDialog booking={booking} onBookingUpdated={fetchBookings} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this booking? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBooking(booking.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default ERPSchedule;
