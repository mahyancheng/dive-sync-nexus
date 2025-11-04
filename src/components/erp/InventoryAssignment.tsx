import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Participant {
  id: string;
  participant_name: string;
}

interface Assignment {
  id: string;
  participant_id: string | null;
  tank_id: string | null;
  boat_id: string | null;
  equipment_id: string | null;
  assigned_at: string;
  notes: string | null;
}

interface InventoryItem {
  id: string;
  name?: string;
  tank_number?: string;
  equipment_type?: string;
}

interface InventoryAssignmentProps {
  eventId: string;
  inventoryType: "tank" | "boat" | "equipment";
  participants: Participant[];
}

export const InventoryAssignment = ({
  eventId,
  inventoryType,
  participants,
}: InventoryAssignmentProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchInventoryItems();
  }, [eventId, inventoryType]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("event_inventory_assignments")
        .select("*")
        .eq("event_id", eventId)
        .eq("inventory_type", inventoryType)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      let query;
      if (inventoryType === "tank") {
        query = supabase.from("dive_tanks").select("id, tank_number as name");
      } else if (inventoryType === "boat") {
        query = supabase.from("boats").select("id, name");
      } else {
        query = supabase.from("dive_equipment").select("id, equipment_type");
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setInventoryItems(data?.map(item => ({
        ...item,
        name: item.name || item.equipment_type
      })) || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const addAssignment = async () => {
    if (inventoryItems.length === 0) {
      toast.error(`No ${inventoryType}s available`);
      return;
    }

    setLoading(true);
    try {
      const insertData: any = {
        event_id: eventId,
        inventory_type: inventoryType,
      };

      // Add the appropriate ID field
      if (inventoryType === "tank") {
        insertData.tank_id = inventoryItems[0].id;
      } else if (inventoryType === "boat") {
        insertData.boat_id = inventoryItems[0].id;
      } else {
        insertData.equipment_id = inventoryItems[0].id;
      }

      const { error } = await supabase
        .from("event_inventory_assignments")
        .insert(insertData);

      if (error) throw error;
      
      toast.success("Assignment added");
      fetchAssignments();
    } catch (error) {
      console.error("Error adding assignment:", error);
      toast.error("Failed to add assignment");
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (
    assignmentId: string,
    field: "participant_id" | "tank_id" | "boat_id" | "equipment_id",
    value: string | null
  ) => {
    try {
      const { error } = await supabase
        .from("event_inventory_assignments")
        .update({ [field]: value })
        .eq("id", assignmentId);

      if (error) throw error;
      
      toast.success("Assignment updated");
      fetchAssignments();
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Failed to update assignment");
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("event_inventory_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
      
      toast.success("Assignment deleted");
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    }
  };

  const getInventoryIdField = () => {
    if (inventoryType === "tank") return "tank_id";
    if (inventoryType === "boat") return "boat_id";
    return "equipment_id";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold capitalize">{inventoryType} Assignments</h3>
        <Button size="sm" onClick={addAssignment} disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Assignment
        </Button>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No {inventoryType} assignments yet
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="p-3 border rounded-lg flex items-center gap-3"
            >
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    {inventoryType === "tank" ? "Tank" : inventoryType === "boat" ? "Boat" : "Equipment"}
                  </label>
                  <Select
                    value={assignment[getInventoryIdField()] || ""}
                    onValueChange={(value) =>
                      updateAssignment(assignment.id, getInventoryIdField() as any, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${inventoryType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Participant</label>
                  <Select
                    value={assignment.participant_id || "unassigned"}
                    onValueChange={(value) =>
                      updateAssignment(
                        assignment.id,
                        "participant_id",
                        value === "unassigned" ? null : value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select participant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {participants.map((participant) => (
                        <SelectItem key={participant.id} value={participant.id}>
                          {participant.participant_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteAssignment(assignment.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
