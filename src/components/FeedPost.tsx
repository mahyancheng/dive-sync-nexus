import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Users, Calendar, Gauge, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface DiveLog {
  site: string;
  maxDepth: string;
  duration: string;
  visibility: string;
  notes: string;
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
      <div className="relative h-full flex flex-col justify-between p-4 pb-20">
        {/* Top - Author Info */}
        <div className="flex items-center gap-3">
          <Avatar className="border-2 border-white/20">
            <AvatarImage src={author.avatar} />
            <AvatarFallback className="bg-accent text-accent-foreground">
              {author.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-white drop-shadow-lg">{author.name}</p>
            <p className="text-sm text-white/80 drop-shadow-lg">{author.role}</p>
          </div>
          {listing && (
            <Badge variant="secondary" className="bg-coral/90 text-white border-coral/20 backdrop-blur-sm">
              Bookable
            </Badge>
          )}
        </div>

        {/* Bottom - Caption, Dive Logs & Shoppable Tag */}
        <div className="space-y-4">
          {/* Caption */}
          <div className="max-w-xs">
            <p className="text-white drop-shadow-lg">
              <span className="font-semibold">{author.name}</span>{" "}
              <span className="text-sm">{caption}</span>
            </p>
          </div>

          {/* Dive Logs Thread */}
          {diveLogs && diveLogs.length > 0 && (
            <div className="space-y-2">
              {/* Navigation Dots */}
              {diveLogs.length > 1 && (
                <div className="flex items-center gap-2 justify-center">
                  {diveLogs.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentLogIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentLogIndex 
                          ? 'bg-white w-6' 
                          : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Current Dive Log */}
              <div className="bg-card/95 backdrop-blur-md rounded-2xl p-4 border border-accent/20 shadow-glow max-w-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-accent" />
                  <h4 className="font-semibold text-foreground">{diveLogs[currentLogIndex].site}</h4>
                  {diveLogs.length > 1 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {currentLogIndex + 1}/{diveLogs.length}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-coral" />
                    <span className="text-xs text-muted-foreground">{diveLogs[currentLogIndex].maxDepth}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-accent" />
                    <span className="text-xs text-muted-foreground">{diveLogs[currentLogIndex].duration}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Vis: {diveLogs[currentLogIndex].visibility}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {diveLogs[currentLogIndex].notes}
                </p>

                {/* Swipe hint */}
                {diveLogs.length > 1 && (
                  <div className="flex items-center gap-2 justify-center mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Tap dots to view other dives</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shoppable Tag */}
          {listing && (
            <div className="bg-card/95 backdrop-blur-md rounded-2xl p-4 border border-accent/20 shadow-glow">
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
      <div className="absolute right-4 bottom-32 flex flex-col gap-6">
        <button 
          onClick={() => setLiked(!liked)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Heart 
              className={`w-6 h-6 ${liked ? 'fill-coral text-coral' : 'text-white'}`}
            />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">
            {liked ? likes + 1 : likes}
          </span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">{comments}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
        </button>

        <button 
          onClick={() => setSaved(!saved)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Bookmark 
              className={`w-6 h-6 ${saved ? 'fill-white text-white' : 'text-white'}`}
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export default FeedPost;
