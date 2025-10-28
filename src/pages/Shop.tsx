import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Star, TrendingUp } from "lucide-react";

const Shop = () => {
  const products = [
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
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <Card key={index} className="bento-card overflow-hidden border-accent/20 hover:shadow-glow transition-all cursor-pointer group">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-secondary/20">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  {product.badges.map((badge, i) => (
                    <Badge key={i} className="glass-effect backdrop-blur-sm">
                      {badge}
                    </Badge>
                  ))}
                </div>
                {/* Quick Actions */}
                <div className="absolute top-3 right-3">
                  <Button size="icon" variant="secondary" className="glass-effect backdrop-blur-sm h-8 w-8">
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-base mb-1 line-clamp-2">{product.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3 text-sm">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span className="font-semibold">{product.rating}</span>
                  <span className="text-muted-foreground">({product.reviews})</span>
                  <TrendingUp className="w-3 h-3 ml-auto text-accent" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-accent">${product.price}</div>
                  <Button size="sm" variant="accent">
                    Add to Cart
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;
