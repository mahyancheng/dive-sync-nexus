import { useState, useEffect } from "react";
import FeedPost from "@/components/FeedPost";
import { NavSwitcher } from "@/components/ui/nav-switcher";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AuthGuard from "@/components/AuthGuard";

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) {
      setPosts([]);
      return;
    }

    const { data: followingRows, error: fErr } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', uid);

    if (fErr) {
      console.error('[Feed] follows fetch error', fErr);
      setPosts([]);
      return;
    }

    const authorIds = (followingRows || []).map((r: any) => r.following_id);
    if (authorIds.length === 0) {
      setPosts([]);
      return;
    }

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url, bio),
        dive_logs(
          *,
          dive_buddies(buddy_name, buddy_avatar)
        ),
        dive_centers(name, location, avatar_url)
      `)
      .in('author_id', authorIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedPosts = data.map((post: any) => ({
        author: {
          id: post.author?.id,
          name: post.author?.full_name || post.author?.username || 'Unknown',
          avatar: post.author?.avatar_url || '',
          role: post.author?.bio || 'Diver'
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
    } else {
      setPosts([]);
    }
  };

  // Fallback mock data if no posts in DB - REMOVED
  const displayPosts = posts.length > 0 ? posts : [];

  return (
    <AuthGuard>
      <div className="h-screen snap-y snap-mandatory overflow-y-scroll bg-black">
        {displayPosts.length === 0 ? (
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
          displayPosts.map((post, index) => (
            <FeedPost key={index} {...post} />
          ))
        )}
      </div>
    </AuthGuard>
  );
};

export default Feed;
