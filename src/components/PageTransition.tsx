import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  }),
};

const routeOrder = ["/", "/explore", "/shop"];

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  
  const getDirection = () => {
    const currentIndex = routeOrder.indexOf(location.pathname);
    const previousIndex = routeOrder.indexOf(sessionStorage.getItem("previousPath") || "/");
    sessionStorage.setItem("previousPath", location.pathname);
    return currentIndex > previousIndex ? 1 : -1;
  };

  return (
    <AnimatePresence mode="wait" custom={getDirection()}>
      <motion.div
        key={location.pathname}
        custom={getDirection()}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
