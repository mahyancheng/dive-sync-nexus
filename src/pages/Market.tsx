import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, MapPin, Star, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthGuard from "@/components/AuthGuard";

interface MarketItem {
  id: string;
  type: "product" | "experience";
  title: string;
  description: string;
  price: number;
  image_url: string;
  location?: string;
  rating?: number;
  reviews_count?: number;
  seller_id?: string;
  dive_center_id?: string;
  dive_center?: any;
  badges?: string[];
  difficulty?: string;
  duration?: string;
  spots_left?: number;
}

const Market = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMarketItems();
  }, []);

  const fetchMarketItems = async () => {
    const [productsRes, experiencesRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .limit(20),
      supabase
        .from("experiences")
        .select(`
          *,
          dive_center:dive_center_id(
            name,
            location,
            avatar_url
          )
        `)
        .limit(20)
    ]);

    const productItems: MarketItem[] = (productsRes.data || []).map(p => ({
      id: p.id,
      type: "product" as const,
      title: p.title,
      description: p.description || "",
      price: p.price,
      image_url: p.image_url || "/placeholder.svg",
      rating: p.rating,
      reviews_count: p.reviews_count,
      seller_id: p.seller_id,
      badges: p.badges
    }));

    const experienceItems: MarketItem[] = (experiencesRes.data || []).map(e => ({
      id: e.id,
      type: "experience" as const,
      title: e.title,
      description: e.description || "",
      price: e.price,
      image_url: e.image_url || "/placeholder.svg",
      location: e.location,
      rating: e.rating,
      reviews_count: e.reviews_count,
      dive_center_id: e.dive_center_id,
      dive_center: e.dive_center,
      badges: e.badges,
      difficulty: e.difficulty,
      duration: e.duration,
      spots_left: e.spots_left
    }));

    const shuffled = [...productItems, ...experienceItems].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setLoading(false);
  };

  const handleLike = (itemId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const index = Math.round(scrollTop / itemHeight);
    setCurrentIndex(index);
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading marketplace...</p>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="h-screen overflow-hidden bg-background">
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        >
          {items.map((item, index) => (
            <div 
              key={item.id}
              className="h-screen snap-start snap-always relative flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-md h-[85vh] overflow-hidden border-primary/20 bg-background/95 backdrop-blur">
                <div className="relative h-3/5">
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {item.type === "experience" ? (
                      <Badge className="bg-blue-500/90 backdrop-blur">
                        Diving Trip
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/90 backdrop-blur">
                        Product
                      </Badge>
                    )}
                  </div>
                  {item.badges && item.badges.length > 0 && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="backdrop-blur">
                        {item.badges[0]}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="h-2/5 overflow-y-auto p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-1">{item.title}</h2>
                      {item.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {item.location}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">${item.price}</p>
                      {item.rating && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          {item.rating} ({item.reviews_count || 0})
                        </p>
                      )}
                    </div>
                  </div>

                  {item.type === "experience" && (
                    <div className="flex gap-4 mb-3 text-sm">
                      {item.difficulty && (
                        <div>
                          <span className="text-muted-foreground">Difficulty:</span>
                          <span className="ml-1 font-medium">{item.difficulty}</span>
                        </div>
                      )}
                      {item.duration && (
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="ml-1 font-medium">{item.duration}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mb-4">
                    {item.description}
                  </p>

                  <div className="flex gap-2 mb-4">
                    <Button 
                      size="lg" 
                      className="flex-1"
                      onClick={() => {
                        if (item.type === "experience") {
                          navigate("/shop");
                        } else {
                          toast.success("Added to cart");
                        }
                      }}
                    >
                      {item.type === "experience" ? "Book Now" : "Add to Cart"}
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => navigate("/messages")}
                    >
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex justify-around border-t pt-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleLike(item.id)}
                      className={likedItems.has(item.id) ? "text-red-500" : ""}
                    >
                      <Heart className={`w-6 h-6 ${likedItems.has(item.id) ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-6 h-6" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {index > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-8 right-8 rounded-full"
                  onClick={scrollToTop}
                >
                  <ChevronUp className="w-5 h-5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 space-y-2 z-10">
          {items.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-primary w-3 h-3" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </AuthGuard>
  );
};

export default Market;
