import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShoppingCart, Star, TrendingUp, Heart, Waves, MapPin, Calendar } from "lucide-react";
import ProductDetail from "@/components/ProductDetail";
import TripDetail from "@/components/TripDetail";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";

const Shop = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [productsData, setProductsData] = useState<any[]>([]);
  const [experiencesData, setExperiencesData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchProducts();
    fetchExperiences();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .limit(20);
    if (data) setProductsData(data);
  };

  const fetchExperiences = async () => {
    const { data } = await supabase
      .from('experiences')
      .select('*, dive_centers(name, avatar_url, owner_id)')
      .order('created_at', { ascending: false });
    if (data) setExperiencesData(data);
  };

  const toggleLike = (id: string) => {
    const newLiked = new Set(likedItems);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedItems(newLiked);
  };

  const products = productsData.length > 0 ? productsData.map(p => ({
    id: p.id,
    seller_id: p.seller_id,
    title: p.title,
    brand: p.brand,
    price: p.price,
    rating: p.rating || 0,
    reviews: p.reviews_count || 0,
    image: p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    badges: p.badges || [],
    inStock: p.in_stock,
    description: p.description,
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

  const experiences = experiencesData.length > 0 ? experiencesData.map(exp => ({
    id: exp.id,
    dive_center_id: (exp.dive_centers as any)?.owner_id,
    title: exp.title,
    centre: (exp.dive_centers as any)?.name || 'Dive Center',
    location: exp.location,
    price: exp.price,
    rating: exp.rating || 0,
    reviews: exp.reviews_count || 0,
    image: exp.image_url || 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    nextDate: exp.next_date ? new Date(exp.next_date).toLocaleDateString() : 'TBD',
    seatsLeft: exp.spots_left,
    badges: exp.badges || [],
    description: exp.description,
    duration: exp.duration,
    difficulty: exp.difficulty,
    includes: exp.includes,
  })) : [
    {
      title: "2-Tank Morning Reef Dive",
      centre: "Ocean Adventures",
      location: "Coral Bay, Australia",
      price: 120,
      rating: 4.9,
      reviews: 124,
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
      nextDate: "Nov 15, 2025",
      seatsLeft: 3,
      badges: ["Last Seats", "Popular"],
    },
    {
      title: "PADI Open Water Course",
      centre: "Deep Blue Diving",
      location: "Phuket, Thailand",
      price: 450,
      rating: 5.0,
      reviews: 89,
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
      nextDate: "Nov 20, 2025",
      seatsLeft: 5,
      badges: ["Course", "Certification"],
    },
  ];

  // Filter function
  const filterItems = (items: any[]) => {
    return items.filter(item => 
      searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <AuthGuard>
      <div className="w-screen min-h-screen bg-background pt-4 pb-20">
      <div className="w-full px-4 pt-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dive Shop</h1>
          <p className="text-muted-foreground">Gear, courses, and dive experiences</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for gear, trips, or courses..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="gear" className="space-y-6">
          <TabsList>
            <TabsTrigger value="gear">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Dive Gear
            </TabsTrigger>
            <TabsTrigger value="experiences">
              <Waves className="w-4 h-4 mr-2" />
              Trips & Courses
            </TabsTrigger>
          </TabsList>

          {/* Gear Tab */}
          <TabsContent value="gear" className="mt-0">
            <div className="grid grid-cols-2 gap-3">
              {filterItems(products).map((product, index) => (
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
                      toggleLike(product.id || index.toString());
                    }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full glass-effect backdrop-blur-sm"
                    variant="ghost"
                  >
                    <Heart className={`w-3.5 h-3.5 ${likedItems.has(product.id || index.toString()) ? 'fill-coral text-coral' : ''}`} />
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
          </TabsContent>

          {/* Experiences Tab */}
          <TabsContent value="experiences" className="mt-0">
            <div className="grid grid-cols-2 gap-3">
              {filterItems(experiences).map((experience, index) => (
                <Card 
                  key={index} 
                  className="bento-card overflow-hidden border-accent/20 hover:shadow-glow transition-all cursor-pointer group"
                  onClick={() => setSelectedTrip(experience)}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={experience.image}
                      alt={experience.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {experience.badges?.slice(0, 2).map((badge: string, i: number) => (
                        <Badge key={i} className="glass-effect backdrop-blur-sm text-xs px-1.5 py-0">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    {/* Price */}
                    <div className="absolute bottom-2 right-2">
                      <div className="glass-effect backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span className="text-sm font-bold text-accent">${experience.price}</span>
                      </div>
                    </div>
                    {/* Like Button */}
                    <Button
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(experience.id || `exp-${index}`);
                      }}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full glass-effect backdrop-blur-sm"
                      variant="ghost"
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedItems.has(experience.id || `exp-${index}`) ? 'fill-coral text-coral' : ''}`} />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{experience.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{experience.centre}</p>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{experience.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{experience.nextDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-coral fill-coral" />
                          <span className="font-semibold">{experience.rating}</span>
                          <span className="text-muted-foreground">({experience.reviews})</span>
                        </div>
                        <span className="text-muted-foreground">{experience.seatsLeft} left</span>
                      </div>
                    </div>

                    <Button size="sm" className="w-full h-7 text-xs" variant="accent">
                      Book Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <TripDetail
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      )}
    </div>
    </AuthGuard>
  );
};

export default Shop;
