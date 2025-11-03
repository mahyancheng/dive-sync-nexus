import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditExperienceDialogProps {
  experienceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExperienceUpdated: () => void;
}

const EditExperienceDialog = ({ experienceId, open, onOpenChange, onExperienceUpdated }: EditExperienceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    duration: "",
    difficulty: "All levels",
    max_depth: "",
    total_spots: "10",
    spots_left: "10",
    includes: "",
    current_image: "",
  });

  useEffect(() => {
    if (open && experienceId) {
      fetchExperience();
    }
  }, [open, experienceId]);

  const fetchExperience = async () => {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("id", experienceId)
      .single();

    if (error) {
      toast.error("Failed to load experience");
      return;
    }

    setFormData({
      title: data.title || "",
      description: data.description || "",
      location: data.location || "",
      price: data.price?.toString() || "",
      duration: data.duration || "",
      difficulty: data.difficulty || "All levels",
      max_depth: data.max_depth || "",
      total_spots: data.total_spots?.toString() || "10",
      spots_left: data.spots_left?.toString() || "10",
      includes: data.includes?.join(", ") || "",
      current_image: data.image_url || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let image_url = formData.current_image;

      // Upload new image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `experiences/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('marketplace')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('marketplace')
          .getPublicUrl(filePath);

        image_url = publicUrl;
      }

      const includesArray = formData.includes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const { error } = await supabase.from("experiences").update({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        price: parseFloat(formData.price),
        duration: formData.duration,
        difficulty: formData.difficulty,
        max_depth: formData.max_depth || null,
        total_spots: parseInt(formData.total_spots),
        spots_left: parseInt(formData.spots_left),
        image_url,
        includes: includesArray,
      }).eq("id", experienceId);

      if (error) throw error;

      toast.success("Experience updated successfully");
      onOpenChange(false);
      onExperienceUpdated();
    } catch (error: any) {
      toast.error(error.message || "Failed to update experience");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Experience</DialogTitle>
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="spots_left">Spots Left *</Label>
              <Input
                id="spots_left"
                type="number"
                min="0"
                value={formData.spots_left}
                onChange={(e) => setFormData({ ...formData, spots_left: e.target.value })}
                required
              />
            </div>
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
            />
          </div>

          <div>
            <Label htmlFor="image">Experience Image</Label>
            {formData.current_image && (
              <img src={formData.current_image} alt="Current" className="w-24 h-24 object-cover rounded mb-2" />
            )}
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Experience"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExperienceDialog;
