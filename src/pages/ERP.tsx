import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Waves, Calendar, Package, Users, DollarSign, Activity, AlertTriangle, Ship, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

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
    activeCustomers: 0,
    pendingForms: 0
  });

  useEffect(() => {
    checkDiveCenterAccess();
    fetchStats();
  }, []);

  const checkDiveCenterAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: centers } = await supabase
      .from("dive_centers")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (!centers) {
      navigate("/dashboard");
      return;
    }

    setDiveCenter(centers);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: centers } = await supabase
      .from("dive_centers")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!centers) return;

    // Fetch equipment stats
    const { data: equipment } = await supabase
      .from("dive_equipment")
      .select("status")
      .eq("dive_center_id", centers.id);

    const availableEquipment = equipment?.filter(e => e.status === "available").length || 0;
    const maintenanceEquipment = equipment?.filter(e => e.status === "maintenance").length || 0;

    // Fetch tank stats
    const { data: tanks } = await supabase
      .from("dive_tanks")
      .select("status")
      .eq("dive_center_id", centers.id);

    const fullTanks = tanks?.filter(t => t.status === "full").length || 0;
    const emptyTanks = tanks?.filter(t => t.status === "empty").length || 0;

    // Fetch booking stats
    const today = new Date().toISOString().split('T')[0];
    const { data: bookings } = await supabase
      .from("dive_bookings")
      .select("*")
      .eq("dive_center_id", centers.id)
      .gte("dive_date", today);

    const todaysDives = bookings?.filter(b => b.dive_date.split('T')[0] === today).length || 0;

    // Fetch customer forms
    const { data: forms } = await supabase
      .from("customer_forms")
      .select("status")
      .eq("dive_center_id", centers.id);

    const pendingForms = forms?.filter(f => f.status === "pending").length || 0;

    setStats({
      todaysDives,
      upcomingBookings: bookings?.length || 0,
      equipmentAvailable: availableEquipment,
      equipmentMaintenance: maintenanceEquipment,
      tanksFull: fullTanks,
      tanksEmpty: emptyTanks,
      activeCustomers: 0,
      pendingForms
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <Waves className="animate-spin h-8 w-8 text-primary" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {diveCenter?.name} ERP
              </h1>
              <p className="text-sm text-muted-foreground">Mission Control</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Today's Dives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.todaysDives}</div>
              <p className="text-xs text-muted-foreground">{stats.upcomingBookings} upcoming</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-green-500" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.equipmentAvailable}</div>
              <p className="text-xs text-muted-foreground">{stats.equipmentMaintenance} in maintenance</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ship className="w-4 h-4 text-blue-500" />
                Tanks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{stats.tanksFull}</div>
              <p className="text-xs text-muted-foreground">{stats.tanksEmpty} need filling</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{stats.pendingForms}</div>
              <p className="text-xs text-muted-foreground">pending forms</p>
            </CardContent>
          </Card>
        </div>

        {/* Weather Widget Placeholder */}
        <Card className="glass-effect border-primary/20 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary" />
              Weather & Conditions
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

        {/* Quick Actions */}
        <Card className="glass-effect border-primary/20 mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => navigate("/erp/schedule")}
                className="h-auto py-4 flex-col gap-2"
              >
                <Calendar className="w-6 h-6" />
                <span>Schedule Dive</span>
              </Button>
              <Button 
                onClick={() => navigate("/erp/customers")}
                className="h-auto py-4 flex-col gap-2"
                variant="outline"
              >
                <Users className="w-6 h-6" />
                <span>Add Customer</span>
              </Button>
              <Button 
                onClick={() => navigate("/erp/equipment")}
                className="h-auto py-4 flex-col gap-2"
                variant="outline"
              >
                <Package className="w-6 h-6" />
                <span>Equipment Log</span>
              </Button>
              <Button 
                onClick={() => navigate("/erp/finance")}
                className="h-auto py-4 flex-col gap-2"
                variant="outline"
              >
                <DollarSign className="w-6 h-6" />
                <span>Finance</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts Placeholder */}
        <Card className="glass-effect border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Analytics charts coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default ERP;
