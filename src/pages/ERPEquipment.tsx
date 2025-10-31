import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ArrowLeft, Plus, AlertCircle, CheckCircle, Wrench, Ship, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { AddEquipmentDialog } from "@/components/erp/AddEquipmentDialog";
import { EditEquipmentDialog } from "@/components/erp/EditEquipmentDialog";
import { AddTankDialog } from "@/components/erp/AddTankDialog";
import { EditTankDialog } from "@/components/erp/EditTankDialog";
import { GenerateMockDataButton } from "@/components/erp/GenerateMockDataButton";
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

const ERPEquipment = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [tanks, setTanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [diveCenterId, setDiveCenterId] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipment();
    fetchTanks();
  }, []);

  const fetchEquipment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: centers } = await supabase
      .from("dive_centers")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!centers) return;
    
    setDiveCenterId(centers.id);

    const { data, error } = await supabase
      .from("dive_equipment")
      .select("*")
      .eq("dive_center_id", centers.id)
      .order("equipment_type", { ascending: true });

    if (!error && data) {
      setEquipment(data);
    }
  };

  const fetchTanks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: centers } = await supabase
      .from("dive_centers")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!centers) return;

    const { data, error } = await supabase
      .from("dive_tanks")
      .select("*")
      .eq("dive_center_id", centers.id)
      .order("tank_number", { ascending: true });

    if (!error && data) {
      setTanks(data);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
      case "full":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rented":
        return <Ship className="w-4 h-4 text-blue-500" />;
      case "maintenance":
      case "needs_checking":
        return <Wrench className="w-4 h-4 text-orange-500" />;
      case "empty":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
      case "full":
        return "bg-green-500";
      case "rented":
        return "bg-blue-500";
      case "maintenance":
      case "needs_checking":
        return "bg-orange-500";
      case "empty":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    const { error } = await supabase
      .from("dive_equipment")
      .delete()
      .eq("id", equipmentId);

    if (error) {
      toast.error("Failed to delete equipment");
    } else {
      toast.success("Equipment deleted successfully");
      fetchEquipment();
    }
  };

  const handleDeleteTank = async (tankId: string) => {
    const { error } = await supabase
      .from("dive_tanks")
      .delete()
      .eq("id", tankId);

    if (error) {
      toast.error("Failed to delete tank");
    } else {
      toast.success("Tank deleted successfully");
      fetchTanks();
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
                <Package className="w-8 h-8 text-primary" />
                Equipment & Tanks
              </h1>
              <p className="text-sm text-muted-foreground">Manage inventory and maintenance</p>
            </div>
          </div>
          {diveCenterId && (
            <GenerateMockDataButton diveCenterId={diveCenterId} onDataGenerated={() => {
              fetchEquipment();
              fetchTanks();
            }} />
          )}
        </div>

        <Tabs defaultValue="equipment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="equipment">Dive Equipment</TabsTrigger>
            <TabsTrigger value="tanks">Gas Tanks</TabsTrigger>
          </TabsList>

          <TabsContent value="equipment">
            {loading ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading equipment...
                </CardContent>
              </Card>
            ) : equipment.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No equipment found</p>
                  {diveCenterId && (
                    <AddEquipmentDialog 
                      diveCenterId={diveCenterId} 
                      onEquipmentAdded={fetchEquipment}
                      trigger={
                        <Button className="mt-4" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Equipment
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipment.map((item) => (
                  <Card key={item.id} className="glass-effect border-primary/20 hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{item.equipment_type}</CardTitle>
                        {getStatusIcon(item.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Size</span>
                          <span className="font-medium">{item.size || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        {item.next_service_date && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Next Service</span>
                            <span className="text-sm font-medium">
                              {new Date(item.next_service_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground pt-2 border-t">
                            {item.notes}
                          </p>
                        )}
                        <div className="flex gap-2 pt-2 border-t mt-2">
                          <EditEquipmentDialog equipment={item} onEquipmentUpdated={fetchEquipment} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteEquipment(item.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tanks">
            {loading ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading tanks...
                </CardContent>
              </Card>
            ) : tanks.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Ship className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tanks found</p>
                  {diveCenterId && (
                    <AddTankDialog 
                      diveCenterId={diveCenterId} 
                      onTankAdded={fetchTanks}
                      trigger={
                        <Button className="mt-4" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Tank
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tanks.map((tank) => (
                  <Card key={tank.id} className="glass-effect border-primary/20 hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Tank #{tank.tank_number}</CardTitle>
                        {getStatusIcon(tank.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Gas Type</span>
                          <span className="font-medium">{tank.gas_type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge className={getStatusColor(tank.status)}>
                            {tank.status}
                          </Badge>
                        </div>
                        {tank.pressure_bar && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Pressure</span>
                            <span className="font-medium">{tank.pressure_bar} bar</span>
                          </div>
                        )}
                        {tank.hydrostatic_test_date && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Hydro Test</span>
                            <span className="text-sm">
                              {new Date(tank.hydrostatic_test_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2 border-t mt-2">
                          <EditTankDialog tank={tank} onTankUpdated={fetchTanks} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Tank</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTank(tank.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ERPEquipment;
