import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Award, MapPin, Users, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, []);

  const fetchProfile = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.session.user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchPosts = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) return;

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', session.session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
  };

  const stats = [
    { label: "Dives", value: profile?.total_dives || 0 },
    { label: "Followers", value: "0" },
    { label: "Following", value: "0" },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pt-4 pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pt-4 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-24 h-24 mb-4 border-4 border-accent/20">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-accent text-accent-foreground text-2xl">
              {(profile.full_name || profile.username).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold mb-1">{profile.full_name || profile.username}</h2>
          <p className="text-muted-foreground mb-2">{profile.bio || 'Diver'}</p>
          {profile.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-8 mb-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 w-full max-w-sm">
            <Button variant="accent" className="flex-1">
              Edit Profile
            </Button>
            <Button variant="outline" className="flex-1">
              Share Profile
            </Button>
          </div>
        </div>

        {/* Certifications */}
        {profile.certifications && profile.certifications.length > 0 && (
          <Card className="p-4 mb-6 border-accent/20">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Certifications</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.certifications.map((cert: string, idx: number) => (
                <Badge key={idx} variant="secondary">{cert}</Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            {posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div 
                    key={post.id}
                    className="aspect-square bg-muted rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src={post.image_url} 
                      alt={post.caption || 'Post'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No posts yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              No saved posts yet
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </AuthGuard>
  );
};

export default Profile;
