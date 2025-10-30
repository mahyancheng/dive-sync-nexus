import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ship, Plus, Wrench, AlertCircle, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FleetManagerProps {
  diveCenterId: string;
}

export const FleetManager = ({ diveCenterId }: FleetManagerProps) => {
  const [boats, setBoats] = useState<any[]>([]);
  const [compressors, setCompressors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFleet();
  }, [diveCenterId]);

  const fetchFleet = async () => {
    const { data: boatsData } = await supabase
      .from("boats")
      .select("*")
      .eq("dive_center_id", diveCenterId);

    const { data: compressorsData } = await supabase
      .from("compressors")
      .select("*")
      .eq("dive_center_id", diveCenterId);

    if (boatsData) setBoats(boatsData);
    if (compressorsData) setCompressors(compressorsData);
  };

  const AddBoatDialog = () => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", max_capacity: "10" });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        await supabase.from("boats").insert({
          dive_center_id: diveCenterId,
          name: formData.name,
          max_capacity: parseInt(formData.max_capacity),
          status: "available",
        });

        toast.success("Boat added successfully");
        fetchFleet();
        setOpen(false);
        setFormData({ name: "", max_capacity: "10" });
      } catch (error: any) {
        toast.error(error.message || "Failed to add boat");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Boat
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Boat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="boat_name">Boat Name</Label>
              <Input
                id="boat_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Blue Marlin"
                required
              />
            </div>
            <div>
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Adding..." : "Add Boat"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const AddCompressorDialog = () => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", maintenance_trigger: "100" });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        await supabase.from("compressors").insert({
          dive_center_id: diveCenterId,
          name: formData.name,
          running_hours: 0,
          dives_since_service: 0,
          maintenance_trigger: parseInt(formData.maintenance_trigger),
        });

        toast.success("Compressor added successfully");
        fetchFleet();
        setOpen(false);
        setFormData({ name: "", maintenance_trigger: "100" });
      } catch (error: any) {
        toast.error(error.message || "Failed to add compressor");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Compressor
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Compressor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="compressor_name">Compressor Name</Label>
              <Input
                id="compressor_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Compressor"
                required
              />
            </div>
            <div>
              <Label htmlFor="trigger">Maintenance Trigger (dives)</Label>
              <Input
                id="trigger"
                type="number"
                value={formData.maintenance_trigger}
                onChange={(e) => setFormData({ ...formData, maintenance_trigger: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Adding..." : "Add Compressor"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "deployed": return "bg-blue-500";
      case "maintenance": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card className="glass-effect border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="w-5 h-5 text-primary" />
          Fleet & Facility Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="boats">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="boats">Boats</TabsTrigger>
            <TabsTrigger value="compressors">Compressors</TabsTrigger>
          </TabsList>

          <TabsContent value="boats" className="space-y-4">
            <div className="flex justify-end">
              <AddBoatDialog />
            </div>
            {boats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ship className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No boats registered</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boats.map((boat) => (
                  <Card key={boat.id} className="border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">{boat.name}</h3>
                        <Badge className={getStatusColor(boat.status)}>
                          {boat.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Capacity: {boat.max_capacity} divers</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="compressors" className="space-y-4">
            <div className="flex justify-end">
              <AddCompressorDialog />
            </div>
            {compressors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No compressors registered</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {compressors.map((compressor) => (
                  <Card key={compressor.id} className="border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">{compressor.name}</h3>
                        {compressor.dives_since_service >= compressor.maintenance_trigger && (
                          <Badge className="bg-red-500">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Maintenance Due
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Running Hours: {compressor.running_hours}h</p>
                        <p>Dives Since Service: {compressor.dives_since_service}/{compressor.maintenance_trigger}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${
                              compressor.dives_since_service >= compressor.maintenance_trigger
                                ? "bg-red-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                (compressor.dives_since_service / compressor.maintenance_trigger) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
