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
  name: string;
  tank_number?: string;
  equipment_type?: string;
  size?: string;
  status: string;
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
  const [diveCenterId, setDiveCenterId] = useState<string | null>(null);

  useEffect(() => {
    fetchDiveCenterId();
  }, [eventId]);

  useEffect(() => {
    if (diveCenterId) {
      fetchAssignments();
      fetchInventoryItems();
    }
  }, [eventId, inventoryType, diveCenterId]);

  const fetchDiveCenterId = async () => {
    try {
      // Try to get dive_center_id from custom_events first
      const { data: customEvent } = await supabase
        .from("custom_events")
        .select("dive_center_id")
        .eq("id", eventId)
        .maybeSingle();

      if (customEvent?.dive_center_id) {
        setDiveCenterId(customEvent.dive_center_id);
        return;
      }

      // Try from dive_bookings
      const { data: booking } = await supabase
        .from("dive_bookings")
        .select("dive_center_id")
        .eq("id", eventId)
        .maybeSingle();

      if (booking?.dive_center_id) {
        setDiveCenterId(booking.dive_center_id);
      }
    } catch (error) {
      console.error("Error fetching dive center:", error);
    }
  };

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
    if (!diveCenterId) return;
    
    try {
      let query;
      if (inventoryType === "tank") {
        query = supabase.from("dive_tanks").select("id, tank_number, status").eq("dive_center_id", diveCenterId);
      } else if (inventoryType === "boat") {
        query = supabase.from("boats").select("id, name, status").eq("dive_center_id", diveCenterId);
      } else {
        query = supabase.from("dive_equipment").select("id, equipment_type, size, status").eq("dive_center_id", diveCenterId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const mapped = data?.map(item => {
        let displayName = "";
        if (inventoryType === "tank") {
          displayName = `Tank ${item.tank_number}`;
        } else if (inventoryType === "boat") {
          displayName = item.name;
        } else {
          displayName = item.size ? `${item.equipment_type} (${item.size})` : item.equipment_type;
        }
        return {
          ...item,
          name: displayName,
          status: item.status || "available"
        };
      }) || [];
      
      setInventoryItems(mapped);
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

  const autoAssign = async () => {
    const unassignedParticipants = participants.filter(
      p => !assignments.some(a => a.participant_id === p.id)
    );
    
    if (unassignedParticipants.length === 0) {
      toast.info("All participants already assigned");
      return;
    }

    const availableItems = inventoryItems.filter(item => item.status === "available");
    
    if (availableItems.length === 0) {
      toast.error(`No available ${inventoryType}s`);
      return;
    }

    setLoading(true);
    try {
      const newAssignments = unassignedParticipants.slice(0, availableItems.length).map((participant, index) => {
        const insertData: any = {
          event_id: eventId,
          inventory_type: inventoryType,
          participant_id: participant.id,
        };

        if (inventoryType === "tank") {
          insertData.tank_id = availableItems[index].id;
        } else if (inventoryType === "boat") {
          insertData.boat_id = availableItems[index].id;
        } else {
          insertData.equipment_id = availableItems[index].id;
        }

        return insertData;
      });

      const { error } = await supabase
        .from("event_inventory_assignments")
        .insert(newAssignments);

      if (error) throw error;
      
      toast.success(`Auto-assigned ${newAssignments.length} ${inventoryType}(s)`);
      fetchAssignments();
    } catch (error) {
      console.error("Error auto-assigning:", error);
      toast.error("Failed to auto-assign");
    } finally {
      setLoading(false);
    }
  };

  const availableCount = inventoryItems.filter(item => item.status === "available").length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold capitalize">{inventoryType} Assignments</h3>
          <p className="text-sm text-muted-foreground">
            {availableCount} of {inventoryItems.length} available
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={autoAssign} disabled={loading}>
            Auto Assign (FIFO)
          </Button>
          <Button size="sm" onClick={addAssignment} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Add Assignment
          </Button>
        </div>
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
                        <SelectItem key={item.id} value={item.id} disabled={item.status !== "available" && assignment[getInventoryIdField()] !== item.id}>
                          {item.name} {item.status !== "available" && `(${item.status})`}
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
