import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Star, TrendingUp } from "lucide-react";
import { NavSwitcher } from "@/components/ui/nav-switcher";

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
    <div className="min-h-screen bg-background pt-4 pb-20">
      {/* Top Navigation */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <NavSwitcher defaultValue="shop" />
      </div>
      
      <div className="container mx-auto px-4 max-w-7xl pt-16">
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
            <Card key={index} className="bento-card overflow-hidden border-accent/20 hover:shadow-glow transition-all cursor-pointer group">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-secondary/20">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {product.badges.map((badge, i) => (
                    <Badge key={i} className="glass-effect backdrop-blur-sm text-xs px-1.5 py-0">
                      {badge}
                    </Badge>
                  ))}
                </div>
                {/* Quick Actions */}
                <div className="absolute top-2 right-2">
                  <Button size="icon" variant="secondary" className="glass-effect backdrop-blur-sm h-7 w-7">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.title}</h3>

                <div className="flex items-center gap-1 mb-2 text-xs">
                  <Star className="w-3 h-3 text-accent fill-accent" />
                  <span className="font-semibold">{product.rating}</span>
                  <span className="text-muted-foreground">({product.reviews})</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-accent">${product.price}</div>
                  <Button size="sm" variant="accent" className="h-7 text-xs px-3">
                    Add
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
