import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddEquipmentDialogProps {
  diveCenterId: string;
  onEquipmentAdded: () => void;
  trigger?: React.ReactNode;
}

export const AddEquipmentDialog = ({ diveCenterId, onEquipmentAdded, trigger }: AddEquipmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    equipment_type: "",
    size: "",
    status: "available",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("dive_equipment")
        .insert({
          dive_center_id: diveCenterId,
          equipment_type: formData.equipment_type,
          size: formData.size || null,
          status: formData.status,
          notes: formData.notes || null
        });

      if (error) throw error;

      toast.success("Equipment added successfully");
      setOpen(false);
      setFormData({
        equipment_type: "",
        size: "",
        status: "available",
        notes: ""
      });
      onEquipmentAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to add equipment");
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
            Add Equipment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="equipment_type">Equipment Type</Label>
            <Select value={formData.equipment_type} onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BCD">BCD</SelectItem>
                <SelectItem value="Regulator">Regulator</SelectItem>
                <SelectItem value="Wetsuit">Wetsuit</SelectItem>
                <SelectItem value="Fins">Fins</SelectItem>
                <SelectItem value="Mask">Mask</SelectItem>
                <SelectItem value="Dive Computer">Dive Computer</SelectItem>
                <SelectItem value="Weight Belt">Weight Belt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="size">Size</Label>
            <Input
              id="size"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder="e.g., M, L, XL"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Equipment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
