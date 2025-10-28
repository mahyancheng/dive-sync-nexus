import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Gauge, Clock, Plus, TrendingUp, Award } from "lucide-react";

const Logbook = () => {
  const stats = [
    { label: "Total Dives", value: "127", icon: TrendingUp, color: "text-accent" },
    { label: "Max Depth", value: "42m", icon: Gauge, color: "text-coral" },
    { label: "Total Time", value: "89h", icon: Clock, color: "text-primary" },
    { label: "Certifications", value: "5", icon: Award, color: "text-accent-glow" },
  ];

  const recentDives = [
    {
      date: "Nov 10, 2025",
      site: "Blue Corner Wall",
      location: "Palau",
      depth: "28m",
      time: "45 min",
      visibility: "25m",
      conditions: "Excellent",
      notes: "Strong current, saw manta rays and gray reef sharks",
    },
    {
      date: "Nov 8, 2025",
      site: "SS Yongala Wreck",
      location: "Great Barrier Reef",
      depth: "18m",
      time: "52 min",
      visibility: "20m",
      conditions: "Good",
      notes: "Historic wreck covered in soft corals, spotted sea snakes",
    },
    {
      date: "Nov 5, 2025",
      site: "The Cathedral",
      location: "Phi Phi Islands",
      depth: "22m",
      time: "38 min",
      visibility: "18m",
      conditions: "Good",
      notes: "Beautiful swim-throughs and caverns with good light penetration",
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-4 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Logbook</h1>
            <p className="text-muted-foreground">Track your diving journey and achievements</p>
          </div>
          <Button variant="coral" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Dive
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 border-accent/20 shadow-ocean hover:shadow-glow transition-all">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <Badge variant="secondary" className="text-xs">{stat.label}</Badge>
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </Card>
          ))}
        </div>

        {/* Recent Dives */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Dives</h2>
          <div className="space-y-4">
            {recentDives.map((dive, index) => (
              <Card key={index} className="p-6 border-accent/20 hover:shadow-ocean transition-all cursor-pointer">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{dive.site}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{dive.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{dive.date}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-accent/10 text-accent border-accent/20">
                        {dive.conditions}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-coral" />
                        <span className="text-sm">
                          <span className="font-semibold">Depth:</span> {dive.depth}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-accent" />
                        <span className="text-sm">
                          <span className="font-semibold">Time:</span> {dive.time}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">Visibility:</span> {dive.visibility}
                      </div>
                    </div>

                    {/* Notes */}
                    <p className="text-sm text-muted-foreground">{dive.notes}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logbook;
