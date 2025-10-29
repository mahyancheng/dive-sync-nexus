import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().max(100, "Name must be less than 100 characters").optional(),
  bio: z.string().trim().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().trim().max(100, "Location must be less than 100 characters").optional(),
  avatar_url: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
});

interface EditProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onProfileUpdate: () => void;
}

const EditProfile = ({ open, onOpenChange, profile, onProfileUpdate }: EditProfileProps) => {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [certifications, setCertifications] = useState<string[]>(profile?.certifications || []);
  const [newCert, setNewCert] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddCertification = () => {
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()]);
      setNewCert("");
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setCertifications(certifications.filter((c) => c !== cert));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Validate input
      const validation = profileSchema.safeParse({
        full_name: fullName,
        bio: bio,
        location: location,
        avatar_url: avatarUrl,
      });

      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        toast({
          title: "Error",
          description: "You must be logged in to edit your profile",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          certifications: certifications,
        })
        .eq("id", session.session.user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      onProfileUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              maxLength={100}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you based?"
              maxLength={100}
            />
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <Label>Certifications</Label>
            <div className="flex gap-2">
              <Input
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                placeholder="Add certification"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCertification();
                  }
                }}
                maxLength={50}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddCertification}
                disabled={!newCert.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {certifications.map((cert, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {cert}
                    <button
                      onClick={() => handleRemoveCertification(cert)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfile;
