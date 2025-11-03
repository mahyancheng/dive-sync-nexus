import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Wrench, Package, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface ItemHistoryDialogProps {
  itemId: string | null;
  itemCategory: "equipment" | "tank" | "boat" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ItemHistoryDialog = ({ itemId, itemCategory, open, onOpenChange }: ItemHistoryDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (open && itemId && itemCategory) {
      fetchHistory();
    }
  }, [open, itemId, itemCategory]);

  const fetchHistory = async () => {
    if (!itemId || !itemCategory) return;
    
    setLoading(true);
    try {
      const realId = itemId.replace(`${itemCategory}-`, '');

      // Fetch maintenance logs
      const { data: logs } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq(`${itemCategory}_id`, realId)
        .order("date", { ascending: false });

      if (logs) setMaintenanceLogs(logs);

      // Fetch assignment history (for equipment and tanks)
      if (itemCategory === "equipment" || itemCategory === "tank") {
        const columnName = itemCategory === "equipment" ? "equipment_id" : "tank_id";
        const { data: assignmentData } = await supabase
          .from("equipment_assignments")
          .select(`
            *,
            booking:dive_bookings(dive_date, dive_type, location)
          `)
          .eq(columnName, realId)
          .order("assigned_date", { ascending: false });

        if (assignmentData) setAssignments(assignmentData);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Item History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading history...</div>
        ) : (
          <div className="space-y-6">
            {/* Maintenance Logs */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Maintenance History</h4>
              </div>
              {maintenanceLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No maintenance records</p>
              ) : (
                <div className="space-y-2">
                  {maintenanceLogs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{log.maintenance_type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.date), "PPP")}
                            </span>
                          </div>
                          <p className="text-sm">{log.description}</p>
                        </div>
                        {log.cost && (
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="w-3 h-3" />
                            {log.cost}
                          </div>
                        )}
                      </div>
                      {log.next_due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Calendar className="w-3 h-3" />
                          Next due: {format(new Date(log.next_due_date), "PP")}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Assignment History */}
            {(itemCategory === "equipment" || itemCategory === "tank") && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Usage History</h4>
                </div>
                {assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No usage records</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((assignment) => (
                      <Card key={assignment.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={assignment.returned_date ? "secondary" : "default"}>
                                {assignment.returned_date ? "Returned" : "In Use"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(assignment.assigned_date), "PPP")}
                              </span>
                            </div>
                            {assignment.booking && (
                              <div className="text-sm space-y-1">
                                <p>Dive Date: {format(new Date(assignment.booking.dive_date), "PP")}</p>
                                {assignment.booking.dive_type && (
                                  <p className="text-muted-foreground">Type: {assignment.booking.dive_type}</p>
                                )}
                                {assignment.booking.location && (
                                  <p className="text-muted-foreground">Location: {assignment.booking.location}</p>
                                )}
                              </div>
                            )}
                            {assignment.condition_notes && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Notes: {assignment.condition_notes}
                              </p>
                            )}
                          </div>
                          {assignment.returned_date && (
                            <span className="text-xs text-muted-foreground">
                              Returned: {format(new Date(assignment.returned_date), "PP")}
                            </span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
