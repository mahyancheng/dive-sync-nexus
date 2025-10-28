import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Gauge, Clock, Plus, TrendingUp, Award } from "lucide-react";
import DiveLogDetail from "@/components/DiveLogDetail";

const Logbook = () => {
  const [selectedDive, setSelectedDive] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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
      maxDepth: "28m",
      avgDepth: "22m",
      duration: "45 min",
      visibility: "25m",
      conditions: "Excellent",
      notes: "Strong current, saw manta rays and gray reef sharks",
      temperature: "28°C",
      airConsumption: "180 bar",
      coordinates: { lat: 7.2413, lng: 134.2192 },
      buddies: [
        { name: "Sarah Chen", avatar: "" },
        { name: "Mike Torres", avatar: "" }
      ],
      media: [
        { url: "", type: 'image' as const },
        { url: "", type: 'image' as const }
      ]
    },
    {
      date: "Nov 8, 2025",
      site: "SS Yongala Wreck",
      location: "Great Barrier Reef",
      maxDepth: "18m",
      avgDepth: "15m",
      duration: "52 min",
      visibility: "20m",
      conditions: "Good",
      notes: "Historic wreck covered in soft corals, spotted sea snakes",
      temperature: "26°C",
      airConsumption: "160 bar",
      coordinates: { lat: -19.3086, lng: 147.6364 },
      buddies: [
        { name: "Alex Kim", avatar: "" }
      ],
      media: [
        { url: "", type: 'image' as const }
      ]
    },
    {
      date: "Nov 5, 2025",
      site: "The Cathedral",
      location: "Phi Phi Islands",
      maxDepth: "22m",
      avgDepth: "18m",
      duration: "38 min",
      visibility: "18m",
      conditions: "Good",
      notes: "Beautiful swim-throughs and caverns with good light penetration",
      temperature: "29°C",
      airConsumption: "140 bar",
      coordinates: { lat: 7.7407, lng: 98.7784 },
      buddies: [],
      media: []
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
            <Card key={index} className="p-6 glass-effect bento-card glass-hover">
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
              <Card 
                key={index} 
                className="p-6 glass-effect bento-card glass-hover cursor-pointer"
                onClick={() => {
                  setSelectedDive(dive);
                  setIsDetailOpen(true);
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
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

                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-coral" />
                        <span className="text-sm">
                          <span className="font-semibold">Depth:</span> {dive.maxDepth}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-accent" />
                        <span className="text-sm">
                          <span className="font-semibold">Time:</span> {dive.duration}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">Visibility:</span> {dive.visibility}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">{dive.notes}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {selectedDive && (
        <DiveLogDetail
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          diveLog={selectedDive}
          diveNumber={recentDives.findIndex(d => d.site === selectedDive.site) + 1}
          totalDives={127}
        />
      )}
    </div>
  );
};

export default Logbook;
