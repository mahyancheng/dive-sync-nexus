import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Image as ImageIcon } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

const CreatePost = () => {
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a post",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          image_url: imageUrl,
          caption: caption || null,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your post has been created",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 glass-effect border-b border-accent/20">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Create Post</h1>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Share Your Dive</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Paste a URL to an image you'd like to share
                </p>
              </div>

              {imagePreview && (
                <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-muted">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => {
                      setImagePreview("");
                      toast({
                        title: "Error",
                        description: "Could not load image from URL",
                        variant: "destructive",
                      });
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Share your dive story..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !imageUrl}>
                {loading ? "Posting..." : "Create Post"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    </AuthGuard>
  );
};

export default CreatePost;
