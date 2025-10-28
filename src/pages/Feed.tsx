import { useState } from "react";
import FeedPost from "@/components/FeedPost";

const Feed = () => {
  // Mock data - TikTok style full-screen posts
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
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black">
      {posts.map((post, index) => (
        <FeedPost key={index} {...post} />
      ))}
    </div>
  );
};

export default Feed;
