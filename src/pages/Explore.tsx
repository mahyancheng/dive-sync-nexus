import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Users, Calendar, Star, Map as MapIcon } from "lucide-react";
import { NavSwitcher } from "@/components/ui/nav-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TripDetail from "@/components/TripDetail";
import Map from "@/components/Map";

const Explore = () => {
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const listings = [
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

  return (
    <div className="w-screen min-h-screen bg-background pt-4 pb-20">
      <div className="w-full px-4 pt-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Dive Trips</h1>
          <p className="text-muted-foreground">Find and book your next underwater adventure</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by location, dive site, or activity..."
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Tabs for Grid/Map View */}
        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grid">
              <Calendar className="w-4 h-4 mr-2" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapIcon className="w-4 h-4 mr-2" />
              Map View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-0">
            {/* Listings Grid */}
            <div className="grid grid-cols-2 gap-3">
              {listings.map((listing, index) => (
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
  );
};

export default Explore;
