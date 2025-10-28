import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Award, MapPin, Users, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Profile = () => {
  const stats = [
    { label: "Dives", value: "127" },
    { label: "Followers", value: "2.4K" },
    { label: "Following", value: "385" },
  ];

  const posts = [1, 2, 3, 4, 5, 6].map(i => ({
    id: i,
    image: `https://images.unsplash.com/photo-${1559827260 + i}-dc66d52bef19?w=400`,
  }));

  return (
    <div className="min-h-screen bg-background pt-4 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-24 h-24 mb-4 border-4 border-accent/20">
            <AvatarImage src="" />
            <AvatarFallback className="bg-accent text-accent-foreground text-2xl">
              JD
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold mb-1">John Diver</h2>
          <p className="text-muted-foreground mb-2">Advanced Open Water Diver</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <MapPin className="w-4 h-4" />
            <span>Great Barrier Reef, Australia</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 w-full max-w-sm">
            <Button variant="accent" className="flex-1">
              Edit Profile
            </Button>
            <Button variant="outline" className="flex-1">
              Share Profile
            </Button>
          </div>
        </div>

        {/* Certifications */}
        <Card className="p-4 mb-6 border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Certifications</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Open Water</Badge>
            <Badge variant="secondary">Advanced Open Water</Badge>
            <Badge variant="secondary">Rescue Diver</Badge>
            <Badge variant="secondary">Nitrox</Badge>
            <Badge variant="secondary">Deep Diver</Badge>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div 
                  key={post.id}
                  className="aspect-square bg-muted rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img 
                    src={post.image} 
                    alt={`Post ${post.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              No saved posts yet
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
