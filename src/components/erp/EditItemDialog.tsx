import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditItemDialogProps {
  itemId: string | null;
  itemCategory: "equipment" | "tank" | "boat" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: () => void;
}

export const EditItemDialog = ({ itemId, itemCategory, open, onOpenChange, onItemUpdated }: EditItemDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (open && itemId && itemCategory) {
      fetchItemData();
    }
  }, [open, itemId, itemCategory]);

  const fetchItemData = async () => {
    if (!itemId || !itemCategory) return;
    
    const realId = itemId.replace(`${itemCategory}-`, '');
    const tableName = itemCategory === "equipment" ? "dive_equipment" : itemCategory === "tank" ? "dive_tanks" : "boats";

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", realId)
        .single();

      if (error) throw error;
      if (data) setFormData(data);
    } catch (error: any) {
      toast.error("Failed to load item data");
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !itemCategory) return;

    setLoading(true);
    const realId = itemId.replace(`${itemCategory}-`, '');
    const tableName = itemCategory === "equipment" ? "dive_equipment" : itemCategory === "tank" ? "dive_tanks" : "boats";

    try {
      const updateData: any = {};

      if (itemCategory === "equipment") {
        updateData.equipment_type = formData.equipment_type;
        updateData.size = formData.size || null;
        updateData.status = formData.status;
        updateData.notes = formData.notes || null;
      } else if (itemCategory === "tank") {
        updateData.tank_number = formData.tank_number;
        updateData.gas_type = formData.gas_type;
        updateData.pressure_bar = formData.pressure_bar ? parseInt(formData.pressure_bar) : null;
        updateData.status = formData.status;
        
        if (formData.gas_type === "Nitrox") {
          updateData.nitrox_o2_percentage = formData.nitrox_o2_percentage ? parseFloat(formData.nitrox_o2_percentage) : null;
          updateData.nitrox_mod = formData.nitrox_mod ? parseFloat(formData.nitrox_mod) : null;
        } else {
          // Clear Nitrox fields if changing back to Air
          updateData.nitrox_o2_percentage = null;
          updateData.nitrox_mod = null;
        }
      } else if (itemCategory === "boat") {
        updateData.name = formData.name;
        updateData.max_capacity = parseInt(formData.max_capacity);
        updateData.status = formData.status;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", realId);

      if (error) throw error;

      toast.success("Item updated successfully");
      onOpenChange(false);
      onItemUpdated();
    } catch (error: any) {
      toast.error(error.message || "Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    if (!itemCategory) return null;

    if (itemCategory === "equipment") {
      return (
        <>
          <div>
            <Label htmlFor="equipment_type">Equipment Type</Label>
            <Select 
              value={formData.equipment_type || ""} 
              onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}
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
            <Label htmlFor="size">Size</Label>
            <Input
              id="size"
              value={formData.size || ""}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder="e.g., S, M, L, XL, 38-40"
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status || "available"} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              maxLength={500}
            />
          </div>
        </>
      );
    }

    if (itemCategory === "tank") {
      return (
        <>
          <div>
            <Label htmlFor="tank_number">Tank Number</Label>
            <Input
              id="tank_number"
              required
              value={formData.tank_number || ""}
              onChange={(e) => setFormData({ ...formData, tank_number: e.target.value })}
              placeholder="e.g., T-001"
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="gas_type">Gas Type</Label>
            <Select value={formData.gas_type || "Air"} onValueChange={(value) => setFormData({ ...formData, gas_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Air">Compressed Air</SelectItem>
                <SelectItem value="Nitrox">Nitrox</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.gas_type === "Nitrox" && (
            <>
              <div>
                <Label htmlFor="nitrox_o2_percentage">O2 Percentage (%)</Label>
                <Input
                  id="nitrox_o2_percentage"
                  type="number"
                  min="21"
                  max="40"
                  step="0.1"
                  required
                  value={formData.nitrox_o2_percentage || ""}
                  onChange={(e) => setFormData({ ...formData, nitrox_o2_percentage: e.target.value })}
                  placeholder="e.g., 32"
                />
              </div>
              <div>
                <Label htmlFor="nitrox_mod">Maximum Operating Depth (m)</Label>
                <Input
                  id="nitrox_mod"
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={formData.nitrox_mod || ""}
                  onChange={(e) => setFormData({ ...formData, nitrox_mod: e.target.value })}
                  placeholder="e.g., 34"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="pressure_bar">Pressure (bar)</Label>
            <Input
              id="pressure_bar"
              type="number"
              min="0"
              max="300"
              value={formData.pressure_bar || ""}
              onChange={(e) => setFormData({ ...formData, pressure_bar: e.target.value })}
              placeholder="e.g., 200"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status || "empty"} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
        </>
      );
    }

    if (itemCategory === "boat") {
      return (
        <>
          <div>
            <Label htmlFor="name">Boat Name</Label>
            <Input
              id="name"
              required
              value={formData.name || ""}
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
              value={formData.max_capacity || ""}
              onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
              placeholder="e.g., 12"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status || "available"} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
        </>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {itemCategory === "equipment" ? "Equipment" : itemCategory === "tank" ? "Tank" : "Boat"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
