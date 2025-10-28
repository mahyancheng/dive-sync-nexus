import { useState } from "react";
import { X, Heart, ShoppingCart, Star, TrendingUp, Share2, Minus, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Portal from "@/components/Portal";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id?: string;
  seller_id?: string;
  title: string;
  brand: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  badges: string[];
  inStock: boolean;
  description?: string;
  features?: string[];
}

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

const ProductDetail = ({ product, onClose }: ProductDetailProps) => {
  const [liked, setLiked] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleContactSeller = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      navigate('/auth');
      return;
    }

    if (!product.seller_id) {
      navigate('/messages');
      return;
    }

    // Defer conversation creation to Messages page (?u=)
    navigate(`/messages?u=${product.seller_id}`, { state: { targetUserId: product.seller_id } });
    handleClose();
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
        
        {/* Product Detail Card */}
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

        {/* Product Image with gradient overlay */}
        <div className="relative h-80 bg-gradient-to-br from-neutral-600 to-violet-300 overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          
          {/* Floating Action Buttons */}
          <div className="absolute top-4 left-4 flex gap-2">
            {product.badges.map((badge, i) => (
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

        {/* Product Info Card */}
        <Card className="border-none rounded-t-3xl -mt-6 relative">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <CardDescription className="text-xs mb-1">{product.brand}</CardDescription>
                <CardTitle className="text-xl">{product.title}</CardTitle>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="font-semibold">{product.rating}</span>
                <span className="text-muted-foreground">({product.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-accent">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Trending</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="space-y-2 text-sm">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description || "High-quality diving equipment designed for professionals and enthusiasts. Built with premium materials for durability and performance in all underwater conditions."}
                </p>
              </TabsContent>
              <TabsContent value="features" className="space-y-2">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Professional grade materials
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Tested to 100m depth
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Corrosion resistant
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    2-year warranty included
                  </li>
                </ul>
              </TabsContent>
            </Tabs>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between p-4 glass-effect rounded-xl">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="font-semibold w-8 text-center">{quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3 pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">Total Price</span>
                <span className="text-3xl font-bold text-accent">${(product.price * quantity).toFixed(2)}</span>
              </div>
              <Button size="lg" variant="accent" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </Button>
            </div>
            <div className="flex gap-2 w-full">
              <Button size="lg" variant="outline" className="flex-1">
                Buy Now
              </Button>
              <Button size="lg" variant="outline" onClick={handleContactSeller}>
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      </div>
    </Portal>
  );
};

export default ProductDetail;
