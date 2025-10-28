import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Star, TrendingUp, Heart } from "lucide-react";
import ProductDetail from "@/components/ProductDetail";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";

const Shop = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [productsData, setProductsData] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .limit(20);
    if (data) setProductsData(data);
  };

  const toggleLike = (id: string) => {
    const newLiked = new Set(likedProducts);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedProducts(newLiked);
  };

  const products = productsData.length > 0 ? productsData.map(p => ({
    id: p.id,
    title: p.title,
    brand: p.brand,
    price: p.price,
    rating: p.rating || 0,
    reviews: p.reviews_count || 0,
    image: p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    badges: p.badges || [],
    inStock: p.in_stock,
  })) : [
    {
      title: "Professional Dive Computer",
      brand: "Suunto",
      price: 599,
      rating: 4.8,
      reviews: 234,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      badges: ["Bestseller", "New"],
      inStock: true,
    },
    {
      title: "Premium Wetsuit 5mm",
      brand: "Scubapro",
      price: 329,
      rating: 4.9,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      badges: ["Popular"],
      inStock: true,
    },
    {
      title: "Underwater Camera",
      brand: "GoPro",
      price: 449,
      rating: 4.7,
      reviews: 892,
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800",
      badges: ["Trending"],
      inStock: true,
    },
    {
      title: "Diving Fins - Pro Series",
      brand: "Mares",
      price: 189,
      rating: 4.6,
      reviews: 178,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      badges: ["Sale"],
      inStock: true,
    },
    {
      title: "Dive Mask & Snorkel Set",
      brand: "Cressi",
      price: 89,
      rating: 4.5,
      reviews: 421,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      badges: ["Budget Pick"],
      inStock: true,
    },
    {
      title: "BCD Jacket - Advanced",
      brand: "Aqua Lung",
      price: 799,
      rating: 4.9,
      reviews: 98,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      badges: ["Premium"],
      inStock: true,
    },
  ];

  return (
    <AuthGuard>
      <div className="w-screen min-h-screen bg-background pt-4 pb-20">
      <div className="w-full px-4 pt-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dive Gear Shop</h1>
          <p className="text-muted-foreground">Quality equipment for your underwater adventures</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for dive gear, equipment, accessories..."
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-3">
          {products.map((product, index) => (
            <div
              key={index}
              className="relative max-w-full rounded-xl bg-gradient-to-br from-neutral-600/30 to-violet-300/30 overflow-hidden cursor-pointer bento-card hover:shadow-glow transition-all"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="relative h-48 flex items-center justify-center bg-gradient-to-br from-secondary/20 to-accent/10">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Floating Badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {product.badges.slice(0, 1).map((badge, i) => (
                    <Badge key={i} className="glass-effect backdrop-blur-sm text-xs px-1.5 py-0">
                      {badge}
                    </Badge>
                  ))}
                </div>

                {/* Like Button */}
                  <Button
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(product.id);
                    }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full glass-effect backdrop-blur-sm"
                    variant="ghost"
                  >
                    <Heart className={`w-3.5 h-3.5 ${likedProducts.has(product.id) ? 'fill-coral text-coral' : ''}`} />
                  </Button>
              </div>

              <Card className="border-none rounded-t-xl -mt-2">
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{product.title}</h3>
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <span className="font-semibold">{product.rating}</span>
                    <span className="text-muted-foreground">({product.reviews})</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase">Price</span>
                      <span className="text-lg font-bold text-accent">${product.price}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="accent" 
                      className="h-7 text-xs px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to cart logic
                      }}
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
    </AuthGuard>
  );
};

export default Shop;
