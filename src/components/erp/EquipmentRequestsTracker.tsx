import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface EquipmentRequest {
  id: string;
  participant_id: string;
  participant_name: string;
  equipment_type: string | null;
  size: string | null;
}

interface Assignment {
  id: string;
  participant_id: string | null;
  equipment_id: string | null;
  equipment_type?: string;
  equipment_size?: string;
  equipment_code?: string;
}

interface EquipmentRequestsTrackerProps {
  eventId: string;
  participants: Array<{
    id: string;
    participant_name: string;
    equipment_requests?: Array<{
      id: string;
      equipment_type: string | null;
      size: string | null;
    }>;
  }>;
}

export const EquipmentRequestsTracker = ({ eventId, participants }: EquipmentRequestsTrackerProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, [eventId, participants]);

  const fetchAssignments = async () => {
    try {
      // Fetch equipment assignments with equipment details
      const { data, error } = await supabase
        .from("event_inventory_assignments")
        .select(`
          id,
          participant_id,
          equipment_id,
          dive_equipment (
            id,
            equipment_type,
            size,
            status
          )
        `)
        .eq("event_id", eventId)
        .eq("inventory_type", "equipment");

      if (error) throw error;

      const mapped = (data || []).map(a => ({
        id: a.id,
        participant_id: a.participant_id,
        equipment_id: a.equipment_id,
        equipment_type: a.dive_equipment?.equipment_type,
        equipment_size: a.dive_equipment?.size,
        equipment_code: a.equipment_id ? a.equipment_id.slice(0, 8).toUpperCase() : undefined,
      }));

      setAssignments(mapped);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Flatten all equipment requests with participant info
  const allRequests: EquipmentRequest[] = participants.flatMap(p => 
    (p.equipment_requests || []).map(eq => ({
      id: eq.id,
      participant_id: p.id,
      participant_name: p.participant_name,
      equipment_type: eq.equipment_type,
      size: eq.size,
    }))
  );

  // Check if a request has been assigned - match by participant AND equipment type
  const getAssignmentForRequest = (request: EquipmentRequest) => {
    return assignments.find(a => 
      a.participant_id === request.participant_id &&
      a.equipment_type?.toLowerCase() === request.equipment_type?.toLowerCase()
    );
  };

  // Group requests by status
  const assignedRequests = allRequests.filter(r => getAssignmentForRequest(r));
  const unassignedRequests = allRequests.filter(r => !getAssignmentForRequest(r));

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (allRequests.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No equipment requests from participants
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>{assignedRequests.length} Assigned</span>
        </div>
        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="w-4 h-4" />
          <span>{unassignedRequests.length} Unassigned</span>
        </div>
      </div>

      {/* Unassigned Requests */}
      {unassignedRequests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Unassigned Equipment (Needs Attention)
          </h4>
          <div className="space-y-1">
            {unassignedRequests.map((request) => (
              <div 
                key={request.id} 
                className="flex items-center justify-between p-2 border border-destructive/30 rounded bg-destructive/5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{request.participant_name}</span>
                  <span className="text-muted-foreground">needs</span>
                  <Badge variant="outline" className="text-xs">
                    {request.equipment_type}{request.size ? ` (${request.size})` : ''}
                  </Badge>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Not Assigned
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Requests */}
      {assignedRequests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            Assigned Equipment
          </h4>
          <div className="space-y-1">
            {assignedRequests.map((request) => {
              const assignment = getAssignmentForRequest(request);
              const sizeMatches = !request.size || assignment?.equipment_size === request.size;
              
              return (
                <div 
                  key={request.id} 
                  className={`flex items-center justify-between p-2 border rounded text-sm ${
                    sizeMatches 
                      ? "border-green-500/30 bg-green-500/5" 
                      : "border-yellow-500/30 bg-yellow-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{request.participant_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {request.equipment_type}{request.size ? ` (${request.size})` : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                      #{assignment?.equipment_code || 'N/A'}
                    </Badge>
                    {assignment?.equipment_size && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          sizeMatches 
                            ? "text-green-600 border-green-500" 
                            : "text-yellow-600 border-yellow-500"
                        }`}
                      >
                        Size: {assignment.equipment_size}
                        {!sizeMatches && " ⚠️"}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
