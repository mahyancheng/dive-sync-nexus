import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddItemDialogProps {
  diveCenterId: string;
  onItemAdded: () => void;
}

export const AddItemDialog = ({ diveCenterId, onItemAdded }: AddItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [equipmentData, setEquipmentData] = useState({
    equipment_type: "",
    size: "",
    status: "available",
    notes: ""
  });
  const [tankData, setTankData] = useState({
    tank_number: "",
    gas_type: "Air",
    pressure_bar: "",
    status: "empty"
  });
  const [boatData, setBoatData] = useState({
    name: "",
    max_capacity: "",
    status: "available"
  });

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("dive_equipment")
        .insert({
          dive_center_id: diveCenterId,
          equipment_type: equipmentData.equipment_type,
          size: equipmentData.size || null,
          status: equipmentData.status,
          notes: equipmentData.notes || null
        });
      if (error) throw error;
      toast.success("Equipment added successfully");
      setOpen(false);
      setEquipmentData({ equipment_type: "", size: "", status: "available", notes: "" });
      onItemAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to add equipment");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTank = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("dive_tanks")
        .insert({
          dive_center_id: diveCenterId,
          tank_number: tankData.tank_number,
          gas_type: tankData.gas_type,
          pressure_bar: tankData.pressure_bar ? parseInt(tankData.pressure_bar) : null,
          status: tankData.status
        });
      if (error) throw error;
      toast.success("Tank added successfully");
      setOpen(false);
      setTankData({ tank_number: "", gas_type: "Air", pressure_bar: "", status: "empty" });
      onItemAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to add tank");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBoat = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("boats")
        .insert({
          dive_center_id: diveCenterId,
          name: boatData.name,
          max_capacity: parseInt(boatData.max_capacity),
          status: boatData.status
        });
      if (error) throw error;
      toast.success("Boat added successfully");
      setOpen(false);
      setBoatData({ name: "", max_capacity: "", status: "available" });
      onItemAdded();
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
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="equipment" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="tank">Tank</TabsTrigger>
            <TabsTrigger value="boat">Boat</TabsTrigger>
          </TabsList>
          
          <TabsContent value="equipment">
            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div>
                <Label htmlFor="equipment_type">Equipment Type</Label>
                <Select 
                  value={equipmentData.equipment_type} 
                  onValueChange={(value) => setEquipmentData({ ...equipmentData, equipment_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BCD">BCD</SelectItem>
                    <SelectItem value="Regulator">Regulator</SelectItem>
                    <SelectItem value="Wetsuit">Wetsuit</SelectItem>
                    <SelectItem value="Fins">Fins</SelectItem>
                    <SelectItem value="Mask">Mask</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="size">Size (Required)</Label>
                <Input
                  id="size"
                  value={equipmentData.size}
                  onChange={(e) => setEquipmentData({ ...equipmentData, size: e.target.value })}
                  placeholder="e.g., S, M, L, XL, 38-40"
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={equipmentData.status} onValueChange={(value) => setEquipmentData({ ...equipmentData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={equipmentData.notes}
                  onChange={(e) => setEquipmentData({ ...equipmentData, notes: e.target.value })}
                  rows={2}
                  maxLength={500}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Equipment"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="tank">
            <form onSubmit={handleAddTank} className="space-y-4">
              <div>
                <Label htmlFor="tank_number">Tank Number</Label>
                <Input
                  id="tank_number"
                  required
                  value={tankData.tank_number}
                  onChange={(e) => setTankData({ ...tankData, tank_number: e.target.value })}
                  placeholder="e.g., T-001"
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="gas_type">Gas Type</Label>
                <Select value={tankData.gas_type} onValueChange={(value) => setTankData({ ...tankData, gas_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Air">Air</SelectItem>
                    <SelectItem value="Nitrox 32">Nitrox 32</SelectItem>
                    <SelectItem value="Nitrox 36">Nitrox 36</SelectItem>
                    <SelectItem value="Trimix">Trimix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pressure_bar">Pressure (bar)</Label>
                <Input
                  id="pressure_bar"
                  type="number"
                  min="0"
                  max="300"
                  value={tankData.pressure_bar}
                  onChange={(e) => setTankData({ ...tankData, pressure_bar: e.target.value })}
                  placeholder="e.g., 200"
                />
              </div>
              <div>
                <Label htmlFor="tank_status">Status</Label>
                <Select value={tankData.status} onValueChange={(value) => setTankData({ ...tankData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">Empty</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="needs_checking">Needs Checking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Tank"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="boat">
            <form onSubmit={handleAddBoat} className="space-y-4">
              <div>
                <Label htmlFor="name">Boat Name</Label>
                <Input
                  id="name"
                  required
                  value={boatData.name}
                  onChange={(e) => setBoatData({ ...boatData, name: e.target.value })}
                  placeholder="e.g., Ocean Explorer"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="max_capacity">Maximum Capacity (Passengers)</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={boatData.max_capacity}
                  onChange={(e) => setBoatData({ ...boatData, max_capacity: e.target.value })}
                  placeholder="e.g., 12"
                />
              </div>
              <div>
                <Label htmlFor="boat_status">Status</Label>
                <Select value={boatData.status} onValueChange={(value) => setBoatData({ ...boatData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Boat"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
