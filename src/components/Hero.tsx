import { Button } from "@/components/ui/button";
import { Waves, Navigation, BookOpen, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-underwater.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-depth opacity-80" />
      </div>

      {/* Animated Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 w-4 h-4 bg-accent/30 rounded-full animate-bubble"
            style={{
              left: `${15 + i * 15}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${12 + i * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-accent/20 backdrop-blur-sm rounded-full border border-accent/30">
          <Waves className="w-4 h-4 text-accent" />
          <span className="text-accent text-sm font-medium">Dive Center Platform Reimagined</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-primary-foreground">
          Welcome to <span className="text-accent">BlueTrail</span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-12 text-primary-foreground/90 max-w-3xl mx-auto">
          The unified platform connecting dive centers, instructors, and divers. 
          Discover trips, manage operations, and share your underwater adventures.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button variant="hero" size="lg" className="text-lg">
            <Calendar className="w-5 h-5" />
            Explore Dive Trips
          </Button>
          <Button variant="coral" size="lg" className="text-lg">
            <BookOpen className="w-5 h-5" />
            View Logbook
          </Button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-4 justify-center">
          {[
            { icon: Navigation, label: "Live Trip Feed" },
            { icon: Calendar, label: "Smart Booking" },
            { icon: BookOpen, label: "Digital Logbook" },
            { icon: Waves, label: "Centre Operations" },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm rounded-lg border border-accent/20"
            >
              <feature.icon className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
        <svg
          className="absolute bottom-0 w-[200%] left-1/2 -translate-x-1/2 animate-wave"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C200,90 400,30 600,60 C800,90 1000,30 1200,60 L1200,120 L0,120 Z"
            fill="hsl(var(--background))"
            opacity="0.9"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
