import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, Bookmark, Users, Sparkles } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import PostDetail from "@/components/PostDetail";

const Explore = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!inner(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      setPosts(data);
    }
  };

  const renderPostGrid = (postList: any[]) => (
    <div className="grid grid-cols-2 gap-3">
      {postList.map((post) => (
        <Card 
          key={post.id}
          className="bento-card overflow-hidden border-accent/20 hover:shadow-glow transition-all cursor-pointer group"
          onClick={() => setSelectedPostId(post.id)}
        >
          {/* Image */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={post.image_url}
              alt={post.caption || 'Post'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {/* Overlay stats */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-white">
                <Heart className="w-5 h-5 fill-white" />
                <span className="font-semibold">{post.likes_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-white">
                <MessageCircle className="w-5 h-5 fill-white" />
                <span className="font-semibold">{post.comments_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {(post.profiles?.full_name || post.profiles?.username || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {post.profiles?.full_name || post.profiles?.username || 'Unknown'}
                </p>
              </div>
            </div>
            {post.caption && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {post.caption}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pt-4 pb-20">
        <div className="container mx-auto px-4 max-w-7xl pt-16">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Discover</h1>
            <p className="text-muted-foreground">Explore posts from divers around the world</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="suggested" className="space-y-6">
            <TabsList>
              <TabsTrigger value="suggested">
                <Sparkles className="w-4 h-4 mr-2" />
                Suggested
              </TabsTrigger>
              <TabsTrigger value="following">
                <Users className="w-4 h-4 mr-2" />
                Following
              </TabsTrigger>
            </TabsList>

            {/* Suggested Posts Tab */}
            <TabsContent value="suggested" className="mt-0">
              {posts.length > 0 ? (
                renderPostGrid(posts)
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No posts yet</p>
                  <p className="text-sm text-muted-foreground">Check back later for suggested content</p>
                </div>
              )}
            </TabsContent>

            {/* Following Tab */}
            <TabsContent value="following" className="mt-0">
              {posts.length > 0 ? (
                renderPostGrid(posts)
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No posts from people you follow</p>
                  <p className="text-sm text-muted-foreground">Start following divers to see their posts here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Post Detail Modal */}
        {selectedPostId && (
          <PostDetail 
            postId={selectedPostId}
            onClose={() => setSelectedPostId(null)}
          />
        )}
      </div>
    </AuthGuard>
  );
};

export default Explore;
