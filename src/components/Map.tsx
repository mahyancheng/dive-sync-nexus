import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const Map = ({ divePoints = [], className = '' }: MapProps) => {
  const defaultDivePoints: DivePoint[] = [
    { id: '1', name: 'Blue Corner Wall', coordinates: [-8.0891, 134.2167], difficulty: 'Advanced', maxDepth: '28m' },
    { id: '2', name: 'SS Yongala Wreck', coordinates: [-19.3167, 147.6167], difficulty: 'Intermediate', maxDepth: '18m' },
    { id: '3', name: 'USS Liberty Wreck', coordinates: [-8.2765, 115.5937], difficulty: 'Advanced', maxDepth: '22m' },
    { id: '4', name: 'Cod Hole', coordinates: [-14.4167, 145.6167], difficulty: 'Beginner', maxDepth: '15m' },
  ];

  const points = divePoints.length > 0 ? divePoints : defaultDivePoints;
  const centerPosition: any = points.length > 0 
    ? [points[0].coordinates[0], points[0].coordinates[1]] 
    : [-15, 130];

  return (
    <div className={`relative ${className}`}>
      {/* @ts-ignore - react-leaflet types issue */}
      <MapContainer
        center={centerPosition}
        zoom={4}
        className="w-full h-full rounded-lg"
        style={{ zIndex: 0 }}
      >
        {/* @ts-ignore - react-leaflet types issue */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {points.map((point) => {
          const position: any = [point.coordinates[0], point.coordinates[1]];
          return (
            // @ts-ignore - react-leaflet types issue
            <Marker
              key={point.id}
              position={position}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-sm mb-1">{point.name}</h3>
                  {point.difficulty && (
                    <p className="text-xs mb-1">
                      <strong>Difficulty:</strong> {point.difficulty}
                    </p>
                  )}
                  {point.maxDepth && (
                    <p className="text-xs mb-1">
                      <strong>Max Depth:</strong> {point.maxDepth}
                    </p>
                  )}
                  {point.description && (
                    <p className="text-xs mt-2">{point.description}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;
