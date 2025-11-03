import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, ArrowLeft, Search, Package, Waves, Plus, Edit, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ERPMarketplace = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [diveCenterId, setDiveCenterId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isVendor = roles?.some(r => (r.role as string) === 'vendor');
    if (!isVendor) {
      toast.error("Access denied");
      navigate("/profile");
      return;
    }

    const { data: centers } = await supabase
      .from("dive_centers")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (centers) {
      setDiveCenterId(centers.id);
    }

    await Promise.all([fetchProducts(user.id), fetchExperiences(centers?.id)]);
    setLoading(false);
  };

  const fetchProducts = async (userId: string) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    setProducts(data || []);
  };

  const fetchExperiences = async (centerId?: string) => {
    if (!centerId) return;
    
    const { data } = await supabase
      .from("experiences")
      .select("*")
      .eq("dive_center_id", centerId)
      .order("created_at", { ascending: false });

    setExperiences(data || []);
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted");
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleDeleteExperience = async (id: string) => {
    const { error } = await supabase
      .from("experiences")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete experience");
    } else {
      toast.success("Experience deleted");
      setExperiences(experiences.filter(e => e.id !== id));
    }
  };

  const filteredProducts = products.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExperiences = experiences.filter(e =>
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/erp")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Store className="w-8 h-8 text-primary" />
                E-Commerce Management
              </h1>
              <p className="text-sm text-muted-foreground">Manage your products and diving experiences</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search products or experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-effect border-primary/20"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="experiences" className="flex items-center gap-2">
              <Waves className="w-4 h-4" />
              Experiences ({experiences.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {loading ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading products...
                </CardContent>
              </Card>
            ) : filteredProducts.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No products found</p>
                  <p className="text-sm mt-2">Add products from the Shop page</p>
                </CardContent>
              </Card>
            ) : (
              filteredProducts.map((product) => (
                <Card key={product.id} className="glass-effect border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img 
                        src={product.image_url || "/placeholder.svg"} 
                        alt={product.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold">{product.title}</h3>
                            <p className="text-sm text-muted-foreground">{product.brand}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="text-lg font-bold text-primary">${product.price}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Rating</p>
                            <p className="text-lg font-bold">⭐ {product.rating || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant={product.in_stock ? "default" : "secondary"}>
                              {product.in_stock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="experiences" className="space-y-4">
            {loading ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading experiences...
                </CardContent>
              </Card>
            ) : filteredExperiences.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Waves className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No experiences found</p>
                  <p className="text-sm mt-2">Add diving experiences from the Shop page</p>
                </CardContent>
              </Card>
            ) : (
              filteredExperiences.map((experience) => (
                <Card key={experience.id} className="glass-effect border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img 
                        src={experience.image_url || "/placeholder.svg"} 
                        alt={experience.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold">{experience.title}</h3>
                            <p className="text-sm text-muted-foreground">{experience.location}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteExperience(experience.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="text-lg font-bold text-primary">${experience.price}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="text-sm font-medium">{experience.duration}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Spots</p>
                            <p className="text-sm font-medium">{experience.spots_left}/{experience.total_spots}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Difficulty</p>
                            <p className="text-sm font-medium">{experience.difficulty}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{experience.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ERPMarketplace;
