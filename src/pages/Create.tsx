import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Video, Image as ImageIcon, X } from "lucide-react";

const Create = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pt-4 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create Post</h1>
          <Button variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Upload Options */}
        <div className="space-y-4">
          <Card 
            className="p-6 border-accent/20 hover:shadow-ocean transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Camera className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Take Photo</h3>
                <p className="text-sm text-muted-foreground">
                  Capture your dive adventure
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 border-accent/20 hover:shadow-ocean transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center">
                <Video className="w-6 h-6 text-coral" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Record Video</h3>
                <p className="text-sm text-muted-foreground">
                  Share your underwater experience
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 border-accent/20 hover:shadow-ocean transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Upload from Gallery</h3>
                <p className="text-sm text-muted-foreground">
                  Choose photos or videos
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tips */}
        <Card className="mt-6 p-4 bg-accent/5 border-accent/20">
          <h4 className="font-semibold mb-2 text-accent">Tips for great posts</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use good lighting and stable footage</li>
            <li>• Tag dive spots and equipment</li>
            <li>• Add dive details for the community</li>
            <li>• Link bookable trips to help others discover</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Create;
