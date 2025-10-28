import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Feed from "@/pages/Feed";
import Explore from "@/pages/Explore";
import Shop from "@/pages/Shop";

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
    <motion.div
      className="flex w-full h-full"
      animate={{
        x: `${-position * 100}%`,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Following Page */}
      <div className="min-w-full h-full flex-shrink-0">
        <Feed />
      </div>
      
      {/* Explore Page */}
      <div className="min-w-full h-full flex-shrink-0">
        <Explore />
      </div>
      
      {/* Shop Page */}
      <div className="min-w-full h-full flex-shrink-0">
        <Shop />
      </div>
    </motion.div>
  );
};
