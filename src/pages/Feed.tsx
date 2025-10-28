import { useState } from "react";
import FeedCard from "@/components/FeedCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Feed = () => {
  const [activeTab, setActiveTab] = useState("foryou");

  // Mock data
  const posts = [
    {
      author: { name: "Sarah Ocean", avatar: "", role: "Dive Instructor" },
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
      caption: "Just discovered this amazing reef! Visibility was 30m+ and we saw turtles, rays, and a school of barracuda 🐠🌊",
      likes: 342,
      comments: 28,
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
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
      caption: "Wreck diving at its finest! This WWII ship is covered in marine life 🚢⚓",
      likes: 289,
      comments: 19,
    },
    {
      author: { name: "Ocean Adventures", avatar: "", role: "Dive Center" },
      image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800",
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

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Dive Feed</h1>
          <p className="text-muted-foreground">Discover amazing dive spots and trips from the community</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="foryou">For You</TabsTrigger>
            <TabsTrigger value="nearby">Nearby</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Feed Cards */}
        <div className="space-y-6">
          {posts.map((post, index) => (
            <FeedCard key={index} {...post} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feed;
