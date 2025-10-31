import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, Plus, BarChart3 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { InventoryStats } from "@/components/erp/InventoryStats";
import { InventoryTable, InventoryItem } from "@/components/erp/InventoryTable";
import { differenceInDays } from "date-fns";

const ERPEquipment = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [tanks, setTanks] = useState<any[]>([]);
  const [boats, setBoats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [diveCenterId, setDiveCenterId] = useState<string | null>(null);

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isVendor = roles?.some(r => (r.role as string) === 'vendor');
    if (!isVendor) {
      toast.error("Access denied");
      navigate("/profile");
      return;
    }

    fetchInventory();
  };

  const fetchInventory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: centers } = await supabase
      .from("dive_centers")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!centers) {
      setLoading(false);
      return;
    }
    
    setDiveCenterId(centers.id);

    // Fetch all inventory types
    const [equipmentRes, tanksRes, boatsRes] = await Promise.all([
      supabase.from("dive_equipment").select("*").eq("dive_center_id", centers.id),
      supabase.from("dive_tanks").select("*").eq("dive_center_id", centers.id),
      supabase.from("boats").select("*").eq("dive_center_id", centers.id)
    ]);

    if (equipmentRes.data) setEquipment(equipmentRes.data);
    if (tanksRes.data) setTanks(tanksRes.data);
    if (boatsRes.data) setBoats(boatsRes.data);
    
    setLoading(false);
  };

  // Transform all items into unified inventory format
  const inventoryItems: InventoryItem[] = useMemo(() => {
    const items: InventoryItem[] = [];

    // Add equipment
    equipment.forEach(item => {
      items.push({
        id: `equipment-${item.id}`,
        name: `${item.equipment_type}${item.size ? ` (${item.size})` : ''}`,
        asset_code: `EQ-${item.id.substring(0, 6)}`,
        category: "equipment",
        status: item.status || "available",
        condition: "good", // Default since not in schema
        current_value: 500, // Estimate
        next_maintenance: item.next_service_date
      });
    });

    // Add tanks
    tanks.forEach(tank => {
      items.push({
        id: `tank-${tank.id}`,
        name: `Tank ${tank.tank_number} (${tank.gas_type})`,
        asset_code: `TANK-${tank.tank_number}`,
        category: "tank",
        status: tank.status === "full" ? "available" : tank.status === "empty" ? "maintenance" : tank.status,
        condition: tank.pressure_bar > 150 ? "excellent" : tank.pressure_bar > 100 ? "good" : "fair",
        current_value: 800,
        next_maintenance: tank.hydrostatic_test_date
      });
    });

    // Add boats
    boats.forEach(boat => {
      items.push({
        id: `boat-${boat.id}`,
        name: boat.name,
        asset_code: `BOAT-${boat.id.substring(0, 6)}`,
        category: "boat",
        status: boat.status || "available",
        condition: "good",
        current_value: 50000,
        location: "Marina"
      });
    });

    return items;
  }, [equipment, tanks, boats]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalItems = inventoryItems.length;
    const totalValue = inventoryItems.reduce((sum, item) => sum + item.current_value, 0);
    const depreciation = Math.floor(totalValue * 0.15); // Estimate 15% depreciation
    
    const maintenanceDue = inventoryItems.filter(item => {
      if (!item.next_maintenance) return false;
      const daysUntil = differenceInDays(new Date(item.next_maintenance), new Date());
      return daysUntil <= 30 && daysUntil >= 0;
    }).length;

    const checkedOut = inventoryItems.filter(item => 
      item.status === "checked-out" || item.status === "rented"
    ).length;

    const anomalies = inventoryItems.filter(item => 
      item.condition === "poor" || item.status === "lost"
    ).length;

    return {
      totalItems,
      totalValue,
      depreciation,
      maintenanceDue,
      checkedOut,
      anomalies
    };
  }, [inventoryItems]);

  const handleViewHistory = (itemId: string) => {
    toast.info("Item history coming soon");
  };

  const handleEditItem = (itemId: string) => {
    toast.info("Edit item coming soon");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/erp")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                Inventory Management
              </h1>
              <p className="text-sm text-muted-foreground">Track boats, equipment, tanks and maintenance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading inventory...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <InventoryStats {...stats} />

            {/* Inventory Table */}
            <InventoryTable
              items={inventoryItems}
              onViewHistory={handleViewHistory}
              onEditItem={handleEditItem}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default ERPEquipment;
