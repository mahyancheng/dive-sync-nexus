import { Home, Compass, MessageCircle, BookOpen, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: "/", label: "Feed", icon: Home },
    { path: "/buddy-finder", label: "Buddies", icon: Users },
    { path: "/messages", label: "Messages", icon: MessageCircle },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors"
            >
              <Icon 
                className={`w-6 h-6 ${
                  active ? "text-accent" : "text-muted-foreground"
                }`}
              />
              <span 
                className={`text-xs ${
                  active ? "text-accent font-medium" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
