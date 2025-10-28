import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { PageTransition } from "./components/PageTransition";
import BottomNav from "./components/BottomNav";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import Shop from "./pages/Shop";
import Create from "./pages/Create";
import Logbook from "./pages/Logbook";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import BuddyFinder from "./pages/BuddyFinder";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    {children}
    <BottomNav />
  </>
);

const MainPages = () => (
  <div className="w-screen h-screen overflow-hidden fixed inset-0">
    <PageTransition />
    <BottomNav />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPages />} />
          <Route path="/explore" element={<MainPages />} />
          <Route path="/shop" element={<MainPages />} />
          <Route path="/create" element={<AppLayout><Create /></AppLayout>} />
          <Route path="/logbook" element={<AppLayout><Logbook /></AppLayout>} />
          <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/buddy-finder" element={<AppLayout><BuddyFinder /></AppLayout>} />
          <Route path="/messages" element={<AppLayout><Messages /></AppLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
