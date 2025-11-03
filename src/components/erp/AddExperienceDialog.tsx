import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddExperienceDialogProps {
  onExperienceAdded: () => void;
  diveCenterId: string;
}

const AddExperienceDialog = ({ onExperienceAdded, diveCenterId }: AddExperienceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    duration: "",
    difficulty: "All levels",
    max_depth: "",
    total_spots: "10",
    image_url: "",
    includes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const includesArray = formData.includes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const { error } = await supabase.from("experiences").insert({
        dive_center_id: diveCenterId,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        price: parseFloat(formData.price),
        duration: formData.duration,
        difficulty: formData.difficulty,
        max_depth: formData.max_depth || null,
        total_spots: parseInt(formData.total_spots),
        spots_left: parseInt(formData.total_spots),
        image_url: formData.image_url || null,
        includes: includesArray,
      });

      if (error) throw error;

      toast.success("Experience added successfully");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        location: "",
        price: "",
        duration: "",
        difficulty: "All levels",
        max_depth: "",
        total_spots: "10",
        image_url: "",
        includes: "",
      });
      onExperienceAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to add experience");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Experience
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Diving Experience</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Experience Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (USD) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 3 hours, Full day"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty Level *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All levels">All levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="max_depth">Max Depth</Label>
              <Input
                id="max_depth"
                value={formData.max_depth}
                onChange={(e) => setFormData({ ...formData, max_depth: e.target.value })}
                placeholder="e.g., 30m"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="total_spots">Total Spots *</Label>
            <Input
              id="total_spots"
              type="number"
              min="1"
              value={formData.total_spots}
              onChange={(e) => setFormData({ ...formData, total_spots: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="includes">What's Included (comma-separated)</Label>
            <Input
              id="includes"
              value={formData.includes}
              onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
              placeholder="e.g., Equipment, Guide, Lunch"
            />
          </div>

          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Experience"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExperienceDialog;
