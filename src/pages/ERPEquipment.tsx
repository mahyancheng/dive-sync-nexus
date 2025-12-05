import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, BarChart3 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { InventoryStats } from "@/components/erp/InventoryStats";
import { InventoryTable, InventoryItem } from "@/components/erp/InventoryTable";
import { ItemHistoryDialog } from "@/components/erp/ItemHistoryDialog";
import { EditItemDialog } from "@/components/erp/EditItemDialog";
import { AddItemDialog } from "@/components/erp/AddItemDialog";
import { differenceInDays } from "date-fns";

const ERPEquipment = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [tanks, setTanks] = useState<any[]>([]);
  const [boats, setBoats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [diveCenterId, setDiveCenterId] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemCategory, setSelectedItemCategory] = useState<"equipment" | "tank" | "boat" | null>(null);

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

    // Helper to determine condition based on inspection dates
    const getInspectionCondition = (nextDate: string | null): "excellent" | "good" | "fair" | "poor" => {
      if (!nextDate) return "fair";
      const daysUntil = differenceInDays(new Date(nextDate), new Date());
      if (daysUntil < 0) return "poor"; // Overdue
      if (daysUntil <= 30) return "fair"; // Due soon
      if (daysUntil <= 90) return "good";
      return "excellent";
    };

    // Add equipment
    equipment.forEach(item => {
      const condition = item.status === "maintenance" || item.status === "needs_inspection" 
        ? "poor" 
        : getInspectionCondition(item.next_service_date);
      items.push({
        id: `equipment-${item.id}`,
        name: item.equipment_type,
        equipment_type: item.equipment_type,
        size: item.size || undefined,
        asset_code: `EQ-${item.id.substring(0, 6)}`,
        category: "equipment",
        status: item.status || "available",
        condition,
        current_value: 500,
        next_maintenance: item.next_service_date
      });
    });

    // Add tanks - determine next maintenance from visual or hydro test
    tanks.forEach(tank => {
      // Calculate next due dates
      let nextMaintenance: string | null = null;
      if (tank.visual_test_date) {
        const visualDue = new Date(tank.visual_test_date);
        visualDue.setFullYear(visualDue.getFullYear() + 1);
        nextMaintenance = visualDue.toISOString();
      }
      if (tank.hydrostatic_test_date) {
        const hydroDue = new Date(tank.hydrostatic_test_date);
        hydroDue.setFullYear(hydroDue.getFullYear() + 5);
        if (!nextMaintenance || new Date(hydroDue) < new Date(nextMaintenance)) {
          nextMaintenance = hydroDue.toISOString();
        }
      }
      
      const condition = tank.status === "maintenance" || tank.status === "needs_inspection" || tank.status === "needs_checking"
        ? "poor" 
        : getInspectionCondition(nextMaintenance);
      
      // Tank statuses: full/empty are available for scheduling, others are not
      const displayStatus = tank.status === "full" || tank.status === "empty" 
        ? "available" 
        : tank.status;
      
      items.push({
        id: `tank-${tank.id}`,
        name: `Tank ${tank.tank_number}`,
        equipment_type: `${tank.gas_type} Tank`,
        size: `${tank.pressure_bar || 0}bar`,
        asset_code: `TANK-${tank.tank_number}`,
        category: "tank",
        status: displayStatus,
        condition,
        current_value: 800,
        next_maintenance: nextMaintenance
      });
    });

    // Add boats
    boats.forEach(boat => {
      const condition = boat.status === "maintenance" || boat.status === "needs_inspection" 
        ? "poor" 
        : "good";
      items.push({
        id: `boat-${boat.id}`,
        name: boat.name,
        equipment_type: "Boat",
        size: `${boat.max_capacity} pax`,
        asset_code: `BOAT-${boat.id.substring(0, 6)}`,
        category: "boat",
        status: boat.status || "available",
        condition,
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
    const category = itemId.split('-')[0] as "equipment" | "tank" | "boat";
    setSelectedItemId(itemId);
    setSelectedItemCategory(category);
    setHistoryDialogOpen(true);
  };

  const handleEditItem = (itemId: string) => {
    const category = itemId.split('-')[0] as "equipment" | "tank" | "boat";
    setSelectedItemId(itemId);
    setSelectedItemCategory(category);
    setEditDialogOpen(true);
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
            {diveCenterId && (
              <AddItemDialog diveCenterId={diveCenterId} onItemAdded={fetchInventory} />
            )}
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

        {/* Dialogs */}
        <ItemHistoryDialog 
          itemId={selectedItemId}
          itemCategory={selectedItemCategory}
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
        />
        <EditItemDialog 
          itemId={selectedItemId}
          itemCategory={selectedItemCategory}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onItemUpdated={fetchInventory}
        />
      </main>
    </div>
  );
};

export default ERPEquipment;
