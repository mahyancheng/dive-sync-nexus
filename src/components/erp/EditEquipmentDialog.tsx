import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface EditEquipmentDialogProps {
  equipment: any;
  onEquipmentUpdated: () => void;
}

export const EditEquipmentDialog = ({ equipment, onEquipmentUpdated }: EditEquipmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    equipment_type: equipment.equipment_type,
    size: equipment.size || "",
    status: equipment.status,
    notes: equipment.notes || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("dive_equipment")
      .update(formData)
      .eq("id", equipment.id);

    if (error) {
      toast.error("Failed to update equipment");
    } else {
      toast.success("Equipment updated successfully");
      setOpen(false);
      onEquipmentUpdated();
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
          <DialogTitle>Edit Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Equipment Type</Label>
            <Select
              value={formData.equipment_type}
              onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BCD">BCD</SelectItem>
                <SelectItem value="Regulator">Regulator</SelectItem>
                <SelectItem value="Wetsuit">Wetsuit</SelectItem>
                <SelectItem value="Fins">Fins</SelectItem>
                <SelectItem value="Mask">Mask</SelectItem>
                <SelectItem value="Dive Computer">Dive Computer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Size</Label>
            <Input
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder="e.g., M, L, XL, or 10, 12"
            />
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
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Equipment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};