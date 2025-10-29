import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

const CreatePost = () => {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Dive log fields
  const [includeDiveLog, setIncludeDiveLog] = useState(false);
  const [site, setSite] = useState("");
  const [maxDepth, setMaxDepth] = useState("");
  const [duration, setDuration] = useState("");
  const [visibility, setVisibility] = useState("");
  const [temperature, setTemperature] = useState("");
  const [avgDepth, setAvgDepth] = useState("");
  const [airConsumption, setAirConsumption] = useState("");
  const [notes, setNotes] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      setImagePreview(URL.createObjectURL(f));
    } else {
      setImagePreview("");
    }
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

      // Upload media to storage
      let publicUrl: string | null = null;
      if (file) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('posts').upload(path, file, {
          contentType: file.type,
        });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from('posts').getPublicUrl(path);
        publicUrl = publicData.publicUrl;
      }

      // Create post
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          image_url: publicUrl,
          caption: caption || null,
        })
        .select()
        .single();

      if (postError) throw postError;

      // If dive log is included, create dive log entry
      if (includeDiveLog && postData && site && maxDepth && duration && visibility) {
        const { error: diveLogError } = await supabase
          .from("dive_logs")
          .insert({
            post_id: postData.id,
            site,
            max_depth: maxDepth,
            avg_depth: avgDepth || null,
            duration,
            visibility,
            temperature: temperature || null,
            air_consumption: airConsumption || null,
            notes: notes || null,
            coordinates_lat: lat ? parseFloat(lat) : null,
            coordinates_lng: lng ? parseFloat(lng) : null,
          });

        if (diveLogError) throw diveLogError;
      }

      toast({
        title: "Success!",
        description: includeDiveLog ? "Your post and dive log have been created" : "Your post has been created",
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
                <Label htmlFor="media">Upload Media</Label>
                <Input
                  id="media"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Upload an image from your device
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

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Post</TabsTrigger>
                  <TabsTrigger value="divelog" onClick={() => setIncludeDiveLog(true)}>+ Dive Log</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Share a simple post without dive log details
                  </p>
                </TabsContent>

                <TabsContent value="divelog" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="site">Dive Site *</Label>
                      <Input
                        id="site"
                        placeholder="Blue Corner Wall"
                        value={site}
                        onChange={(e) => setSite(e.target.value)}
                        required={includeDiveLog}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-depth">Max Depth *</Label>
                      <Input
                        id="max-depth"
                        placeholder="28m"
                        value={maxDepth}
                        onChange={(e) => setMaxDepth(e.target.value)}
                        required={includeDiveLog}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avg-depth">Avg Depth</Label>
                      <Input
                        id="avg-depth"
                        placeholder="18m"
                        value={avgDepth}
                        onChange={(e) => setAvgDepth(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration *</Label>
                      <Input
                        id="duration"
                        placeholder="45 min"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required={includeDiveLog}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visibility">Visibility *</Label>
                      <Input
                        id="visibility"
                        placeholder="25m"
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                        required={includeDiveLog}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        placeholder="24°C"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="air">Air Consumption</Label>
                      <Input
                        id="air"
                        placeholder="180 bar"
                        value={airConsumption}
                        onChange={(e) => setAirConsumption(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lat">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        Latitude
                      </Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        placeholder="-8.0891"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lng">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        Longitude
                      </Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        placeholder="134.2167"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="notes">Dive Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Saw manta rays and gray reef sharks..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full" disabled={loading || !file}>
                {loading ? "Posting..." : includeDiveLog ? "Create Post with Dive Log" : "Create Post"}
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
