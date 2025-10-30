import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Plus, Clock, MapPin, Users, Ship } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";

const ERPSchedule = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: centers } = await supabase
      .from("dive_centers")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!centers) return;

    const { data, error } = await supabase
      .from("dive_bookings")
      .select(`
        *,
        customer:profiles!dive_bookings_customer_id_fkey(username, avatar_url),
        experience:experiences(title, location)
      `)
      .eq("dive_center_id", centers.id)
      .order("dive_date", { ascending: true });

    if (!error && data) {
      setBookings(data);
    }
    setLoading(false);
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
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Booking
          </Button>
        </div>

        {/* Calendar View Placeholder */}
        <Card className="glass-effect border-primary/20 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed border-primary/20 rounded-lg">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Interactive calendar view coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                      
                      <h3 className="text-xl font-bold mb-2">
                        {booking.experience?.title || "Custom Dive"}
                      </h3>
                      
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
                          Customer: {booking.customer?.username || "Unknown"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold text-primary">
                        ${booking.total_amount}
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ERPSchedule;
