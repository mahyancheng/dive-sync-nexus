import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Award, MapPin, Users, TrendingUp, Plus, Calendar, Waves, Clock, Gauge, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import PostDetail from "@/components/PostDetail";
import EditProfile from "@/components/EditProfile";
import { motion } from "framer-motion";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isDiveLogsOpen, setIsDiveLogsOpen] = useState(true);
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
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
      .select(`
        *,
        dive_logs(*)
      `)
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

        {/* Profile Card with Background Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full h-[420px] rounded-3xl border border-border/20 overflow-hidden shadow-xl shadow-black/5 mb-6"
        >
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={profile.avatar_url || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=800&fit=crop&auto=format&q=80"}
              alt={profile.full_name || profile.username}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 via-background/20 via-background/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background/90 via-background/60 via-background/30 via-background/15 via-background/8 to-transparent backdrop-blur-[1px]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/85 via-background/40 to-transparent backdrop-blur-sm" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
            {/* Name and Location */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {profile.full_name || profile.username}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                {profile.bio || 'Diving enthusiast exploring the ocean depths'}
              </p>
              {profile.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {/* Certification Tags */}
              {profile.certifications && profile.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.certifications.map((cert: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2 h-5">
                      {cert}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Waves className="w-4 h-4" />
                <span className="font-semibold text-foreground">{stats[0].value}</span>
                <span className="text-sm">dives</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="font-semibold text-foreground">{stats[1].value}</span>
                <span className="text-sm">followers</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold text-foreground">{stats[2].value}</span>
                <span className="text-sm">following</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button 
                variant="accent" 
                size="sm" 
                className="flex-1"
                onClick={() => setIsEditProfileOpen(true)}
              >
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Share Profile
              </Button>
            </div>
            <Button 
              variant="default" 
              size="sm"
              className="w-full"
              onClick={() => navigate('/create-post')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            {posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div 
                    key={post.id}
                    className="aspect-square bg-muted rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedPostId(post.id)}
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

          <TabsContent value="statistics" className="mt-4 space-y-4">
            {/* Dashboard Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Waves className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile?.total_dives || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Dives</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {posts.filter(p => p.dive_logs && p.dive_logs.length > 0)
                        .reduce((total, post) => {
                          const durations = post.dive_logs.map((log: any) => {
                            const match = log.duration?.match(/(\d+)/);
                            return match ? parseInt(match[1]) : 0;
                          });
                          return total + durations.reduce((a: number, b: number) => a + b, 0);
                        }, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Minutes</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Gauge className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {posts.filter(p => p.dive_logs && p.dive_logs.length > 0).length > 0
                        ? Math.max(...posts.filter(p => p.dive_logs && p.dive_logs.length > 0)
                            .flatMap(post => post.dive_logs.map((log: any) => {
                              const match = log.max_depth?.match(/(\d+)/);
                              return match ? parseInt(match[1]) : 0;
                            })))
                        : 0}m
                    </p>
                    <p className="text-xs text-muted-foreground">Max Depth</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile?.certifications?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Certifications</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Activity Calendar */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">Dive Activity</h3>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }).map((_, i) => {
                  const hasDive = Math.random() > 0.7; // Placeholder logic
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-sm ${
                        hasDive ? 'bg-accent' : 'bg-muted'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Last 4 weeks</p>
            </Card>

            {/* Badges Section */}
            <Collapsible open={isBadgesOpen} onOpenChange={setIsBadgesOpen}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold">Achievements & Badges</h3>
                  </div>
                  {isBadgesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center p-3 rounded-lg bg-accent/10">
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-2">
                          <Waves className="w-6 h-6 text-accent-foreground" />
                        </div>
                        <p className="text-xs font-medium text-center">First Dive</p>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-accent/10">
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-2">
                          <Award className="w-6 h-6 text-accent-foreground" />
                        </div>
                        <p className="text-xs font-medium text-center">10 Dives</p>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 opacity-50">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                          <Gauge className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-medium text-center">50 Dives</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Dive Logs Section */}
            <Collapsible open={isDiveLogsOpen} onOpenChange={setIsDiveLogsOpen}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-2 flex-1">
                    <Waves className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold">Dive Logs</h3>
                    <Badge variant="secondary">{posts.filter(p => p.dive_logs && p.dive_logs.length > 0).length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/create-post');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                    {isDiveLogsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0">
                    {posts.filter(p => p.dive_logs && p.dive_logs.length > 0).length > 0 ? (
                      <div className="space-y-3">
                        {posts.filter(p => p.dive_logs && p.dive_logs.length > 0).map((post) => (
                          post.dive_logs?.map((log: any) => (
                            <Card key={log.id} className="p-4 bg-muted/30">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{log.site}</h4>
                                <Badge variant="secondary">{log.max_depth}</Badge>
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                                <span>Duration: {log.duration}</span>
                                {log.visibility && <span>Visibility: {log.visibility}</span>}
                              </div>
                              <p className="text-sm text-muted-foreground">{log.notes || 'No notes'}</p>
                            </Card>
                          ))
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No dive logs yet
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              No saved posts yet
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>

    {selectedPostId && (
      <PostDetail 
        postId={selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />
    )}

    <EditProfile
      open={isEditProfileOpen}
      onOpenChange={setIsEditProfileOpen}
      profile={profile}
      onProfileUpdate={fetchProfile}
    />
    </AuthGuard>
  );
};

export default Profile;
