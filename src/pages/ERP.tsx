import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Package, Users, DollarSign, Activity, AlertTriangle, 
  Ship, Wind, ArrowLeft, Wrench 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const ERP = () => {
  const navigate = useNavigate();
  const [diveCenter, setDiveCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaysDives: 0,
    upcomingBookings: 0,
    equipmentAvailable: 0,
    equipmentMaintenance: 0,
    tanksFull: 0,
    tanksEmpty: 0,
    totalRevenue: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    checkVendorAccess();
  }, []);

  const checkVendorAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user has vendor role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isVendor = roles?.some(r => (r.role as string) === 'vendor');
    if (!isVendor) {
      toast.error("Access denied. Vendor account required.");
      navigate("/profile");
      return;
    }

    // Get dive center
    const { data: centers } = await supabase
      .from("dive_centers")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!centers) {
      toast.error("No dive center found. Please contact support.");
      navigate("/profile");
      return;
    }

    setDiveCenter(centers);
    fetchStats(centers.id);
    setLoading(false);
  };

  const fetchStats = async (diveCenterId: string) => {
    // Fetch equipment stats
    const { data: equipment } = await supabase
      .from("dive_equipment")
      .select("status")
      .eq("dive_center_id", diveCenterId);

    const availableEquipment = equipment?.filter(e => e.status === "available").length || 0;
    const maintenanceEquipment = equipment?.filter(e => e.status === "maintenance").length || 0;

    // Fetch tank stats
    const { data: tanks } = await supabase
      .from("dive_tanks")
      .select("status")
      .eq("dive_center_id", diveCenterId);

    const fullTanks = tanks?.filter(t => t.status === "full").length || 0;
    const emptyTanks = tanks?.filter(t => t.status === "empty").length || 0;

    // Fetch booking stats
    const today = new Date().toISOString().split('T')[0];
    const { data: bookings } = await supabase
      .from("dive_bookings")
      .select("*")
      .eq("dive_center_id", diveCenterId)
      .gte("dive_date", today);

    const todaysDives = bookings?.filter(b => b.dive_date.split('T')[0] === today).length || 0;

    // Calculate revenue
    const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0;
    const pendingPayments = bookings?.filter(b => b.payment_status !== 'paid')
      .reduce((sum, b) => sum + (Number(b.total_amount || 0) - Number(b.deposit_amount || 0)), 0) || 0;

    setStats({
      todaysDives,
      upcomingBookings: bookings?.length || 0,
      equipmentAvailable: availableEquipment,
      equipmentMaintenance: maintenanceEquipment,
      tanksFull: fullTanks,
      tanksEmpty: emptyTanks,
      totalRevenue,
      pendingPayments
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {diveCenter?.name}
            </h1>
            <p className="text-sm text-muted-foreground">Business Management Dashboard</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.todaysDives}</div>
              <p className="text-xs text-muted-foreground">{stats.upcomingBookings} upcoming</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">${stats.totalRevenue.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">${stats.pendingPayments.toFixed(0)} pending</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{stats.equipmentAvailable}</div>
              <p className="text-xs text-muted-foreground">{stats.equipmentMaintenance} in maintenance</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ship className="w-4 h-4 text-cyan-500" />
                Tanks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-500">{stats.tanksFull}</div>
              <p className="text-xs text-muted-foreground">{stats.tanksEmpty} need filling</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-effect border-primary/20 mb-8">
          <CardHeader>
            <CardTitle>Management Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => navigate("/erp/schedule")}
                className="h-24 flex-col gap-3 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Calendar className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Schedule</div>
                  <div className="text-xs opacity-80">Bookings & Trips</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => navigate("/erp/equipment")}
                className="h-24 flex-col gap-3"
                variant="outline"
              >
                <Package className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Equipment</div>
                  <div className="text-xs opacity-80">Gear & Tanks</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => navigate("/erp/customers")}
                className="h-24 flex-col gap-3"
                variant="outline"
              >
                <Users className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Customers</div>
                  <div className="text-xs opacity-80">Forms & Records</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => navigate("/erp/finance")}
                className="h-24 flex-col gap-3"
                variant="outline"
              >
                <DollarSign className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Finance</div>
                  <div className="text-xs opacity-80">Payments & Reports</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {(stats.equipmentMaintenance > 0 || stats.tanksEmpty > 0) && (
          <Card className="glass-effect border-orange-500/30 bg-orange-500/5 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.equipmentMaintenance > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">{stats.equipmentMaintenance} equipment items need maintenance</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/erp/equipment")}>
                    View
                  </Button>
                </div>
              )}
              {stats.tanksEmpty > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">{stats.tanksEmpty} tanks need refilling</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/erp/equipment")}>
                    View
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Weather Placeholder */}
        <Card className="glass-effect border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary" />
              Current Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <div className="text-2xl mb-1">🌊</div>
                <div className="text-sm font-medium">Wave Height</div>
                <div className="text-lg font-bold text-primary">0.5m</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <div className="text-2xl mb-1">💨</div>
                <div className="text-sm font-medium">Wind Speed</div>
                <div className="text-lg font-bold text-primary">12 km/h</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <div className="text-2xl mb-1">🌡️</div>
                <div className="text-sm font-medium">Water Temp</div>
                <div className="text-lg font-bold text-primary">24°C</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <div className="text-2xl mb-1">👁️</div>
                <div className="text-sm font-medium">Visibility</div>
                <div className="text-lg font-bold text-primary">15m</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ERP;
