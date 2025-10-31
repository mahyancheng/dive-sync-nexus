import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface EditTankDialogProps {
  tank: any;
  onTankUpdated: () => void;
}

export const EditTankDialog = ({ tank, onTankUpdated }: EditTankDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tank_number: tank.tank_number,
    gas_type: tank.gas_type,
    status: tank.status,
    pressure_bar: tank.pressure_bar || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("dive_tanks")
      .update({
        ...formData,
        pressure_bar: formData.pressure_bar ? parseInt(formData.pressure_bar) : null
      })
      .eq("id", tank.id);

    if (error) {
      toast.error("Failed to update tank");
    } else {
      toast.success("Tank updated successfully");
      setOpen(false);
      onTankUpdated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="w-3 h-3 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tank</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tank Number</Label>
            <Input
              value={formData.tank_number}
              onChange={(e) => setFormData({ ...formData, tank_number: e.target.value })}
              placeholder="e.g., 001, T-42"
            />
          </div>

          <div>
            <Label>Gas Type</Label>
            <Select
              value={formData.gas_type}
              onValueChange={(value) => setFormData({ ...formData, gas_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Air">Air</SelectItem>
                <SelectItem value="EAN32">EAN32 (Nitrox 32%)</SelectItem>
                <SelectItem value="EAN36">EAN36 (Nitrox 36%)</SelectItem>
                <SelectItem value="Trimix">Trimix</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="empty">Empty</SelectItem>
                <SelectItem value="needs_checking">Needs Checking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Pressure (bar)</Label>
            <Input
              type="number"
              value={formData.pressure_bar}
              onChange={(e) => setFormData({ ...formData, pressure_bar: e.target.value })}
              placeholder="e.g., 200"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Tank"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};