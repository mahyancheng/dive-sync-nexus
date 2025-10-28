import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Feed from "@/pages/Feed";
import Explore from "@/pages/Explore";
import Shop from "@/pages/Shop";
import { NavSwitcher } from "@/components/ui/nav-switcher";
import Search from "@/components/Search";

const routeOrder = ["/", "/explore", "/shop"];

export const PageTransition = () => {
  const location = useLocation();
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const index = routeOrder.indexOf(location.pathname);
    if (index !== -1) {
      setPosition(index);
    }
  }, [location.pathname]);

  return (
    <div className="w-screen h-screen overflow-hidden">
      {/* Floating Navigation - Always on Top */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] md:top-4">
        <NavSwitcher defaultValue={position === 0 ? "following" : position === 1 ? "explore" : "shop"} />
      </div>

      {/* Search Button - Always on Top Right */}
      <Search />

      <motion.div
        className="flex h-full"
        animate={{
          x: `${-position * 100}vw`,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        style={{ width: `${routeOrder.length * 100}vw` }}
      >
        {/* Following Page */}
        <div className="w-screen h-full flex-shrink-0 overflow-y-auto">
          <Feed />
        </div>
        
        {/* Explore Page */}
        <div className="w-screen h-full flex-shrink-0 overflow-y-auto">
          <Explore />
        </div>
        
        {/* Shop Page */}
        <div className="w-screen h-full flex-shrink-0 overflow-y-auto">
          <Shop />
        </div>
      </motion.div>
    </div>
  );
};
