import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Anchor, Droplets, FileText, TrendingUp, DollarSign, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const stats = [
    { label: "Today's Sessions", value: "4", change: "+2", icon: Calendar, color: "text-accent" },
    { label: "Active Bookings", value: "28", change: "+5", icon: Users, color: "text-coral" },
    { label: "Revenue (MTD)", value: "$12.4K", change: "+18%", icon: DollarSign, color: "text-primary" },
    { label: "Avg Rating", value: "4.9", change: "+0.1", icon: Star, color: "text-accent-glow" },
  ];

  const todaysSessions = [
    {
      time: "08:00 AM",
      title: "2-Tank Morning Reef Dive",
      boat: "Blue Marlin",
      instructor: "Sarah Ocean",
      booked: 6,
      capacity: 8,
      status: "scheduled",
    },
    {
      time: "10:30 AM",
      title: "PADI Open Water - Session 2",
      boat: "Sea Explorer",
      instructor: "Mike Deep",
      booked: 4,
      capacity: 4,
      status: "boarding",
    },
    {
      time: "02:00 PM",
      title: "Advanced Wreck Dive",
      boat: "Blue Marlin",
      instructor: "Sarah Ocean",
      booked: 5,
      capacity: 8,
      status: "scheduled",
    },
    {
      time: "06:00 PM",
      title: "Sunset Discovery Dive",
      boat: "Coral Queen",
      instructor: "Alex Wave",
      booked: 3,
      capacity: 6,
      status: "scheduled",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "boarding":
        return "bg-coral/10 text-coral border-coral/20";
      case "departed":
        return "bg-accent/10 text-accent border-accent/20";
      case "scheduled":
        return "bg-secondary";
      default:
        return "bg-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-background pt-4 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Operations Dashboard</h1>
          <p className="text-muted-foreground">Manage your dive center operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 border-accent/20 shadow-ocean">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <Badge variant="secondary" className="text-xs bg-accent/10 text-accent">
                  {stat.change}
                </Badge>
              </div>
              <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sessions">Today's Sessions</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Today's Operations Board</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Change Date
                </Button>
                <Button variant="accent" size="sm">
                  Add Session
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {todaysSessions.map((session, index) => (
                <Card key={index} className="p-5 border-accent/20 hover:shadow-ocean transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Time */}
                    <div className="flex-shrink-0">
                      <div className="text-2xl font-bold text-primary">{session.time}</div>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{session.title}</h3>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Anchor className="w-4 h-4" />
                              <span>{session.boat}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{session.instructor}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(session.status)}>
                          {getStatusLabel(session.status)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-accent font-semibold">
                            <Users className="w-4 h-4" />
                            <span>{session.booked}/{session.capacity}</span>
                          </div>
                          <div className="text-muted-foreground">divers</div>
                        </div>
                        {session.booked < session.capacity && (
                          <Badge variant="secondary" className="text-xs">
                            {session.capacity - session.booked} seats available
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
                      {session.status === "scheduled" && (
                        <Button variant="accent" size="sm">
                          Start Boarding
                        </Button>
                      )}
                      {session.status === "boarding" && (
                        <Button variant="coral" size="sm">
                          Depart
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="equipment">
            <Card className="p-8 text-center border-accent/20">
              <Droplets className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Equipment Management</h3>
              <p className="text-muted-foreground">Track boats, tanks, and rental equipment</p>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="p-8 text-center border-accent/20">
              <TrendingUp className="w-12 h-12 text-coral mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Bookings Overview</h3>
              <p className="text-muted-foreground">Manage customer bookings and payments</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
