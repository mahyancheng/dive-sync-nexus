import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MapPin, Users, Calendar, Star, Map as MapIcon, Heart, UserPlus, Grid3x3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import TripDetail from "@/components/TripDetail";
import Map from "@/components/Map";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";

const BuddyFinder = () => {
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchExperiences();
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

  const listings = experiences.length > 0 ? experiences.map(exp => ({
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
    {
      title: "Bioluminescence Night Dive",
      centre: "Manta Divers",
      location: "Maldives",
      price: 95,
      rating: 4.8,
      reviews: 67,
      image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800",
      nextDate: "Nov 22, 2025",
      seatsLeft: 8,
      badges: ["Night Dive", "Special"],
    },
    {
      title: "Private Charter - Full Day",
      centre: "Sunset Charters",
      location: "Key Largo, USA",
      price: 850,
      rating: 4.9,
      reviews: 45,
      image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800",
      nextDate: "Nov 18, 2025",
      seatsLeft: 6,
      badges: ["Charter", "Premium"],
    },
  ];

  const divePoints = listings.map(listing => ({
    id: listing.title,
    name: listing.title,
    coordinates: (
      listing.location.includes("Australia") ? [-16.9186, 145.7781] :
      listing.location.includes("Thailand") ? [7.8804, 98.3923] :
      listing.location.includes("Maldives") ? [3.2028, 73.2207] :
      listing.location.includes("USA") ? [25.0869, -80.4305] :
      [0, 0]
    ) as [number, number],
    difficulty: "All levels",
    maxDepth: "30m"
  }));

  // Extract unique locations and types
  const locations = ["All", ...new Set(listings.map(l => l.location.split(',')[1]?.trim() || l.location))];
  const types = ["All", "Reef Dive", "Course", "Night Dive", "Charter", "Wreck Dive"];

  // Filter listings
  const filteredListings = listings.filter(listing => {
    const matchesLocation = selectedLocation === "All" || listing.location.includes(selectedLocation);
    const matchesType = selectedType === "All" || listing.badges.some(b => b.toLowerCase().includes(selectedType.toLowerCase().replace(" ", "")));
    const matchesSearch = searchQuery === "" || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesType && matchesSearch;
  });

  return (
    <AuthGuard>
      <div className="w-screen min-h-screen bg-background pt-4 pb-20">
      <div className="w-full px-4 pt-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Dive Trips</h1>
          <p className="text-muted-foreground">Find and book your next underwater adventure</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by location, dive site, or activity..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Location</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {locations.map((location) => (
                <Button
                  key={location}
                  size="sm"
                  variant={selectedLocation === location ? "accent" : "outline"}
                  onClick={() => setSelectedLocation(location)}
                  className="whitespace-nowrap"
                >
                  {location}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Type</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {types.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={selectedType === type ? "accent" : "outline"}
                  onClick={() => setSelectedType(type)}
                  className="whitespace-nowrap"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs for Grid/Map/Open Trips View */}
        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grid">
              <Grid3x3 className="w-4 h-4 mr-2" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapIcon className="w-4 h-4 mr-2" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="open-trips">
              <Users className="w-4 h-4 mr-2" />
              Open Trips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-0">
            {/* Listings Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredListings.map((listing, index) => (
                <Card 
                  key={index} 
                  className="bento-card overflow-hidden border-accent/20 hover:shadow-glow transition-all cursor-pointer group"
                  onClick={() => setSelectedTrip(listing)}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {listing.badges.map((badge, i) => (
                        <Badge key={i} className="glass-effect backdrop-blur-sm text-xs px-1.5 py-0">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    {/* Price */}
                    <div className="absolute bottom-2 right-2">
                      <div className="glass-effect backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span className="text-sm font-bold text-accent">${listing.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{listing.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{listing.centre}</p>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{listing.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{listing.nextDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-coral fill-coral" />
                          <span className="font-semibold">{listing.rating}</span>
                          <span className="text-muted-foreground">({listing.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{listing.seatsLeft} left</span>
                        </div>
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

          <TabsContent value="map" className="mt-0">
            <div className="h-[600px] w-full">
              <Map divePoints={divePoints} className="h-full w-full" />
            </div>
          </TabsContent>

          <TabsContent value="open-trips" className="mt-0">
            {/* Recommended Trip of the Day */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">🌟 Recommended for You</h3>
              <Card className="bento-card overflow-hidden border-accent/20 hover:shadow-glow transition-all">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800"
                    alt="Recommended dive"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="glass-effect backdrop-blur-sm">Perfect Match</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-lg mb-2">Weekend Reef Exploration</h4>
                  <p className="text-sm text-muted-foreground mb-3">Join a group of intermediate divers exploring vibrant coral reefs</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>Great Barrier Reef, Australia</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Dec 15, 2025 • 9:00 AM</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>4 spots left of 8</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=host" />
                      <AvatarFallback>DC</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Ocean Adventures</p>
                      <p className="text-xs text-muted-foreground">Dive Center</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" variant="accent">Request to Join</Button>
                    <Button variant="outline" size="icon">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* All Open Trips - Carousel */}
            <div>
              <h3 className="text-lg font-semibold mb-4">All Open Trips</h3>
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {filteredListings.map((listing, index) => (
                    <CarouselItem key={index} className="pl-2 md:pl-4 basis-[85%] md:basis-1/2">
                      <Card 
                        className="bento-card overflow-hidden border-accent/20 hover:shadow-glow transition-all cursor-pointer h-full"
                        onClick={() => setSelectedTrip(listing)}
                      >
                        <div className="relative aspect-[16/9] overflow-hidden">
                          <img
                            src={listing.image}
                            alt={listing.title}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            {listing.badges?.slice(0, 2).map((badge, i) => (
                              <Badge key={i} className="glass-effect backdrop-blur-sm text-xs px-1.5 py-0">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                          {/* Price */}
                          <div className="absolute bottom-2 right-2">
                            <div className="glass-effect backdrop-blur-sm px-2 py-1 rounded-lg">
                              <span className="text-sm font-bold text-accent">${listing.price}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <h4 className="font-semibold text-base mb-2 line-clamp-2">{listing.title}</h4>
                          <p className="text-xs text-muted-foreground mb-3">{listing.centre}</p>
                          
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{listing.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{listing.nextDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-coral fill-coral" />
                              <span className="font-semibold">{listing.rating}</span>
                              <span className="text-muted-foreground">({listing.reviews})</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span className="font-medium">{listing.seatsLeft} spots left</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4" />
                <CarouselNext className="hidden md:flex -right-4" />
              </Carousel>

              {/* Buddy Finder Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3">🤝 Find a Dive Buddy</h3>
                <Card className="bento-card p-4 border-accent/20">
                  <p className="text-sm text-muted-foreground mb-4">
                    Looking for someone to dive with? Post your dive plans or browse other divers seeking buddies.
                  </p>
                  <Button className="w-full" variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Post Buddy Request
                  </Button>
                </Card>
              </div>
            </div>
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
    </div>
    </AuthGuard>
  );
};

export default BuddyFinder;
