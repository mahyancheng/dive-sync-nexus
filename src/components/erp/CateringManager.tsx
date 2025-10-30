import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UtensilsCrossed } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface CateringManagerProps {
  bookingId: string;
  catering?: any;
  participantsCount: number;
  onCateringUpdated: () => void;
}

export const CateringManager = ({ bookingId, catering, participantsCount, onCateringUpdated }: CateringManagerProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    total_pax: catering?.total_pax || participantsCount,
    preparation_status: catering?.preparation_status || "planned",
    notes: catering?.notes || "",
    meal_items: catering?.meal_items || [],
  });

  const mealOptions = [
    "Sandwiches",
    "Fruit Platter",
    "Snack Bars",
    "Bottled Water",
    "Soft Drinks",
    "Hot Drinks",
    "Cookies",
    "Chips",
  ];

  const handleMealItemToggle = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      meal_items: prev.meal_items.includes(item)
        ? prev.meal_items.filter((i: string) => i !== item)
        : [...prev.meal_items, item],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cateringData = {
        booking_id: bookingId,
        total_pax: parseInt(formData.total_pax.toString()),
        meal_items: formData.meal_items,
        preparation_status: formData.preparation_status,
        notes: formData.notes,
      };

      if (catering?.id) {
        await supabase
          .from("trip_catering")
          .update(cateringData)
          .eq("id", catering.id);
      } else {
        await supabase.from("trip_catering").insert(cateringData);
      }

      toast.success("Catering updated successfully");
      onCateringUpdated();
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update catering");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "prepared": return "bg-green-500";
      case "ordered": return "bg-blue-500";
      case "planned": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UtensilsCrossed className="w-4 h-4" />
          {catering ? "Update Catering" : "Add Catering"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Trip Catering Management</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {catering && (
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(catering.preparation_status)}>
                {catering.preparation_status.toUpperCase()}
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_pax">Total Participants</Label>
              <Input
                id="total_pax"
                type="number"
                value={formData.total_pax}
                onChange={(e) => setFormData({ ...formData, total_pax: parseInt(e.target.value) })}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Preparation Status</Label>
              <Select
                value={formData.preparation_status}
                onValueChange={(value) => setFormData({ ...formData, preparation_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="prepared">Prepared</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Meal Items Checklist</Label>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
              {mealOptions.map((item) => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    id={item}
                    checked={formData.meal_items.includes(item)}
                    onCheckedChange={() => handleMealItemToggle(item)}
                  />
                  <label
                    htmlFor={item}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Dietary restrictions, special requests, etc."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Catering Plan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
