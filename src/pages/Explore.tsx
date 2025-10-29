import { useState, useEffect } from "react";
import FeedPost from "@/components/FeedPost";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AuthGuard from "@/components/AuthGuard";

const Explore = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(id, username, full_name, avatar_url, bio),
        dive_logs(
          *,
          dive_buddies(buddy_name, buddy_avatar)
        ),
        dive_centers(name, location, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedPosts = data.map((post: any) => ({
        author: {
          id: post.profiles?.id,
          name: post.profiles?.full_name || post.profiles?.username || 'Unknown',
          avatar: post.profiles?.avatar_url || '',
          role: post.profiles?.bio || 'Diver'
        },
        image: post.image_url,
        caption: post.caption,
        likes: post.likes_count,
        comments: post.comments_count,
        diveLogs: post.dive_logs?.map((log: any) => ({
          site: log.site,
          maxDepth: log.max_depth,
          avgDepth: log.avg_depth,
          duration: log.duration,
          visibility: log.visibility,
          temperature: log.temperature,
          airConsumption: log.air_consumption,
          coordinates: log.coordinates_lat && log.coordinates_lng ? {
            lat: parseFloat(log.coordinates_lat),
            lng: parseFloat(log.coordinates_lng)
          } : undefined,
          notes: log.notes,
          buddies: log.dive_buddies?.map((b: any) => ({
            name: b.buddy_name,
            avatar: b.buddy_avatar
          }))
        })),
        diveCenter: post.dive_centers ? {
          name: post.dive_centers.name,
          location: post.dive_centers.location,
          avatar: post.dive_centers.avatar_url
        } : undefined
      }));
      setPosts(formattedPosts);
    }
  };

  return (
    <AuthGuard>
      <div className="h-screen snap-y snap-mandatory overflow-y-scroll bg-black">
        {posts.length === 0 ? (
          <div className="h-screen flex items-center justify-center text-white px-8 text-center">
            <div>
              <p className="text-xl mb-4">No posts yet</p>
              <p className="text-muted-foreground mb-6">Be the first to share your dive!</p>
              <Button onClick={() => window.location.href = '/create-post'} variant="accent">
                Create Post
              </Button>
            </div>
          </div>
        ) : (
          posts.map((post, index) => (
            <FeedPost key={index} {...post} />
          ))
        )}
      </div>
    </AuthGuard>
  );
};

export default Explore;
