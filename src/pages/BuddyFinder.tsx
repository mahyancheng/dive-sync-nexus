import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users, Anchor, Clock, DollarSign, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProfileDetail from "@/components/ProfileDetail";
import TripDetail from "@/components/TripDetail";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";

const BuddyFinder = () => {
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchExperiences();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .limit(20);
    if (data) setUsers(data);
  };

  const fetchExperiences = async () => {
    const { data } = await supabase
      .from('experiences')
      .select('*, dive_centers(name)')
      .limit(20);
    if (data) setExperiences(data);
  };

  const diveBuddies = users.length > 0 ? users.map(u => ({
    id: u.id,
    name: u.full_name || u.username,
    avatar: u.avatar_url,
    role: u.bio || 'Diver',
    location: u.location || 'Unknown',
    bio: u.bio,
    totalDives: u.total_dives || 0,
    certifications: u.certifications || [],
    joinedDate: new Date(u.joined_date).toLocaleDateString(),
    availability: 'Available',
    preferredSites: [],
    posts: [],
  })) : [
    {
      name: "Sarah Ocean",
      avatar: "",
      role: "Dive Instructor",
      location: "Cairns, Australia",
      bio: "PADI Master Scuba Diver Trainer with 15 years of experience. Love wreck diving and underwater photography!",
      totalDives: 487,
      certifications: ["PADI Master Scuba Diver Trainer", "PADI Rescue Diver", "EFR Instructor", "Underwater Photography Specialist"],
      joinedDate: "January 2020",
      availability: "Available this weekend",
      preferredSites: ["Great Barrier Reef", "SS Yongala Wreck"],
      posts: [
        { image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400", caption: "Epic dive", likes: 342 },
        { image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400", caption: "Wreck diving", likes: 289 },
        { image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400", caption: "Beautiful reef", likes: 156 },
      ]
    },
    {
      name: "Mike Deep",
      avatar: "",
      role: "Advanced Diver",
      location: "Bali, Indonesia",
      bio: "Technical diver specializing in deep wrecks. Always looking for the next adventure!",
      totalDives: 312,
      certifications: ["PADI Advanced Open Water", "TDI Advanced Nitrox", "PADI Wreck Diver"],
      joinedDate: "June 2021",
      availability: "Available next week",
      preferredSites: ["USS Liberty Wreck", "Tulamben Drop Off"],
      posts: [
        { image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400", caption: "Wreck exploration", likes: 201 },
      ]
    },
    {
      name: "Emma Coral",
      avatar: "",
      role: "Marine Biologist",
      location: "Palau",
      bio: "Marine conservation researcher. Looking for dive buddies interested in reef monitoring and data collection.",
      totalDives: 198,
      certifications: ["PADI Rescue Diver", "Coral Reef Research Diver", "PADI Peak Performance Buoyancy"],
      joinedDate: "March 2022",
      availability: "Available weekdays",
      preferredSites: ["Blue Corner", "German Channel"],
      posts: [
        { image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400", caption: "Research dive", likes: 178 },
        { image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400", caption: "Coral study", likes: 134 },
      ]
    },
  ];

  const upcomingTrips = experiences.length > 0 ? experiences.map(exp => ({
    id: exp.id,
    title: exp.title,
    location: exp.location,
    price: exp.price,
    rating: exp.rating || 0,
    image: exp.image_url || 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    date: exp.next_date ? new Date(exp.next_date).toLocaleDateString() : 'TBD',
    duration: exp.duration,
    spotsLeft: exp.spots_left,
    totalSpots: exp.total_spots,
    operator: (exp.dive_centers as any)?.name || 'Dive Center',
    difficulty: exp.difficulty,
    includes: exp.includes || [],
    description: exp.description,
  })) : [
    {
      title: "Great Barrier Reef Expedition",
      location: "Cairns, Australia",
      price: 1200,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
      date: "Dec 15-20, 2025",
      duration: "6 days",
      spotsLeft: 3,
      totalSpots: 12,
      operator: "Ocean Adventures",
      difficulty: "Intermediate",
      includes: ["Accommodation", "All meals", "Equipment rental", "12 dives"],
      description: "Explore the world's largest coral reef system with experienced guides. Visit iconic dive sites including Cod Hole and SS Yongala wreck.",
    },
    {
      title: "Maldives Liveaboard Adventure",
      location: "Male, Maldives",
      price: 2400,
      rating: 5.0,
      image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800",
      date: "Jan 10-17, 2026",
      duration: "8 days",
      spotsLeft: 5,
      totalSpots: 16,
      operator: "Blue Horizon Diving",
      difficulty: "Advanced",
      includes: ["Liveaboard accommodation", "All meals", "Equipment", "20+ dives", "Nitrox"],
      description: "Ultimate liveaboard experience visiting the best dive sites in the Maldives. Night dives, manta rays, whale sharks guaranteed!",
    },
    {
      title: "Bali Wreck Diving Week",
      location: "Tulamben, Bali",
      price: 850,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
      date: "Nov 25-30, 2025",
      duration: "6 days",
      spotsLeft: 8,
      totalSpots: 10,
      operator: "Bali Dive Center",
      difficulty: "All levels",
      includes: ["Hotel accommodation", "Breakfast", "Equipment", "10 dives", "USS Liberty access"],
      description: "Discover the famous USS Liberty wreck and other incredible dive sites around Bali. Perfect for wreck diving enthusiasts!",
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pt-4 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Dive Buddies & Join Trips</h1>
          <p className="text-muted-foreground">Connect with divers and explore amazing dive destinations</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by location, dive site, or certification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="buddies" className="space-y-6">
          <TabsList>
            <TabsTrigger value="buddies">
              <Users className="w-4 h-4 mr-2" />
              Dive Buddies
            </TabsTrigger>
            <TabsTrigger value="trips">
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming Trips
            </TabsTrigger>
          </TabsList>

          {/* Dive Buddies Tab */}
          <TabsContent value="buddies" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {diveBuddies.map((buddy, index) => (
                <Card 
                  key={index} 
                  className="bento-card overflow-hidden border-accent/20 hover:shadow-glow transition-all cursor-pointer group"
                  onClick={() => setSelectedProfile(buddy)}
                >
                  {/* Profile Image */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-accent/20 to-primary/20">
                    <div className="w-full h-full flex items-center justify-center">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={buddy.avatar} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-2xl">
                          {buddy.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Online Status */}
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    {/* Badges */}
                    <div className="absolute bottom-2 left-2">
                      <Badge className="glass-effect backdrop-blur-sm text-xs">
                        {buddy.totalDives} dives
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-0.5 truncate">{buddy.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 truncate">{buddy.role}</p>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{buddy.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="w-3 h-3 text-coral" />
                        <span className="text-muted-foreground truncate">{buddy.availability}</span>
                      </div>
                    </div>

                    <Button size="sm" className="w-full h-7 text-xs" variant="accent">
                      <Users className="w-3 h-3 mr-1" />
                      Connect
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Upcoming Trips Tab */}
          <TabsContent value="trips" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {upcomingTrips.map((trip, index) => (
                <Card 
                  key={index} 
                  className="bento-card overflow-hidden border-accent/20 hover:shadow-glow transition-all cursor-pointer group"
                  onClick={() => setSelectedTrip(trip)}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={trip.image}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Badges */}
                    <div className="absolute top-2 left-2">
                      <Badge className="glass-effect backdrop-blur-sm text-xs px-1.5 py-0 bg-coral text-white">
                        {trip.spotsLeft} spots
                      </Badge>
                    </div>
                    {/* Rating */}
                    <div className="absolute top-2 right-2">
                      <Badge className="glass-effect backdrop-blur-sm text-xs px-1.5 py-0">
                        ⭐ {trip.rating}
                      </Badge>
                    </div>
                    {/* Price */}
                    <div className="absolute bottom-2 right-2">
                      <div className="glass-effect backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span className="text-sm font-bold text-accent">${trip.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{trip.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2 truncate">{trip.operator}</p>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{trip.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{trip.date}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{trip.duration}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {trip.difficulty}
                        </Badge>
                      </div>
                    </div>

                    <Button size="sm" className="w-full h-7 text-xs" variant="coral">
                      Join Trip
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <ProfileDetail
          open={!!selectedProfile}
          onOpenChange={(open) => !open && setSelectedProfile(null)}
          profile={selectedProfile}
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

export default BuddyFinder;
