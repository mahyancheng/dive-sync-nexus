import { useState, useEffect } from "react";
import { Search as SearchIcon, X, User, Map as MapIcon, MessageCircle, Users as UsersIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductDetail from "@/components/ProductDetail";
import TripDetail from "@/components/TripDetail";
import ProfileDetail from "@/components/ProfileDetail";
import Map from "@/components/Map";
import PostDetail from "@/components/PostDetail";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SearchResult {
  type: "post" | "product" | "account";
  id: string;
  title: string;
  description?: string;
  image?: string;
  price?: number;
  username?: string;
  avatar?: string;
}

const Search = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loadingFollowIds, setLoadingFollowIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchPosts();
      fetchFollowing();
    }
  }, [isOpen]);

  const fetchFollowing = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) return;

    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.session.user.id);

    if (!error && data) {
      setFollowingIds(new Set(data.map(f => f.following_id)));
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(20);
    
    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles!inner(username, full_name, avatar_url)')
      .limit(20);
    
    if (!error && data) {
      setPosts(data);
    }
  };

const handleMessageUser = async (userId: string) => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    navigate('/auth');
    return;
  }

  // Defer conversation creation to Messages page (?u=)
  console.log('[Search] Navigate to /messages?u=', userId);
  navigate(`/messages?u=${userId}`, { state: { targetUserId: userId } });
};

const handleToggleFollow = async (userId: string, e: React.MouseEvent) => {
  e.stopPropagation();
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    navigate('/auth');
    return;
  }

  setLoadingFollowIds(prev => new Set(prev).add(userId));
  try {
    const isFollowing = followingIds.has(userId);
    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', session.session.user.id)
        .eq('following_id', userId);

      if (error) throw error;
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toast.success('Unfollowed');
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: session.session.user.id,
          following_id: userId,
        });

      if (error) throw error;
      setFollowingIds(prev => new Set(prev).add(userId));
      toast.success('Following');
    }
  } catch (error) {
    console.error('Follow error:', error);
    toast.error('Failed to update follow status');
  } finally {
    setLoadingFollowIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }
};

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    const filtered: SearchResult[] = [];

    // Search posts
    posts.forEach(post => {
      if (
        post.caption?.toLowerCase().includes(query.toLowerCase()) ||
        (post.profiles as any)?.username?.toLowerCase().includes(query.toLowerCase())
      ) {
        filtered.push({
          type: "post",
          id: post.id,
          title: post.caption || "Dive post",
          description: (post.profiles as any)?.username || "",
          image: post.image_url,
        });
      }
    });

    // Search users
    users.forEach(user => {
      if (
        user.username?.toLowerCase().includes(query.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(query.toLowerCase()) ||
        user.bio?.toLowerCase().includes(query.toLowerCase())
      ) {
        filtered.push({
          type: "account",
          id: user.id,
          title: user.full_name || user.username,
          username: `@${user.username}`,
          avatar: user.avatar_url,
          description: user.bio || "Diver",
        });
      }
    });

    setResults(filtered);
  };

  const searchPosts = results.filter((r) => r.type === "post");
  const searchProducts = results.filter((r) => r.type === "product");
  const searchAccounts = results.filter((r) => r.type === "account");

  return (
    <>
      {/* Search Button */}
      <Button
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed top-3 right-3 z-[90] rounded-full glass-effect backdrop-blur-sm h-9 w-9 md:h-10 md:w-10 md:top-4 md:right-4"
        variant="ghost"
      >
        <SearchIcon className="w-4 h-4 md:w-5 md:h-5" />
      </Button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex flex-col bg-background" style={{ position: 'fixed' }}>
          {/* Search Header */}
          <div className="sticky top-0 z-10 bg-background border-b p-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search posts, products, accounts..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 h-12"
                  autoFocus
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery("");
                  setResults([]);
                }}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {searchQuery === "" ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>Start typing to search</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>No results found</p>
              </div>
            ) : (
              <Tabs defaultValue="results" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="map">
                    <MapIcon className="w-4 h-4 mr-2" />
                    Map
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="mt-0 space-y-6">
                  {/* Posts Section */}
                  {searchPosts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Posts</h3>
                      <div className="space-y-3">
                        {searchPosts.map((post) => (
                          <Card 
                            key={post.id} 
                            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
onClick={() => {
                              setSelectedPostId(post.id);
                            }}
                          >
                            <CardContent className="p-0">
                              <div className="flex gap-3">
                                {post.image && (
                                  <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-24 h-24 object-cover"
                                  />
                                )}
                                <div className="flex-1 p-3">
                                  <h4 className="font-semibold mb-1">{post.title}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    By {post.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accounts Section */}
                  {searchAccounts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Accounts</h3>
                      <div className="space-y-3">
                        {searchAccounts.map((account) => {
                          const user = users.find(u => u.id === account.id);
                          return (
                             <Card 
                              key={account.id} 
                              className="cursor-pointer hover:shadow-lg transition-shadow"
onClick={async () => {
                                const { data: userRow } = await supabase
                                  .from('profiles')
                                  .select('*')
                                  .eq('id', account.id)
                                  .maybeSingle();

                                // Fetch user's posts
                                const { data: userPosts } = await supabase
                                  .from('posts')
                                  .select('id, image_url, caption, likes_count')
                                  .eq('author_id', account.id)
                                  .order('created_at', { ascending: false });

                                const u = userRow || users.find(u => u.id === account.id);
                                if (u) {
                                  setSelectedProfile({
                                    id: u.id,
                                    name: u.full_name || u.username,
                                    avatar: u.avatar_url,
                                    role: u.bio || 'Diver',
                                    location: u.location,
                                    bio: u.bio,
                                    totalDives: u.total_dives || 0,
                                    certifications: u.certifications || [],
                                    joinedDate: u.joined_date ? new Date(u.joined_date).toLocaleDateString() : undefined,
                                    posts: (userPosts || []).map(p => ({
                                      image: p.image_url,
                                      caption: p.caption || '',
                                      likes: p.likes_count || 0,
                                    })),
                                  });
                                }
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={account.avatar} />
                                    <AvatarFallback className="bg-accent text-accent-foreground">
                                      {account.title.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate">{account.title}</h4>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {account.username}
                                    </p>
                                    {account.description && (
                                      <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {account.description}
                                      </p>
                                    )}
                                    {user?.location && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">{user.location}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button 
                                      size="sm" 
                                      variant={followingIds.has(account.id) ? "secondary" : "outline"}
                                      onClick={(e) => handleToggleFollow(account.id, e)}
                                      disabled={loadingFollowIds.has(account.id)}
                                    >
                                      <UsersIcon className="w-4 h-4 mr-1" />
                                      {followingIds.has(account.id) ? 'Following' : 'Follow'}
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMessageUser(account.id);
                                      }}
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="map" className="mt-0">
                  <div className="h-[500px] w-full">
                    <Map 
                      divePoints={searchPosts.map(post => ({
                        id: post.id,
                        name: post.title,
                        coordinates: [-16.9186, 145.7781] as [number, number],
                        description: post.description
                      }))} 
                      className="h-full w-full" 
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}

{/* Modals */}
{selectedProduct && (
  <ProductDetail
    product={selectedProduct}
    onClose={() => setSelectedProduct(null)}
  />
)}

{selectedTrip && (
  <TripDetail
    trip={selectedTrip}
    onClose={() => setSelectedTrip(null)}
  />
)}

{selectedPostId && (
  <PostDetail
    postId={selectedPostId}
    onClose={() => setSelectedPostId(null)}
  />
)}

{selectedProfile && (
  <ProfileDetail
    open={!!selectedProfile}
    onOpenChange={(open) => !open && setSelectedProfile(null)}
    profile={selectedProfile}
  />
)}
    </>
  );
};

export default Search;
