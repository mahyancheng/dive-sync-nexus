import { useState } from "react";
import { X, Heart, MapPin, Calendar, Users, Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Portal from "@/components/Portal";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Trip {
  id?: string;
  dive_center_id?: string;
  title: string;
  centre: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  nextDate: string;
  seatsLeft: number;
  badges: string[];
  description?: string;
}

interface TripDetailProps {
  trip: Trip;
  onClose: () => void;
}

const TripDetail = ({ trip, onClose }: TripDetailProps) => {
  const [liked, setLiked] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleContact = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      navigate('/auth');
      return;
    }

    if (!trip.dive_center_id) {
      navigate('/messages');
      return;
    }

    try {
      const { data: conversationId, error } = await supabase.rpc('create_or_get_direct_conversation', { 
        target_user_id: trip.dive_center_id 
      });
      
      if (error) throw error;
      navigate(`/messages?c=${conversationId}`, { state: { conversationId } });
      handleClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
      navigate('/messages');
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4" style={{ position: 'fixed' }}>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
          style={{ position: 'fixed' }}
        />
        
        {/* Trip Detail Card */}
        <div className={`relative w-screen md:w-full md:max-w-2xl h-[95vh] md:max-h-[90vh] overflow-y-auto bg-background rounded-t-3xl md:rounded-3xl duration-300 ${isClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom md:slide-in-from-bottom-0'}`} style={{ position: 'relative', zIndex: 1 }}>
        {/* Close Button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-background/80 backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Trip Image */}
        <div className="relative h-80 bg-gradient-to-br from-neutral-600 to-violet-300 overflow-hidden">
          <img
            src={trip.image}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          
          {/* Floating Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {trip.badges.map((badge, i) => (
              <Badge key={i} className="glass-effect backdrop-blur-sm">
                {badge}
              </Badge>
            ))}
          </div>
          
          <Button
            size="icon"
            onClick={() => setLiked(!liked)}
            className="absolute top-4 right-16 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-coral text-coral' : ''}`} />
          </Button>
        </div>

        {/* Trip Info Card */}
        <Card className="border-none rounded-t-3xl -mt-6 relative">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <CardDescription className="text-xs mb-1">{trip.centre}</CardDescription>
                <CardTitle className="text-xl">{trip.title}</CardTitle>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="font-semibold">{trip.rating}</span>
                <span className="text-muted-foreground">({trip.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="text-xs">{trip.seatsLeft} seats left</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="info">What's Included</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{trip.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>Next available: {trip.nextDate}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  {trip.description || "Experience an unforgettable underwater adventure with professional guides and top-quality equipment. Perfect for all skill levels."}
                </p>
              </TabsContent>
              <TabsContent value="info" className="space-y-2">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    All diving equipment provided
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Professional dive guide
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Light refreshments & water
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Insurance coverage included
                  </li>
                </ul>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex-col gap-3 pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">Price per person</span>
                <span className="text-3xl font-bold text-accent">${trip.price}</span>
              </div>
              <Button size="lg" variant="accent" className="gap-2">
                Book Now
              </Button>
            </div>
            <Button size="lg" variant="outline" className="w-full" onClick={handleContact}>
              Contact Centre
            </Button>
          </CardFooter>
        </Card>
      </div>
      </div>
    </Portal>
  );
};

export default TripDetail;
