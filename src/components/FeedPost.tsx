import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Users, Calendar, Gauge, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import DiveLogDetail from "./DiveLogDetail";
import ProfileDetail from "./ProfileDetail";

interface DiveLog {
  site: string;
  maxDepth: string;
  duration: string;
  visibility: string;
  notes: string;
  temperature?: string;
  coordinates?: { lat: number; lng: number };
  airConsumption?: string;
  avgDepth?: string;
  buddies?: Array<{ name: string; avatar?: string }>;
  media?: Array<{ url: string; type: 'image' | 'video' }>;
}

interface FeedPostProps {
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  image: string;
  caption: string;
  likes: number;
  comments: number;
  diveLogs?: DiveLog[];
  listing?: {
    title: string;
    price: number;
    seatsLeft: number;
    date: string;
    location: string;
  };
}

const FeedPost = ({ author, image, caption, likes, comments, diveLogs, listing }: FeedPostProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [showDiveDetail, setShowDiveDetail] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDiveLogExpanded, setIsDiveLogExpanded] = useState(true);

  const profileData = {
    name: author.name,
    avatar: author.avatar,
    role: author.role,
    location: "Pacific Ocean",
    bio: "Passionate diver exploring the world's oceans 🌊",
    totalDives: 156,
    certifications: ["PADI Advanced Open Water", "PADI Rescue Diver", "Nitrox Certified"],
    joinedDate: "January 2023",
    posts: [
      { image, caption, likes }
    ]
  };

  return (
    <div className="relative h-screen w-full snap-start snap-always">
      {/* Background Image/Video */}
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <img 
          src={image} 
          alt={caption}
          className="max-w-full max-h-full object-contain"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-end p-4 pb-20">
        {/* Bottom - Author Name, Caption, Dive Logs & Shoppable Tag */}
        <div className="space-y-3 max-w-[85%]">
          {/* Author Name (Bold) + Caption */}
          <div>
            <p className="text-white drop-shadow-lg text-sm">
              <span 
                className="font-bold cursor-pointer hover:underline" 
                onClick={() => setShowProfile(true)}
              >
                {author.name}
              </span>
              {listing && (
                <Badge variant="secondary" className="bg-coral/90 text-white border-coral/20 backdrop-blur-sm ml-2 align-middle">
                  Bookable
                </Badge>
              )}
            </p>
            <p className="text-white/90 drop-shadow-lg text-sm line-clamp-2 mt-1">
              {caption}
            </p>
          </div>

          {/* Dive Logs Thread */}
          {diveLogs && diveLogs.length > 0 && (
            <div className="space-y-2">
              {/* Navigation Dots */}
              {diveLogs.length > 1 && (
                <div className="flex items-center gap-2">
                  {diveLogs.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentLogIndex(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentLogIndex 
                          ? 'bg-white w-4' 
                          : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Current Dive Log - Collapsible */}
              <div className="glass-effect rounded-xl border border-accent/20 shadow-glow overflow-hidden transition-all">
                {/* Header - Always Visible */}
                <button
                  onClick={() => setIsDiveLogExpanded(!isDiveLogExpanded)}
                  className="w-full p-3 text-left glass-hover flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <h4 className="font-semibold text-foreground text-sm">{diveLogs[currentLogIndex].site}</h4>
                    {diveLogs.length > 1 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {currentLogIndex + 1}/{diveLogs.length}
                      </Badge>
                    )}
                  </div>
                  <div className={`ml-2 transition-transform ${isDiveLogExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* Expandable Content */}
                {isDiveLogExpanded && (
                  <div className="px-3 pb-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-coral" />
                        <span className="text-xs text-muted-foreground">{diveLogs[currentLogIndex].maxDepth}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-accent" />
                        <span className="text-xs text-muted-foreground">{diveLogs[currentLogIndex].duration}</span>
                      </div>
                      {diveLogs[currentLogIndex].buddies && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-primary" />
                          <span className="text-xs text-muted-foreground">{diveLogs[currentLogIndex].buddies.length}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDiveDetail(true);
                      }}
                      className="text-xs text-accent hover:underline"
                    >
                      Tap for full details →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shoppable Tag */}
          {listing && (
            <div className="glass-effect rounded-2xl p-4 border border-accent/20 shadow-glow glass-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-base mb-2">{listing.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{listing.location}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <Calendar className="w-3 h-3" />
                    <span>{listing.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-accent">${listing.price}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{listing.seatsLeft} seats left</span>
                    </div>
                  </div>
                </div>
                <Button variant="coral" size="sm" className="shrink-0">
                  Book
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-32 flex flex-col gap-4">
        <button 
          onClick={() => setLiked(!liked)}
          className="flex flex-col items-center gap-0.5"
        >
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Heart 
              className={`w-5 h-5 ${liked ? 'fill-coral text-coral' : 'text-white'}`}
            />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">
            {liked ? likes + 1 : likes}
          </span>
        </button>

        <button className="flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">{comments}</span>
        </button>

        <button className="flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
        </button>

        <button 
          onClick={() => setSaved(!saved)}
          className="flex flex-col items-center gap-0.5"
        >
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Bookmark 
              className={`w-5 h-5 ${saved ? 'fill-white text-white' : 'text-white'}`}
            />
          </div>
        </button>
      </div>

      {/* Dive Log Detail Sheet */}
      {diveLogs && diveLogs.length > 0 && (
        <DiveLogDetail
          open={showDiveDetail}
          onOpenChange={setShowDiveDetail}
          diveLog={diveLogs[currentLogIndex]}
          diveNumber={currentLogIndex + 1}
          totalDives={diveLogs.length}
        />
      )}

      {/* Profile Detail Modal */}
      <ProfileDetail
        open={showProfile}
        onOpenChange={setShowProfile}
        profile={profileData}
      />
    </div>
  );
};

export default FeedPost;
