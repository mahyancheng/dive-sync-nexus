import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

interface GenerateMockDataButtonProps {
  diveCenterId: string;
  onDataGenerated: () => void;
}

export const GenerateMockDataButton = ({ diveCenterId, onDataGenerated }: GenerateMockDataButtonProps) => {
  const [loading, setLoading] = useState(false);

  const generateMockData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate mock equipment
      const mockEquipment = [
        { equipment_type: "BCD", size: "M", status: "available" },
        { equipment_type: "BCD", size: "L", status: "available" },
        { equipment_type: "Regulator", size: null, status: "available" },
        { equipment_type: "Regulator", size: null, status: "maintenance" },
        { equipment_type: "Wetsuit", size: "M", status: "available" },
        { equipment_type: "Wetsuit", size: "L", status: "rented" },
        { equipment_type: "Fins", size: "9-10", status: "available" },
        { equipment_type: "Mask", size: null, status: "available" },
      ];

      await supabase.from("dive_equipment").insert(
        mockEquipment.map(e => ({ ...e, dive_center_id: diveCenterId }))
      );

      // Generate mock tanks
      const mockTanks = [
        { tank_number: "T-001", gas_type: "Air", pressure_bar: 200, status: "full" },
        { tank_number: "T-002", gas_type: "Air", pressure_bar: 200, status: "full" },
        { tank_number: "T-003", gas_type: "Nitrox 32", pressure_bar: 0, status: "empty" },
        { tank_number: "T-004", gas_type: "Air", pressure_bar: 180, status: "full" },
        { tank_number: "T-005", gas_type: "Air", pressure_bar: 0, status: "empty" },
      ];

      await supabase.from("dive_tanks").insert(
        mockTanks.map(t => ({ ...t, dive_center_id: diveCenterId }))
      );

      // Generate mock bookings
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Generate mock boats
      const mockBoats = [
        { name: "Blue Marlin", max_capacity: 12, status: "available" },
        { name: "Sea Explorer", max_capacity: 10, status: "available" },
      ];

      const { data: boatsData } = await supabase
        .from("boats")
        .insert(mockBoats.map(b => ({ ...b, dive_center_id: diveCenterId })))
        .select();

      // Generate mock compressors
      const mockCompressors = [
        { name: "Main Compressor", running_hours: 450, dives_since_service: 85, maintenance_trigger: 100 },
        { name: "Backup Compressor", running_hours: 120, dives_since_service: 20, maintenance_trigger: 100 },
      ];

      await supabase.from("compressors").insert(
        mockCompressors.map(c => ({ ...c, dive_center_id: diveCenterId }))
      );

      const mockBookings = [
        {
          dive_center_id: diveCenterId,
          customer_id: user.id,
          dive_date: tomorrow.toISOString(),
          dive_type: "boat",
          boat_id: boatsData?.[0]?.id,
          group_name: "Morning Dive Group",
          booking_date: new Date().toISOString(),
          participants_count: 2,
          total_amount: 150,
          deposit_amount: 50,
          payment_status: "deposit",
          status: "confirmed"
        },
        {
          dive_center_id: diveCenterId,
          customer_id: user.id,
          dive_date: nextWeek.toISOString(),
          dive_type: "shore",
          group_name: "Afternoon Dive Group",
          booking_date: new Date().toISOString(),
          participants_count: 1,
          total_amount: 75,
          payment_status: "unpaid",
          status: "pending"
        }
      ];

      const { data: bookingsData } = await supabase
        .from("dive_bookings")
        .insert(mockBookings)
        .select();

      // Add conditions to first booking
      if (bookingsData?.[0]) {
        await supabase.from("dive_conditions").insert({
          booking_id: bookingsData[0].id,
          temperature: 28,
          wind_speed: 10,
          wave_height: 0.8,
          tide_status: "High Tide 10:30 AM",
          flag_status: "green",
          flag_reason: "Safe conditions"
        });

        // Add catering to first booking
        await supabase.from("trip_catering").insert({
          booking_id: bookingsData[0].id,
          total_pax: 2,
          meal_items: ["Sandwiches", "Fruit Platter", "Bottled Water"],
          preparation_status: "ordered"
        });
      }

      toast.success("Mock data generated successfully!");
      onDataGenerated();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate mock data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={generateMockData}
      disabled={loading}
      className="gap-2"
    >
      <Sparkles className="w-4 h-4" />
      {loading ? "Generating..." : "Generate Mock Data"}
    </Button>
  );
};
