import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Star, Calendar, ShoppingCart, Heart, Waves } from "lucide-react";
import TripDetail from "@/components/TripDetail";
import ProductDetail from "@/components/ProductDetail";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";

const Explore = () => {
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchExperiences();
    fetchProducts();
  }, []);

  const fetchExperiences = async () => {
    const { data, error } = await supabase
      .from('experiences')
      .select('*, dive_centers(name, avatar_url, owner_id)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setExperiences(data);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .limit(20);
    if (data) setProducts(data);
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

  // Get unique locations from experiences
  const locations = Array.from(new Set(experiences.map(exp => exp.location))).filter(Boolean);

  // Filter experiences by location and search
  const filteredExperiences = experiences.filter(exp => {
    const matchesLocation = selectedLocation === "all" || exp.location === selectedLocation;
    const matchesSearch = searchQuery === "" || 
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesSearch;
  });

  // Filter products by category and search
  const filteredProducts = products.filter(prod => {
    const matchesType = selectedType === "all" || prod.category === selectedType;
    const matchesSearch = searchQuery === "" || 
      prod.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <AuthGuard>
      <div className="w-screen min-h-screen bg-background pt-4 pb-20">
        <div className="w-full px-4 pt-16">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Explore</h1>
            <p className="text-muted-foreground">Discover dive experiences and gear</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search experiences, locations, gear..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs for Experiences and Shop */}
          <Tabs defaultValue="experiences" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="experiences" className="gap-2">
                <Waves className="w-4 h-4" />
                Dive Experiences
              </TabsTrigger>
              <TabsTrigger value="shop" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Dive Gear
              </TabsTrigger>
            </TabsList>

            {/* Experiences Tab */}
            <TabsContent value="experiences" className="space-y-4">
              {/* Location Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  size="sm"
                  variant={selectedLocation === "all" ? "default" : "outline"}
                  onClick={() => setSelectedLocation("all")}
                  className="whitespace-nowrap"
                >
                  All Locations
                </Button>
                {locations.map((location) => (
                  <Button
                    key={location}
                    size="sm"
                    variant={selectedLocation === location ? "default" : "outline"}
                    onClick={() => setSelectedLocation(location)}
                    className="whitespace-nowrap"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    {location}
                  </Button>
                ))}
              </div>

              {/* Experiences Grid */}
              <div className="grid grid-cols-2 gap-3">
                {filteredExperiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="relative rounded-xl bg-gradient-to-br from-neutral-600/30 to-violet-300/30 overflow-hidden cursor-pointer bento-card hover:shadow-glow transition-all"
                    onClick={() => setSelectedTrip({
                      id: exp.id,
                      dive_center_id: exp.dive_centers?.owner_id,
                      title: exp.title,
                      centre: exp.dive_centers?.name || 'Dive Center',
                      location: exp.location,
                      price: exp.price,
                      rating: exp.rating || 0,
                      reviews: exp.reviews_count || 0,
                      image: exp.image_url || 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
                      nextDate: exp.next_date,
                      seatsLeft: exp.spots_left,
                      badges: exp.badges || [],
                      description: exp.description,
                      difficulty: exp.difficulty,
                      duration: exp.duration,
                      maxDepth: exp.max_depth,
                      includes: exp.includes || []
                    })}
                  >
                    <div className="relative h-48 bg-gradient-to-br from-secondary/20 to-accent/10">
                      <img
                        src={exp.image_url || 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'}
                        alt={exp.title}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {exp.badges?.slice(0, 1).map((badge: string, i: number) => (
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
                          toggleLike(exp.id);
                        }}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full glass-effect backdrop-blur-sm"
                        variant="ghost"
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedItems.has(exp.id) ? 'fill-coral text-coral' : ''}`} />
                      </Button>
                    </div>

                    <Card className="border-none rounded-t-xl -mt-2">
                      <div className="p-3 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {exp.location}
                          </p>
                          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{exp.title}</h3>
                        </div>

                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="font-semibold">{exp.rating || 0}</span>
                          <span className="text-muted-foreground">({exp.reviews_count || 0})</span>
                        </div>

                        {exp.next_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(exp.next_date).toLocaleDateString()}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase">From</span>
                            <span className="text-lg font-bold text-accent">${exp.price}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="accent" 
                            className="h-7 text-xs px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>

              {filteredExperiences.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No experiences found</p>
                </div>
              )}
            </TabsContent>

            {/* Shop Tab */}
            <TabsContent value="shop" className="space-y-4">
              {/* Type Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  size="sm"
                  variant={selectedType === "all" ? "default" : "outline"}
                  onClick={() => setSelectedType("all")}
                  className="whitespace-nowrap"
                >
                  All Gear
                </Button>
                {["Computers", "Wetsuits", "Masks", "Fins", "BCD"].map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={selectedType === type ? "default" : "outline"}
                    onClick={() => setSelectedType(type)}
                    className="whitespace-nowrap"
                  >
                    {type}
                  </Button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="relative rounded-xl bg-gradient-to-br from-neutral-600/30 to-violet-300/30 overflow-hidden cursor-pointer bento-card hover:shadow-glow transition-all"
                    onClick={() => setSelectedProduct({
                      id: product.id,
                      seller_id: product.seller_id,
                      title: product.title,
                      brand: product.brand,
                      price: product.price,
                      rating: product.rating || 0,
                      reviews: product.reviews_count || 0,
                      image: product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
                      badges: product.badges || [],
                      inStock: product.in_stock,
                      description: product.description,
                    })}
                  >
                    <div className="relative h-48 bg-gradient-to-br from-secondary/20 to-accent/10">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {product.badges?.slice(0, 1).map((badge: string, i: number) => (
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
                        <Heart className={`w-3.5 h-3.5 ${likedItems.has(product.id) ? 'fill-coral text-coral' : ''}`} />
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
                          <span className="text-muted-foreground">({product.reviews_count || 0})</span>
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

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No products found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Trip Detail Modal */}
        {selectedTrip && (
          <TripDetail
            trip={selectedTrip}
            onClose={() => setSelectedTrip(null)}
          />
        )}

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

export default Explore;
