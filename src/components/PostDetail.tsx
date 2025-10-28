import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface PostDetailProps {
  postId: string;
  onClose: () => void;
}

interface PostWithAuthor {
  id: string;
  caption: string | null;
  image_url: string;
  likes_count: number | null;
  comments_count: number | null;
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

const PostDetail = ({ postId, onClose }: PostDetailProps) => {
  const [open, setOpen] = useState(true);
  const [post, setPost] = useState<PostWithAuthor | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      const { data } = await supabase
        .from('posts')
        .select('id, caption, image_url, likes_count, comments_count, profiles!inner(username, full_name, avatar_url)')
        .eq('id', postId)
        .maybeSingle();
      setPost(data as any);
    };
    fetchPost();
  }, [postId]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); onClose(); } }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {post ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback>
                  {(post.profiles?.full_name || post.profiles?.username || 'U').slice(0,2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{post.profiles?.full_name || post.profiles?.username || 'Unknown'}</div>
                {post.caption && <div className="text-sm text-muted-foreground line-clamp-2">{post.caption}</div>}
              </div>
            </div>
            <div className="bg-black flex items-center justify-center">
              <img src={post.image_url} alt={post.caption || 'Post image'} className="max-w-full max-h-[70vh] object-contain" />
            </div>
            <div className="p-4 text-sm text-muted-foreground flex gap-4">
              <span>Likes: {post.likes_count ?? 0}</span>
              <span>Comments: {post.comments_count ?? 0}</span>
            </div>
          </div>
        ) : (
          <div className="p-6">Loading...</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostDetail;
