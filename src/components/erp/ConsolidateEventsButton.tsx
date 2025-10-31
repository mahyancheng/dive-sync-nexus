import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConsolidateEventsButtonProps {
  diveCenterId: string;
  onConsolidated: () => void;
}

export const ConsolidateEventsButton = ({ diveCenterId, onConsolidated }: ConsolidateEventsButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleConsolidate = async () => {
    setLoading(true);
    try {
      // Fetch all bookings without end_date, grouped by group_name
      const { data: bookings } = await supabase
        .from("dive_bookings")
        .select("*")
        .eq("dive_center_id", diveCenterId)
        .is("end_date", null)
        .not("group_name", "is", null)
        .order("dive_date", { ascending: true });

      if (!bookings || bookings.length === 0) {
        toast.info("No events to consolidate");
        setLoading(false);
        return;
      }

      // Group bookings by group_name
      const grouped = bookings.reduce((acc, booking) => {
        const key = booking.group_name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(booking);
        return acc;
      }, {} as Record<string, any[]>);

      let consolidated = 0;
      let deleted = 0;

      // Process each group
      for (const [groupName, groupBookings] of Object.entries(grouped)) {
        if (groupBookings.length <= 1) continue;

        // Sort by date
        groupBookings.sort((a, b) => new Date(a.dive_date).getTime() - new Date(b.dive_date).getTime());

        // Check if they're consecutive days
        let isConsecutive = true;
        for (let i = 1; i < groupBookings.length; i++) {
          const prevDate = new Date(groupBookings[i - 1].dive_date);
          const currDate = new Date(groupBookings[i].dive_date);
          const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff !== 1) {
            isConsecutive = false;
            break;
          }
        }

        if (isConsecutive) {
          // Update the first booking with end_date
          const firstBooking = groupBookings[0];
          const lastBooking = groupBookings[groupBookings.length - 1];

          await supabase
            .from("dive_bookings")
            .update({ end_date: lastBooking.dive_date })
            .eq("id", firstBooking.id);

          // Delete the rest
          const idsToDelete = groupBookings.slice(1).map(b => b.id);
          await supabase
            .from("dive_bookings")
            .delete()
            .in("id", idsToDelete);

          consolidated++;
          deleted += idsToDelete.length;
        }
      }

      if (consolidated > 0) {
        toast.success(`Consolidated ${consolidated} multi-day events (removed ${deleted} duplicates)`);
        onConsolidated();
      } else {
        toast.info("No consecutive events found to consolidate");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to consolidate events");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wand2 className="w-4 h-4" />
          Consolidate Events
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Consolidate Multi-Day Events</AlertDialogTitle>
          <AlertDialogDescription>
            This will find groups of consecutive single-day events with the same group name and merge them into 
            single multi-day events. This is useful for cleaning up events created before the multi-day feature.
            <br /><br />
            <strong>This action cannot be undone.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConsolidate} disabled={loading}>
            {loading ? "Consolidating..." : "Consolidate Events"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};