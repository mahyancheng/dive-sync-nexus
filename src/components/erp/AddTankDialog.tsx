import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddTankDialogProps {
  diveCenterId: string;
  onTankAdded: () => void;
  trigger?: React.ReactNode;
}

export const AddTankDialog = ({ diveCenterId, onTankAdded, trigger }: AddTankDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tank_number: "",
    gas_type: "Air",
    pressure_bar: "",
    status: "empty"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("dive_tanks")
        .insert({
          dive_center_id: diveCenterId,
          tank_number: formData.tank_number,
          gas_type: formData.gas_type,
          pressure_bar: formData.pressure_bar ? parseInt(formData.pressure_bar) : null,
          status: formData.status
        });

      if (error) throw error;

      toast.success("Tank added successfully");
      setOpen(false);
      setFormData({
        tank_number: "",
        gas_type: "Air",
        pressure_bar: "",
        status: "empty"
      });
      onTankAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to add tank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Tank
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Gas Tank</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tank_number">Tank Number</Label>
            <Input
              id="tank_number"
              required
              value={formData.tank_number}
              onChange={(e) => setFormData({ ...formData, tank_number: e.target.value })}
              placeholder="e.g., T-001"
            />
          </div>

          <div>
            <Label htmlFor="gas_type">Gas Type</Label>
            <Select value={formData.gas_type} onValueChange={(value) => setFormData({ ...formData, gas_type: value })}>
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
              value={formData.pressure_bar}
              onChange={(e) => setFormData({ ...formData, pressure_bar: e.target.value })}
              placeholder="e.g., 200"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
      </DialogContent>
    </Dialog>
  );
};
