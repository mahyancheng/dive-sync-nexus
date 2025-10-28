import React from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DivePoint {
  id: string;
  name: string;
  coordinates: [number, number];
  description?: string;
  difficulty?: string;
  maxDepth?: string;
}

interface MapProps {
  divePoints?: DivePoint[];
  className?: string;
}

const Map = ({ divePoints = [], className = '' }: MapProps) => {
  const defaultDivePoints: DivePoint[] = [
    { id: '1', name: 'Blue Corner Wall', coordinates: [-8.0891, 134.2167], difficulty: 'Advanced', maxDepth: '28m' },
    { id: '2', name: 'SS Yongala Wreck', coordinates: [-19.3167, 147.6167], difficulty: 'Intermediate', maxDepth: '18m' },
    { id: '3', name: 'USS Liberty Wreck', coordinates: [-8.2765, 115.5937], difficulty: 'Advanced', maxDepth: '22m' },
    { id: '4', name: 'Cod Hole', coordinates: [-14.4167, 145.6167], difficulty: 'Beginner', maxDepth: '15m' },
  ];

  const points = divePoints.length > 0 ? divePoints : defaultDivePoints;

  return (
    <div className={`relative ${className}`}>
      {/* Simple Map Placeholder with embedded OpenStreetMap iframe */}
      <div className="w-full h-full rounded-lg overflow-hidden bg-muted relative">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src="https://www.openstreetmap.org/export/embed.html?bbox=110.0,-30.0,160.0,0.0&layer=mapnik&marker=-15,135"
          style={{ border: 0 }}
          title="Dive Sites Map"
        />
        
        {/* Overlay with dive points list */}
        <div className="absolute bottom-4 left-4 right-4 max-h-48 overflow-y-auto space-y-2">
          {points.map((point) => (
            <Card key={point.id} className="p-3 glass-effect backdrop-blur-md border-accent/20 hover:shadow-glow transition-all cursor-pointer">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">{point.name}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {point.difficulty && (
                      <Badge variant="secondary" className="text-xs">
                        {point.difficulty}
                      </Badge>
                    )}
                    {point.maxDepth && (
                      <span className="text-xs text-muted-foreground">
                        Max: {point.maxDepth}
                      </span>
                    )}
                  </div>
                  {point.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {point.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Map;
