import { useState, useEffect } from "react";
import FeedPost from "@/components/FeedPost";
import { NavSwitcher } from "@/components/ui/nav-switcher";
import { supabase } from "@/integrations/supabase/client";

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!inner(username, full_name, avatar_url, bio),
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

  // Fallback mock data if no posts in DB
  const mockPosts = [
    {
      author: { name: "Sarah Ocean", avatar: "", role: "Dive Instructor" },
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
      caption: "Epic week diving the Great Barrier Reef! 🐠🌊 Logged 5 incredible dives across different sites.",
      likes: 342,
      comments: 28,
      diveLogs: [
        {
          site: "Blue Corner Wall",
          maxDepth: "28m",
          avgDepth: "18m",
          duration: "45 min",
          visibility: "25m",
          temperature: "24°C",
          airConsumption: "180 bar",
          coordinates: { lat: -8.0891, lng: 134.2167 },
          notes: "Strong current, saw manta rays and gray reef sharks",
          buddies: [
            { name: "Mike Deep", avatar: "" },
            { name: "Alex Waters", avatar: "" }
          ],
          media: [
            { url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400", type: 'image' as const },
            { url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400", type: 'image' as const }
          ]
        },
        {
          site: "SS Yongala Wreck",
          maxDepth: "18m",
          avgDepth: "14m",
          duration: "52 min",
          visibility: "20m",
          temperature: "26°C",
          airConsumption: "160 bar",
          coordinates: { lat: -19.3167, lng: 147.6167 },
          notes: "Historic wreck covered in soft corals, spotted sea snakes",
          buddies: [
            { name: "Sarah Ocean", avatar: "" }
          ],
          media: [
            { url: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400", type: 'image' as const }
          ]
        },
        {
          site: "Cod Hole",
          maxDepth: "15m",
          avgDepth: "12m",
          duration: "48 min",
          visibility: "30m",
          temperature: "25°C",
          airConsumption: "140 bar",
          coordinates: { lat: -14.4167, lng: 145.6167 },
          notes: "Friendly potato cods and moray eels everywhere",
          buddies: [
            { name: "Mike Deep", avatar: "" },
            { name: "Jordan Reef", avatar: "" },
            { name: "Taylor Blue", avatar: "" }
          ]
        }
      ],
      listing: {
        title: "2-Tank Morning Reef Dive",
        price: 120,
        seatsLeft: 3,
        date: "Nov 15, 2025",
        location: "Coral Bay, Australia",
      },
    },
    {
      author: { name: "Mike Deep", avatar: "", role: "Advanced Diver" },
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1080",
      caption: "Wreck diving at its finest! This WWII ship is covered in marine life 🚢⚓",
      likes: 289,
      comments: 19,
      diveLogs: [
        {
          site: "USS Liberty Wreck",
          maxDepth: "22m",
          avgDepth: "16m",
          duration: "50 min",
          visibility: "18m",
          temperature: "27°C",
          airConsumption: "170 bar",
          coordinates: { lat: -8.2765, lng: 115.5937 },
          notes: "Incredible coral growth on the wreck, schools of bumphead parrotfish",
          buddies: [
            { name: "Emma Coral", avatar: "" }
          ],
          media: [
            { url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400", type: 'image' as const },
            { url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400", type: 'image' as const },
            { url: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400", type: 'image' as const }
          ]
        }
      ],
    },
    {
      author: { name: "Ocean Adventures", avatar: "", role: "Dive Center" },
      image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600&h=1000",
      caption: "New dates available for our night dive experience! Don't miss the bioluminescence season ✨",
      likes: 521,
      comments: 45,
      listing: {
        title: "Bioluminescence Night Dive",
        price: 95,
        seatsLeft: 8,
        date: "Nov 22, 2025",
        location: "Maldives",
      },
    },
  ];

  const displayPosts = posts.length > 0 ? posts : mockPosts;

  return (
    <div className="w-screen h-screen overflow-y-auto snap-y snap-mandatory bg-black">
      {displayPosts.map((post, index) => (
        <FeedPost key={index} {...post} />
      ))}
    </div>
    </AuthGuard>
  );
};

export default Feed;
