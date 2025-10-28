import { X, MapPin, Calendar, Anchor, Trophy, Users, Camera, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Portal from "./Portal";
import { supabase } from "@/integrations/supabase/client";

interface ProfileDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id?: string;
    name: string;
    avatar?: string;
    role: string;
    location?: string;
    bio?: string;
    totalDives?: number;
    certifications?: string[];
    joinedDate?: string;
    posts?: Array<{
      image: string;
      caption: string;
      likes: number;
    }>;
  };
}

const ProfileDetail = ({ open, onOpenChange, profile }: ProfileDetailProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onOpenChange(false);
      setIsClosing(false);
    }, 300);
  };

const handleMessage = async () => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    navigate('/auth');
    return;
  }

  const otherId = profile.id;
  if (!otherId) {
    navigate('/messages');
    return;
  }

  // Use RPC to create or get a DM while bypassing RLS safely
  await supabase.rpc('create_or_get_direct_conversation', { target_user_id: otherId });
  navigate('/messages');
};

if (!open) return null;

return (
  <Portal>
    <div style={{ position: 'fixed' }} className="inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div 
        className={`relative w-full max-w-2xl max-h-[85vh] bg-card rounded-t-3xl shadow-2xl overflow-hidden ${
          isClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'
        }`}
      >
          {/* Header with Cover */}
          <div className="relative h-32 bg-gradient-to-br from-accent via-primary to-coral">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800')] bg-cover bg-center opacity-30" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-4">
              <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="bg-accent text-accent-foreground text-2xl">
                  {profile.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.role}</p>
                {profile.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mb-2">
                <Button variant="accent">
                  <Users className="w-4 h-4 mr-2" />
                  Follow
                </Button>
                <Button variant="outline" size="icon" onClick={handleMessage}>
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4 text-center border-accent/20">
                <Anchor className="w-5 h-5 text-accent mx-auto mb-1" />
                <div className="text-2xl font-bold text-accent">{profile.totalDives || 0}</div>
                <div className="text-xs text-muted-foreground">Total Dives</div>
              </Card>
              <Card className="p-4 text-center border-accent/20">
                <Trophy className="w-5 h-5 text-coral mx-auto mb-1" />
                <div className="text-2xl font-bold text-coral">{profile.certifications?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Certifications</div>
              </Card>
              <Card className="p-4 text-center border-accent/20">
                <Camera className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-2xl font-bold text-primary">{profile.posts?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </Card>
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                <TabsTrigger value="certifications" className="flex-1">Certifications</TabsTrigger>
                <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
              </TabsList>

              <div className="max-h-[250px] overflow-y-auto mt-4">
                <TabsContent value="posts" className="mt-0">
                  {profile.posts && profile.posts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {profile.posts.map((post, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                          <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm">{post.likes} likes</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No posts yet</p>
                  )}
                </TabsContent>

                <TabsContent value="certifications" className="mt-0">
                  {profile.certifications && profile.certifications.length > 0 ? (
                    <div className="space-y-2">
                      {profile.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                          <Trophy className="w-5 h-5 text-accent" />
                          <span className="font-medium">{cert}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No certifications listed</p>
                  )}
                </TabsContent>

                <TabsContent value="about" className="mt-0">
                  <div className="space-y-3">
                    {profile.joinedDate && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Joined</p>
                          <p className="text-sm text-muted-foreground">{profile.joinedDate}</p>
                        </div>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Location</p>
                          <p className="text-sm text-muted-foreground">{profile.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ProfileDetail;
