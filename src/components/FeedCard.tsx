import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, MapPin, Users, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FeedCardProps {
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  image: string;
  caption: string;
  likes: number;
  comments: number;
  listing?: {
    title: string;
    price: number;
    seatsLeft: number;
    date: string;
    location: string;
  };
}

const FeedCard = ({ author, image, caption, likes, comments, listing }: FeedCardProps) => {
  return (
    <Card className="overflow-hidden border-accent/20 shadow-ocean hover:shadow-glow transition-all duration-300">
      {/* Author Header */}
      <div className="flex items-center gap-3 p-4">
        <Avatar>
          <AvatarImage src={author.avatar} />
          <AvatarFallback className="bg-accent text-accent-foreground">
            {author.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{author.name}</p>
          <p className="text-sm text-muted-foreground">{author.role}</p>
        </div>
        {listing && (
          <Badge variant="secondary" className="bg-coral/10 text-coral border-coral/20">
            Bookable
          </Badge>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-muted">
        <img 
          src={image} 
          alt={caption}
          className="w-full h-full object-cover"
        />
        
        {/* Shoppable Tag Overlay */}
        {listing && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-card/95 backdrop-blur-md rounded-lg p-3 border border-accent/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">{listing.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{listing.location}</span>
                    <Calendar className="w-3 h-3 ml-2" />
                    <span>{listing.date}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-lg font-bold text-accent">${listing.price}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{listing.seatsLeft} seats left</span>
                    </div>
                  </div>
                </div>
                <Button variant="coral" size="sm">
                  Book
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 p-4 border-t border-border">
        <Button variant="ghost" size="sm" className="gap-2">
          <Heart className="w-4 h-4" />
          <span className="text-sm">{likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{comments}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 ml-auto">
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Caption */}
      <div className="px-4 pb-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{author.name}</span>{" "}
          {caption}
        </p>
      </div>
    </Card>
  );
};

export default FeedCard;
