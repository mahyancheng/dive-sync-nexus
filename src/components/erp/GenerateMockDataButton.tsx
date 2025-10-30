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

      const mockBookings = [
        {
          dive_center_id: diveCenterId,
          customer_id: user.id,
          dive_date: tomorrow.toISOString(),
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
          booking_date: new Date().toISOString(),
          participants_count: 1,
          total_amount: 75,
          payment_status: "unpaid",
          status: "pending"
        }
      ];

      await supabase.from("dive_bookings").insert(mockBookings);

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
