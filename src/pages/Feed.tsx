import { useState } from "react";
import FeedPost from "@/components/FeedPost";

const Feed = () => {
  // Mock data - TikTok style full-screen posts
  const posts = [
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
          duration: "45 min",
          visibility: "25m",
          notes: "Strong current, saw manta rays and gray reef sharks"
        },
        {
          site: "SS Yongala Wreck",
          maxDepth: "18m",
          duration: "52 min",
          visibility: "20m",
          notes: "Historic wreck covered in soft corals, spotted sea snakes"
        },
        {
          site: "Cod Hole",
          maxDepth: "15m",
          duration: "48 min",
          visibility: "30m",
          notes: "Friendly potato cods and moray eels everywhere"
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
          duration: "50 min",
          visibility: "18m",
          notes: "Incredible coral growth on the wreck, schools of bumphead parrotfish"
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

  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black">
      {posts.map((post, index) => (
        <FeedPost key={index} {...post} />
      ))}
    </div>
  );
};

export default Feed;
