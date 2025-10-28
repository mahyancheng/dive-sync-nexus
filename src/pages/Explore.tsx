import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Users, Calendar, Star } from "lucide-react";

const Explore = () => {
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

  return (
    <div className="min-h-screen bg-background pt-4 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
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

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing, index) => (
            <Card key={index} className="overflow-hidden border-accent/20 hover:shadow-glow transition-all cursor-pointer group">
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  {listing.badges.map((badge, i) => (
                    <Badge key={i} className="bg-card/90 backdrop-blur-sm">
                      {badge}
                    </Badge>
                  ))}
                </div>
                {/* Price */}
                <div className="absolute bottom-3 right-3">
                  <div className="bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-lg font-bold text-accent">${listing.price}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{listing.centre}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{listing.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{listing.nextDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-coral fill-coral" />
                      <span className="font-semibold">{listing.rating}</span>
                      <span className="text-muted-foreground">({listing.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{listing.seatsLeft} left</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full" variant="accent">
                  Book Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
