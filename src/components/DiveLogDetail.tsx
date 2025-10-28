import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Gauge, Clock, Thermometer, Wind, Eye, Users, Camera } from "lucide-react";

interface DiveLog {
  site: string;
  maxDepth: string;
  duration: string;
  visibility: string;
  notes: string;
  temperature?: string;
  coordinates?: { lat: number; lng: number };
  airConsumption?: string;
  avgDepth?: string;
  buddies?: Array<{ name: string; avatar?: string }>;
  media?: Array<{ url: string; type: 'image' | 'video' }>;
}

interface DiveLogDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diveLog: DiveLog;
  diveNumber?: number;
  totalDives?: number;
}

const DiveLogDetail = ({ open, onOpenChange, diveLog, diveNumber, totalDives }: DiveLogDetailProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            {diveLog.site}
            {diveNumber && totalDives && (
              <Badge variant="secondary" className="ml-auto">
                Dive {diveNumber}/{totalDives}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Dive Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-4 h-4 text-coral" />
              <span className="text-xs text-muted-foreground">Max Depth</span>
            </div>
            <span className="text-lg font-bold">{diveLog.maxDepth}</span>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Avg Depth</span>
            </div>
            <span className="text-lg font-bold">{diveLog.avgDepth || 'N/A'}</span>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Duration</span>
            </div>
            <span className="text-lg font-bold">{diveLog.duration}</span>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Visibility</span>
            </div>
            <span className="text-lg font-bold">{diveLog.visibility}</span>
          </div>

          {diveLog.temperature && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Thermometer className="w-4 h-4 text-coral" />
                <span className="text-xs text-muted-foreground">Temperature</span>
              </div>
              <span className="text-lg font-bold">{diveLog.temperature}</span>
            </div>
          )}

          {diveLog.airConsumption && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">Air Usage</span>
              </div>
              <span className="text-lg font-bold">{diveLog.airConsumption}</span>
            </div>
          )}
        </div>

        {/* Coordinates */}
        {diveLog.coordinates && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Coordinates
            </h3>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-mono">
                {diveLog.coordinates.lat.toFixed(6)}°, {diveLog.coordinates.lng.toFixed(6)}°
              </p>
              <button className="text-xs text-accent mt-2 hover:underline">
                View on map
              </button>
            </div>
          </div>
        )}

        {/* Dive Buddies */}
        {diveLog.buddies && diveLog.buddies.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Dive Buddies ({diveLog.buddies.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {diveLog.buddies.map((buddy, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 pr-4">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={buddy.avatar} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {buddy.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{buddy.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Gallery */}
        {diveLog.media && diveLog.media.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Dive Media ({diveLog.media.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {diveLog.media.map((item, index) => (
                <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={`Dive media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/50">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Notes</h3>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">{diveLog.notes}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DiveLogDetail;
