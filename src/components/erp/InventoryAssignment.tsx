import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Wand2 } from "lucide-react";

interface EquipmentRequest {
  equipment_type: string | null;
  size: string | null;
}

interface Participant {
  id: string;
  participant_name: string;
  equipment_requests?: EquipmentRequest[];
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
  originalStatus?: string; // Original status for display (e.g., "full", "empty" for tanks)
  code: string;
  max_capacity?: number;
}

interface InventoryAssignmentProps {
  eventId: string;
  eventIds?: string[]; // For multi-day trips
  inventoryType: "tank" | "boat" | "equipment";
  participants: Participant[];
  tanksPerPerson?: number;
  onAssignmentChange?: () => void;
}

export const InventoryAssignment = ({
  eventId,
  eventIds,
  inventoryType,
  participants,
  tanksPerPerson = 2,
  onAssignmentChange,
}: InventoryAssignmentProps) => {
  // Helper to check if an item is available based on inventory type
  const isItemAvailable = (status: string) => {
    if (inventoryType === "tank") {
      // Tanks use "full", "empty" as available states (not "in_use", "maintenance", "disposed")
      return status === "full" || status === "empty";
    }
    // Boats and equipment use "available"
    return status === "available";
  };
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [diveCenterId, setDiveCenterId] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState<string | null>(null);

  const effectiveEventIds = eventIds && eventIds.length > 0 ? eventIds : [eventId];

  useEffect(() => {
    fetchDiveCenterAndDate();
  }, [eventId]);

  useEffect(() => {
    if (diveCenterId && eventDate) {
      fetchAssignments();
      fetchInventoryItems();
    }
  }, [eventId, inventoryType, diveCenterId, eventDate]);

  const fetchDiveCenterAndDate = async () => {
    try {
      // Try to get dive_center_id from custom_events first
      const { data: customEvent } = await supabase
        .from("custom_events")
        .select("dive_center_id, start_time")
        .eq("id", eventId)
        .maybeSingle();

      if (customEvent?.dive_center_id) {
        setDiveCenterId(customEvent.dive_center_id);
        setEventDate(customEvent.start_time);
        return;
      }

      // Try from dive_bookings
      const { data: booking } = await supabase
        .from("dive_bookings")
        .select("dive_center_id, dive_date")
        .eq("id", eventId)
        .maybeSingle();

      if (booking?.dive_center_id) {
        setDiveCenterId(booking.dive_center_id);
        setEventDate(booking.dive_date);
      }
    } catch (error) {
      console.error("Error fetching dive center:", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      // Fetch assignments for all event IDs (for multi-day trips)
      const { data, error } = await supabase
        .from("event_inventory_assignments")
        .select("*")
        .in("event_id", effectiveEventIds)
        .eq("inventory_type", inventoryType)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const fetchInventoryItems = async () => {
    if (!diveCenterId || !eventDate) return;
    
    try {
      // Get the date of this event (just the date part, no time)
      const eventDateOnly = eventDate.split('T')[0];
      
      // Get all events on the same date to find conflicting assignments
      const { data: customEventsOnDate } = await supabase
        .from("custom_events")
        .select("id, start_time")
        .eq("dive_center_id", diveCenterId)
        .gte("start_time", `${eventDateOnly}T00:00:00`)
        .lt("start_time", `${eventDateOnly}T23:59:59`);
      
      const { data: bookingsOnDate } = await supabase
        .from("dive_bookings")
        .select("id, dive_date")
        .eq("dive_center_id", diveCenterId)
        .gte("dive_date", `${eventDateOnly}T00:00:00`)
        .lt("dive_date", `${eventDateOnly}T23:59:59`);
      
      // Combine event IDs from same date (excluding our trip group)
      const sameDayEventIds = [
        ...(customEventsOnDate || []).map(e => e.id),
        ...(bookingsOnDate || []).map(b => b.id)
      ].filter(id => !effectiveEventIds.includes(id));
      
      // Get items assigned to OTHER events on the SAME day
      let assignedItemIds: string[] = [];
      if (sameDayEventIds.length > 0) {
        const { data: conflictingAssignments } = await supabase
          .from("event_inventory_assignments")
          .select("tank_id, boat_id, equipment_id")
          .in("event_id", sameDayEventIds);
        
        if (conflictingAssignments) {
          conflictingAssignments.forEach(e => {
            if (inventoryType === "tank" && e.tank_id) assignedItemIds.push(e.tank_id);
            if (inventoryType === "boat" && e.boat_id) assignedItemIds.push(e.boat_id);
            if (inventoryType === "equipment" && e.equipment_id) assignedItemIds.push(e.equipment_id);
          });
        }
      }

      let query;
      if (inventoryType === "tank") {
        query = supabase.from("dive_tanks").select("id, tank_number, status, gas_type").eq("dive_center_id", diveCenterId);
      } else if (inventoryType === "boat") {
        query = supabase.from("boats").select("id, name, status, max_capacity").eq("dive_center_id", diveCenterId);
      } else {
        query = supabase.from("dive_equipment").select("id, equipment_type, size, status").eq("dive_center_id", diveCenterId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const mapped = data?.map(item => {
        const code = item.id.slice(0, 8).toUpperCase();
        let displayName = "";
        if (inventoryType === "tank") {
          displayName = `#${item.tank_number || code}${item.gas_type && item.gas_type !== 'Air' ? ` (${item.gas_type})` : ''}`;
        } else if (inventoryType === "boat") {
          displayName = `${item.name} (Cap: ${item.max_capacity || '?'})`;
        } else {
          displayName = `#${code} - ${item.equipment_type}${item.size ? ` (${item.size})` : ''}`;
        }
        
        // Mark as unavailable only if assigned to another event on the SAME day
        const isAssignedElsewhere = assignedItemIds.includes(item.id);
        // Also consider item's own status (maintenance, disposed, etc.)
        const baseStatus = item.status || "available";
        
        // Normalize status for display and filtering
        let effectiveStatus: string;
        if (isAssignedElsewhere) {
          effectiveStatus = "assigned_elsewhere";
        } else if (inventoryType === "tank") {
          // Normalize tank status: full/empty = available for assignment
          effectiveStatus = (baseStatus === "full" || baseStatus === "empty") ? "available" : baseStatus;
        } else {
          effectiveStatus = baseStatus;
        }
        
        return {
          ...item,
          name: displayName,
          code,
          max_capacity: item.max_capacity,
          originalStatus: baseStatus, // Keep original for display
          status: effectiveStatus
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
      const availableItem = inventoryItems.find(i => i.status === "available");
      if (!availableItem) {
        toast.error(`No available ${inventoryType}s`);
        setLoading(false);
        return;
      }

      const insertData: any = {
        event_id: eventId,
        inventory_type: inventoryType,
      };

      if (inventoryType === "tank") {
        insertData.tank_id = availableItem.id;
      } else if (inventoryType === "boat") {
        insertData.boat_id = availableItem.id;
      } else {
        insertData.equipment_id = availableItem.id;
      }

      const { error } = await supabase
        .from("event_inventory_assignments")
        .insert(insertData);

      if (error) throw error;
      
      toast.success("Assignment added");
      fetchAssignments();
      onAssignmentChange?.();
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
      onAssignmentChange?.();
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
      onAssignmentChange?.();
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

  // Smart auto-assign that matches equipment requests by type AND size
  const smartAutoAssign = async () => {
    if (inventoryType === "tank") {
      return autoAssignTanks();
    }
    if (inventoryType === "boat") {
      return autoAssignBoats();
    }

    // Equipment: Get all equipment requests from participants
    const allRequests: Array<{ participantId: string; type: string; size: string | null }> = [];
    participants.forEach(p => {
      (p.equipment_requests || []).forEach(req => {
        if (req.equipment_type) {
          allRequests.push({
            participantId: p.id,
            type: req.equipment_type,
            size: req.size,
          });
        }
      });
    });

    if (allRequests.length === 0) {
      toast.info("No equipment requests from participants");
      return;
    }

    // Get already assigned participant+type combos
    const existingAssignments = assignments.map(a => {
      const item = inventoryItems.find(i => i.id === a.equipment_id);
      return {
        participantId: a.participant_id,
        type: item?.equipment_type,
      };
    });

    // Filter out requests that are already assigned
    const pendingRequests = allRequests.filter(req => 
      !existingAssignments.some(ea => 
        ea.participantId === req.participantId && 
        ea.type?.toLowerCase() === req.type.toLowerCase()
      )
    );

    if (pendingRequests.length === 0) {
      toast.info("All equipment requests already assigned");
      return;
    }

    setLoading(true);
    const newAssignments: any[] = [];
    const usedItemIds = new Set(assignments.map(a => a.equipment_id).filter(Boolean));

    for (const request of pendingRequests) {
      // Find matching equipment by type and size
      let matchingItem = inventoryItems.find(item => 
        item.equipment_type?.toLowerCase() === request.type.toLowerCase() &&
        item.size === request.size &&
        item.status === "available" &&
        !usedItemIds.has(item.id)
      );

      // If no exact size match, try to find same type with any available size
      if (!matchingItem) {
        matchingItem = inventoryItems.find(item => 
          item.equipment_type?.toLowerCase() === request.type.toLowerCase() &&
          item.status === "available" &&
          !usedItemIds.has(item.id)
        );
      }

      if (matchingItem) {
        usedItemIds.add(matchingItem.id);
        newAssignments.push({
          event_id: eventId,
          inventory_type: "equipment",
          participant_id: request.participantId,
          equipment_id: matchingItem.id,
        });
      }
    }

    if (newAssignments.length === 0) {
      toast.error("No matching equipment available in inventory");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("event_inventory_assignments")
        .insert(newAssignments);

      if (error) throw error;
      
      const unmatched = pendingRequests.length - newAssignments.length;
      if (unmatched > 0) {
        toast.warning(`Assigned ${newAssignments.length} items. ${unmatched} requests could not be matched (insufficient inventory)`);
      } else {
        toast.success(`Smart-assigned ${newAssignments.length} equipment items`);
      }
      fetchAssignments();
      onAssignmentChange?.();
    } catch (error) {
      console.error("Error smart-assigning:", error);
      toast.error("Failed to auto-assign");
    } finally {
      setLoading(false);
    }
  };

  // Auto-assign tanks: X tanks per person based on number of dives
  const autoAssignTanks = async () => {
    const availableTanks = inventoryItems.filter(item => item.status === "available");
    const tanksNeeded = participants.length * tanksPerPerson;
    const existingTankCount = assignments.length;
    const tanksToAssign = tanksNeeded - existingTankCount;

    if (tanksToAssign <= 0) {
      toast.info(`Already have ${existingTankCount} tanks assigned (need ${tanksNeeded})`);
      return;
    }

    if (availableTanks.length === 0) {
      toast.error("No available tanks");
      return;
    }

    setLoading(true);
    try {
      const newAssignments: any[] = [];
      const usedTankIds = new Set(assignments.map(a => a.tank_id).filter(Boolean));
      
      // Assign tanks to each participant
      for (const participant of participants) {
        const participantTanks = assignments.filter(a => a.participant_id === participant.id).length;
        const tanksNeededForParticipant = tanksPerPerson - participantTanks;
        
        for (let i = 0; i < tanksNeededForParticipant; i++) {
          const availableTank = availableTanks.find(t => !usedTankIds.has(t.id));
          if (availableTank) {
            usedTankIds.add(availableTank.id);
            newAssignments.push({
              event_id: eventId,
              inventory_type: "tank",
              participant_id: participant.id,
              tank_id: availableTank.id,
            });
          }
        }
      }

      if (newAssignments.length === 0) {
        toast.error("No tanks available for assignment");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("event_inventory_assignments")
        .insert(newAssignments);

      if (error) throw error;
      
      if (newAssignments.length < tanksToAssign) {
        toast.warning(`Assigned ${newAssignments.length} tanks. ${tanksToAssign - newAssignments.length} more needed but not available`);
      } else {
        toast.success(`Assigned ${newAssignments.length} tanks (${tanksPerPerson} per person)`);
      }
      fetchAssignments();
      onAssignmentChange?.();
    } catch (error) {
      console.error("Error auto-assigning tanks:", error);
      toast.error("Failed to auto-assign tanks");
    } finally {
      setLoading(false);
    }
  };

  // Auto-assign boats: fit participants into boats based on capacity
  const autoAssignBoats = async () => {
    const availableBoats = inventoryItems.filter(item => item.status === "available");
    
    if (availableBoats.length === 0) {
      toast.error("No available boats");
      return;
    }

    // Get participants without boat assignment
    const assignedParticipantIds = new Set(assignments.map(a => a.participant_id).filter(Boolean));
    const unassignedParticipants = participants.filter(p => !assignedParticipantIds.has(p.id));

    if (unassignedParticipants.length === 0) {
      toast.info("All participants already assigned to boats");
      return;
    }

    setLoading(true);
    try {
      const newAssignments: any[] = [];
      const usedBoatIds = new Set(assignments.map(a => a.boat_id).filter(Boolean));
      
      // Sort boats by capacity (largest first)
      const sortedBoats = [...availableBoats].sort((a, b) => (b.max_capacity || 0) - (a.max_capacity || 0));
      
      let remainingParticipants = [...unassignedParticipants];
      
      for (const boat of sortedBoats) {
        if (remainingParticipants.length === 0) break;
        if (usedBoatIds.has(boat.id)) continue;
        
        const capacity = boat.max_capacity || 10;
        const participantsForBoat = remainingParticipants.slice(0, capacity);
        
        for (const participant of participantsForBoat) {
          newAssignments.push({
            event_id: eventId,
            inventory_type: "boat",
            participant_id: participant.id,
            boat_id: boat.id,
          });
        }
        
        usedBoatIds.add(boat.id);
        remainingParticipants = remainingParticipants.slice(capacity);
      }

      if (newAssignments.length === 0) {
        toast.error("No boats available for assignment");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("event_inventory_assignments")
        .insert(newAssignments);

      if (error) throw error;
      
      if (remainingParticipants.length > 0) {
        toast.warning(`Assigned ${newAssignments.length} participants. ${remainingParticipants.length} still need boats (insufficient capacity)`);
      } else {
        toast.success(`Assigned ${newAssignments.length} participants to boats`);
      }
      fetchAssignments();
      onAssignmentChange?.();
    } catch (error) {
      console.error("Error auto-assigning boats:", error);
      toast.error("Failed to auto-assign boats");
    } finally {
      setLoading(false);
    }
  };

  const autoAssignFIFO = async () => {
    if (inventoryType === "tank") return autoAssignTanks();
    if (inventoryType === "boat") return autoAssignBoats();
    return smartAutoAssign();
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
          {inventoryType === "equipment" ? (
            <Button size="sm" variant="outline" onClick={smartAutoAssign} disabled={loading}>
              <Wand2 className="w-4 h-4 mr-2" />
              Smart Assign
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={autoAssignFIFO} disabled={loading}>
              Auto Assign
            </Button>
          )}
          <Button size="sm" onClick={addAssignment} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No {inventoryType} assignments yet
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => {
            const itemId = assignment[getInventoryIdField()];
            const item = inventoryItems.find(i => i.id === itemId);
            
            return (
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
                      value={itemId || ""}
                      onValueChange={(value) =>
                        updateAssignment(assignment.id, getInventoryIdField() as any, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${inventoryType}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem 
                            key={item.id} 
                            value={item.id} 
                            disabled={item.status !== "available" && itemId !== item.id}
                          >
                            {item.name} 
                            {item.status === "assigned_elsewhere" 
                              ? "(In Use)" 
                              : item.status !== "available" && itemId !== item.id 
                                ? `(${item.status})` 
                                : item.originalStatus && item.originalStatus !== "available"
                                  ? `(${item.originalStatus})`
                                  : ""}
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
            );
          })}
        </div>
      )}
    </div>
  );
};
