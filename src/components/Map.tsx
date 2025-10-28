import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);

  const defaultDivePoints: DivePoint[] = [
    { id: '1', name: 'Blue Corner Wall', coordinates: [134.2167, -8.0891], difficulty: 'Advanced', maxDepth: '28m' },
    { id: '2', name: 'SS Yongala Wreck', coordinates: [147.6167, -19.3167], difficulty: 'Intermediate', maxDepth: '18m' },
    { id: '3', name: 'USS Liberty Wreck', coordinates: [115.5937, -8.2765], difficulty: 'Advanced', maxDepth: '22m' },
    { id: '4', name: 'Cod Hole', coordinates: [145.6167, -14.4167], difficulty: 'Beginner', maxDepth: '15m' },
  ];

  const points = divePoints.length > 0 ? divePoints : defaultDivePoints;

  useEffect(() => {
    if (!mapContainer.current || !isTokenSet || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      projection: { name: 'globe' },
      zoom: 2,
      center: [130, -15],
      pitch: 0,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(25, 40, 60)',
        'high-color': 'rgb(15, 25, 40)',
        'horizon-blend': 0.1,
        'space-color': 'rgb(10, 15, 25)',
        'star-intensity': 0.5
      });

      // Add dive point markers
      points.forEach((point) => {
        const el = document.createElement('div');
        el.className = 'dive-marker';
        el.style.cssText = `
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, hsl(var(--accent)), hsl(var(--coral)));
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; min-width: 150px;">
            <h3 style="font-weight: bold; margin-bottom: 4px; color: hsl(var(--accent));">${point.name}</h3>
            ${point.difficulty ? `<p style="font-size: 12px; margin: 2px 0;">Difficulty: <strong>${point.difficulty}</strong></p>` : ''}
            ${point.maxDepth ? `<p style="font-size: 12px; margin: 2px 0;">Max Depth: <strong>${point.maxDepth}</strong></p>` : ''}
            ${point.description ? `<p style="font-size: 12px; margin-top: 4px;">${point.description}</p>` : ''}
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat(point.coordinates)
          .setPopup(popup)
          .addTo(map.current!);
      });
    });

    // Gentle rotation
    const secondsPerRevolution = 300;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;
    let userInteracting = false;

    function spinGlobe() {
      if (!map.current) return;
      
      const zoom = map.current.getZoom();
      if (!userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('dragstart', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', () => { spinGlobe(); });

    spinGlobe();

    return () => {
      map.current?.remove();
    };
  }, [isTokenSet, mapboxToken, points]);

  if (!isTokenSet) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 glass-effect rounded-lg ${className}`}>
        <MapPin className="w-12 h-12 text-accent mb-4" />
        <h3 className="text-lg font-semibold mb-2">Set up Interactive Map</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          Enter your Mapbox public token to view dive points on an interactive globe.
          Get your free token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">mapbox.com</a>
        </p>
        <div className="flex gap-2 w-full max-w-md">
          <Input
            type="text"
            placeholder="pk.eyJ1Ijo..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => setIsTokenSet(true)} disabled={!mapboxToken}>
            Load Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-ocean" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10 rounded-lg" />
    </div>
  );
};

export default Map;
