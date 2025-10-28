import { useState } from "react";
import { Search as SearchIcon, X, User, Map as MapIcon, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductDetail from "@/components/ProductDetail";
import TripDetail from "@/components/TripDetail";
import Map from "@/components/Map";

interface SearchResult {
  type: "post" | "product" | "account";
  id: string;
  title: string;
  description?: string;
  image?: string;
  price?: number;
  username?: string;
  avatar?: string;
}

const Search = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  // Mock data for demonstration
  const allData: SearchResult[] = [
    {
      type: "post",
      id: "1",
      title: "Amazing dive at the Great Barrier Reef",
      description: "Saw incredible coral formations today!",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    },
    {
      type: "post",
      id: "2",
      title: "Underwater photography tips",
      description: "Here's how I capture stunning underwater shots",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    },
    {
      type: "product",
      id: "1",
      title: "Professional Dive Computer",
      description: "Suunto",
      price: 599,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    },
    {
      type: "product",
      id: "2",
      title: "Premium Wetsuit 5mm",
      description: "Scubapro",
      price: 329,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    },
    {
      type: "product",
      id: "3",
      title: "Underwater Camera",
      description: "GoPro",
      price: 449,
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800",
    },
    {
      type: "account",
      id: "1",
      title: "DiveMaster Pro",
      username: "@divemaster_pro",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      description: "Professional diving instructor",
    },
    {
      type: "account",
      id: "2",
      title: "Ocean Explorer",
      username: "@ocean_explorer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      description: "Underwater photographer",
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    const filtered = allData.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()) ||
      item.username?.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  };

  const posts = results.filter((r) => r.type === "post");
  const products = results.filter((r) => r.type === "product");
  const accounts = results.filter((r) => r.type === "account");

  return (
    <>
      {/* Search Button */}
      <Button
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed top-3 right-3 z-[90] rounded-full glass-effect backdrop-blur-sm h-9 w-9 md:h-10 md:w-10 md:top-4 md:right-4"
        variant="ghost"
      >
        <SearchIcon className="w-4 h-4 md:w-5 md:h-5" />
      </Button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex flex-col bg-background" style={{ position: 'fixed' }}>
          {/* Search Header */}
          <div className="sticky top-0 z-10 bg-background border-b p-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search posts, products, accounts..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 h-12"
                  autoFocus
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery("");
                  setResults([]);
                }}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Search Results or Map */}
          <div className="flex-1 overflow-y-auto p-4">
            {searchQuery === "" ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>Start typing to search</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>No results found</p>
              </div>
            ) : (
              <Tabs defaultValue="results" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="map">
                    <MapIcon className="w-4 h-4 mr-2" />
                    Map
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="mt-0 space-y-6">
                  {/* Posts Section */}
                  {posts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Posts</h3>
                      <div className="space-y-3">
                        {posts.map((post) => (
                          <Card 
                            key={post.id} 
                            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => {
                              const tripData = {
                                title: post.title,
                                centre: "Dive Centre",
                                location: "Location",
                                price: 150,
                                rating: 4.8,
                                reviews: 100,
                                image: post.image || "",
                                nextDate: "Coming Soon",
                                seatsLeft: 5,
                                badges: ["Popular"],
                                description: post.description,
                              };
                              setSelectedTrip(tripData);
                            }}
                          >
                            <CardContent className="p-0">
                              <div className="flex gap-3">
                                {post.image && (
                                  <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-24 h-24 object-cover"
                                  />
                                )}
                                <div className="flex-1 p-3">
                                  <h4 className="font-semibold mb-1">{post.title}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {post.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products Section (Carousel) */}
                  {products.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Products</h3>
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                        {products.map((product) => (
                          <Card
                            key={product.id}
                            className="min-w-[160px] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => {
                              const productData = {
                                title: product.title,
                                brand: product.description || "Brand",
                                price: product.price || 0,
                                rating: 4.5,
                                reviews: 100,
                                image: product.image || "",
                                badges: ["Popular"],
                                inStock: true,
                              };
                              setSelectedProduct(productData);
                            }}
                          >
                            <CardContent className="p-0">
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  className="w-full h-32 object-cover"
                                />
                              )}
                              <div className="p-3">
                                <p className="text-xs text-muted-foreground mb-1">
                                  {product.description}
                                </p>
                                <h4 className="font-semibold text-sm line-clamp-2 mb-2">
                                  {product.title}
                                </h4>
                                {product.price && (
                                  <p className="text-accent font-bold">
                                    ${product.price}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accounts Section */}
                  {accounts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Accounts</h3>
                      <div className="space-y-3">
                        {accounts.map((account) => (
                          <Card key={account.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={account.avatar} />
                                  <AvatarFallback>
                                    <User className="w-6 h-6" />
                                  </AvatarFallback>
                                </Avatar>
                                 <div className="flex-1">
                                  <h4 className="font-semibold">{account.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {account.username}
                                  </p>
                                  {account.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {account.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    Follow
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <MessageCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="map" className="mt-0">
                  <div className="h-[500px] w-full">
                    <Map 
                      divePoints={posts.map(post => ({
                        id: post.id,
                        name: post.title,
                        coordinates: [-16.9186, 145.7781] as [number, number],
                        description: post.description
                      }))} 
                      className="h-full w-full" 
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}

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
    </>
  );
};

export default Search;
