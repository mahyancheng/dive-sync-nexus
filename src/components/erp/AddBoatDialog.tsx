import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddBoatDialogProps {
  diveCenterId: string;
  onBoatAdded: () => void;
  trigger?: React.ReactNode;
}

export const AddBoatDialog = ({ diveCenterId, onBoatAdded, trigger }: AddBoatDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    max_capacity: "",
    status: "available"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("boats")
        .insert({
          dive_center_id: diveCenterId,
          name: formData.name,
          max_capacity: parseInt(formData.max_capacity),
          status: formData.status
        });

      if (error) throw error;

      toast.success("Boat added successfully");
      setOpen(false);
      setFormData({
        name: "",
        max_capacity: "",
        status: "available"
      });
      onBoatAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to add boat");
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
            Add Boat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Boat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Boat Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              value={formData.max_capacity}
              onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
              placeholder="e.g., 12"
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
                <SelectItem value="in-use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Boat"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
