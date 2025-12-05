import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Wrench, Package, Calendar, DollarSign, Ship, Anchor, AlertTriangle, CheckCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isFuture } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemHistoryDialogProps {
  itemId: string | null;
  itemCategory: "equipment" | "tank" | "boat" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MaintenanceLog {
  id: string;
  date: string;
  maintenance_type: string;
  description: string;
  cost: number | null;
  next_due_date: string | null;
  performed_by: string | null;
}

interface Assignment {
  id: string;
  assigned_date: string;
  returned_date: string | null;
  condition_notes: string | null;
  booking?: {
    dive_date: string;
    dive_type: string | null;
    location: string | null;
    group_name: string | null;
  };
  event?: {
    title: string;
    start_time: string;
    end_time: string;
  };
}

interface ItemDetails {
  id: string;
  status: string;
  // Equipment
  equipment_type?: string;
  size?: string;
  last_service_date?: string;
  next_service_date?: string;
  purchase_date?: string;
  // Tank
  tank_number?: string;
  gas_type?: string;
  hydrostatic_test_date?: string;
  visual_test_date?: string;
  pressure_bar?: number;
  // Boat
  name?: string;
  max_capacity?: number;
}

interface CalendarEvent {
  date: Date;
  type: "trip" | "maintenance" | "maintenance_due";
  label: string;
  color: string;
}

export const ItemHistoryDialog = ({ itemId, itemCategory, open, onOpenChange }: ItemHistoryDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

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

      // Fetch item details
      const tableName = itemCategory === "equipment" ? "dive_equipment" : itemCategory === "tank" ? "dive_tanks" : "boats";
      const { data: details } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", realId)
        .single();
      
      if (details) setItemDetails(details);

      // Fetch maintenance logs based on category
      let logsQuery = supabase
        .from("maintenance_logs")
        .select("*")
        .order("date", { ascending: false });
      
      if (itemCategory === "equipment") {
        logsQuery = logsQuery.eq("equipment_id", realId);
      } else if (itemCategory === "tank") {
        logsQuery = logsQuery.eq("tank_id", realId);
      } else if (itemCategory === "boat") {
        logsQuery = logsQuery.eq("boat_id", realId);
      }
      
      const { data: logs } = await logsQuery;
      if (logs) setMaintenanceLogs(logs);

      // Fetch assignment history
      if (itemCategory === "equipment" || itemCategory === "tank") {
        const assignmentColumn = itemCategory === "equipment" ? "equipment_id" : "tank_id";
        const { data: bookingAssignments } = await supabase
          .from("equipment_assignments")
          .select("*, booking:dive_bookings(dive_date, dive_type, location, group_name)")
          .eq(assignmentColumn, realId)
          .order("assigned_date", { ascending: false });

        // Also fetch event inventory assignments
        const { data: eventAssignments } = await supabase
          .from("event_inventory_assignments")
          .select("id, assigned_at, returned_at, notes, event:custom_events(title, start_time, end_time)")
          .eq(itemCategory === "equipment" ? "equipment_id" : "tank_id", realId)
          .order("assigned_at", { ascending: false });

        const combinedAssignments: Assignment[] = [];
        
        if (bookingAssignments) {
          bookingAssignments.forEach(a => {
            combinedAssignments.push({
              id: a.id,
              assigned_date: a.assigned_date,
              returned_date: a.returned_date,
              condition_notes: a.condition_notes,
              booking: a.booking as any
            });
          });
        }
        
        if (eventAssignments) {
          eventAssignments.forEach(a => {
            combinedAssignments.push({
              id: a.id,
              assigned_date: a.assigned_at,
              returned_date: a.returned_at,
              condition_notes: a.notes,
              event: a.event as any
            });
          });
        }

        setAssignments(combinedAssignments.sort((a, b) => 
          new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime()
        ));
      } else if (itemCategory === "boat") {
        // Fetch boat assignments from event_inventory_assignments
        const { data: boatAssignments } = await supabase
          .from("event_inventory_assignments")
          .select(`
            id,
            assigned_at,
            returned_at,
            notes,
            event:custom_events(title, start_time, end_time)
          `)
          .eq("boat_id", realId)
          .order("assigned_at", { ascending: false });

        if (boatAssignments) {
          setAssignments(boatAssignments.map(a => ({
            id: a.id,
            assigned_date: a.assigned_at,
            returned_date: a.returned_at,
            condition_notes: a.notes,
            event: a.event as any
          })));
        }
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Build calendar events with trip details
  const calendarEvents = useMemo((): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    // Add trip/assignment dates with full trip details
    assignments.forEach(assignment => {
      const date = assignment.booking?.dive_date 
        ? new Date(assignment.booking.dive_date)
        : assignment.event?.start_time 
          ? new Date(assignment.event.start_time)
          : new Date(assignment.assigned_date);
      
      // Build descriptive label with trip name and location
      let label = "Trip";
      if (assignment.booking) {
        const parts = [assignment.booking.group_name || "Booking"];
        if (assignment.booking.location) parts.push(`@ ${assignment.booking.location}`);
        if (assignment.booking.dive_type) parts.push(`(${assignment.booking.dive_type})`);
        label = parts.join(" ");
      } else if (assignment.event) {
        label = assignment.event.title;
      }
      
      events.push({
        date,
        type: "trip",
        label,
        color: "bg-primary"
      });
    });

    // Add maintenance dates
    maintenanceLogs.forEach(log => {
      events.push({
        date: new Date(log.date),
        type: "maintenance",
        label: log.maintenance_type,
        color: "bg-amber-500"
      });

      if (log.next_due_date) {
        events.push({
          date: new Date(log.next_due_date),
          type: "maintenance_due",
          label: `${log.maintenance_type} Due`,
          color: "bg-destructive"
        });
      }
    });

    // Add inspection due dates from item details
    if (itemDetails) {
      if (itemCategory === "tank") {
        if (itemDetails.hydrostatic_test_date) {
          const hydroDue = new Date(itemDetails.hydrostatic_test_date);
          hydroDue.setFullYear(hydroDue.getFullYear() + 5);
          events.push({
            date: hydroDue,
            type: "maintenance_due",
            label: "Hydrostatic Test Due",
            color: "bg-destructive"
          });
        }
        if (itemDetails.visual_test_date) {
          const visualDue = new Date(itemDetails.visual_test_date);
          visualDue.setFullYear(visualDue.getFullYear() + 1);
          events.push({
            date: visualDue,
            type: "maintenance_due",
            label: "Visual Inspection Due",
            color: "bg-orange-500"
          });
        }
      }
      if (itemCategory === "equipment" && itemDetails.next_service_date) {
        events.push({
          date: new Date(itemDetails.next_service_date),
          type: "maintenance_due",
          label: "Service Due",
          color: "bg-orange-500"
        });
      }
    }

    return events;
  }, [assignments, maintenanceLogs, itemDetails, itemCategory]);

  // Calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => isSameDay(event.date, day));
  };

  const getItemTitle = () => {
    if (!itemDetails) return "Item History";
    if (itemCategory === "equipment") return `${itemDetails.equipment_type} ${itemDetails.size || ""}`.trim();
    if (itemCategory === "tank") return `Tank ${itemDetails.tank_number}`;
    if (itemCategory === "boat") return itemDetails.name;
    return "Item History";
  };

  const getStatusBadge = () => {
    if (!itemDetails) return null;
    const status = itemDetails.status;
    const variant = status === "available" || status === "full" 
      ? "default" 
      : status === "maintenance" || status === "needs_checking"
        ? "destructive"
        : "secondary";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getInspectionStatus = () => {
    if (!itemDetails) return [];
    const statuses: { label: string; date: string | null; status: "ok" | "due" | "overdue" | "unknown" }[] = [];

    if (itemCategory === "tank") {
      // Visual inspection (annual)
      if (itemDetails.visual_test_date) {
        const visualDate = new Date(itemDetails.visual_test_date);
        const dueDate = new Date(visualDate);
        dueDate.setFullYear(dueDate.getFullYear() + 1);
        const now = new Date();
        statuses.push({
          label: "Visual Inspection",
          date: itemDetails.visual_test_date,
          status: dueDate < now ? "overdue" : dueDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) ? "due" : "ok"
        });
      } else {
        statuses.push({ label: "Visual Inspection", date: null, status: "unknown" });
      }

      // Hydrostatic test (5-year)
      if (itemDetails.hydrostatic_test_date) {
        const hydroDate = new Date(itemDetails.hydrostatic_test_date);
        const dueDate = new Date(hydroDate);
        dueDate.setFullYear(dueDate.getFullYear() + 5);
        const now = new Date();
        statuses.push({
          label: "Hydrostatic Test",
          date: itemDetails.hydrostatic_test_date,
          status: dueDate < now ? "overdue" : dueDate < new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) ? "due" : "ok"
        });
      } else {
        statuses.push({ label: "Hydrostatic Test", date: null, status: "unknown" });
      }
    }

    if (itemCategory === "equipment") {
      if (itemDetails.next_service_date) {
        const serviceDate = new Date(itemDetails.next_service_date);
        const now = new Date();
        statuses.push({
          label: "Annual Service",
          date: itemDetails.next_service_date,
          status: serviceDate < now ? "overdue" : serviceDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) ? "due" : "ok"
        });
      } else {
        statuses.push({ label: "Annual Service", date: null, status: "unknown" });
      }
    }

    return statuses;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            {getItemTitle()}
            <span className="ml-2">{getStatusBadge()}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading history...</div>
        ) : (
          <Tabs defaultValue="calendar" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="usage">Usage History</TabsTrigger>
            </TabsList>

            {/* Calendar View */}
            <TabsContent value="calendar" className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="font-semibold">{format(calendarMonth, "MMMM yyyy")}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: startOfMonth(calendarMonth).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {calendarDays.map(day => {
                    const dayEvents = getEventsForDay(day);
                    const hasTrip = dayEvents.some(e => e.type === "trip");
                    const hasMaintenance = dayEvents.some(e => e.type === "maintenance");
                    const hasMaintenanceDue = dayEvents.some(e => e.type === "maintenance_due");

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "aspect-square p-1 rounded-md border text-xs flex flex-col items-center justify-start",
                          isToday(day) && "border-primary",
                          dayEvents.length > 0 && "bg-muted/50"
                        )}
                      >
                        <span className={cn(
                          "w-5 h-5 flex items-center justify-center rounded-full text-[10px]",
                          isToday(day) && "bg-primary text-primary-foreground"
                        )}>
                          {format(day, "d")}
                        </span>
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                          {hasTrip && <div className="w-1.5 h-1.5 rounded-full bg-primary" title="Trip" />}
                          {hasMaintenance && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Maintenance" />}
                          {hasMaintenanceDue && <div className="w-1.5 h-1.5 rounded-full bg-destructive" title="Due" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 text-xs text-muted-foreground justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Trip/Usage</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Maintenance Done</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span>Maintenance Due</span>
                  </div>
                </div>
              </Card>

              {/* Upcoming Events List */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Upcoming Events</h4>
                <div className="space-y-2">
                  {calendarEvents
                    .filter(e => isFuture(e.date))
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 5)
                    .map((event, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className={cn("w-2 h-2 rounded-full", event.color)} />
                        <span className="text-muted-foreground">{format(event.date, "MMM d, yyyy")}</span>
                        <span>{event.label}</span>
                      </div>
                    ))}
                  {calendarEvents.filter(e => isFuture(e.date)).length === 0 && (
                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Inspections Tab */}
            <TabsContent value="inspections" className="space-y-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Inspection Status
                </h4>
                
                {getInspectionStatus().length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inspection tracking for this item type</p>
                ) : (
                  <div className="space-y-3">
                    {getInspectionStatus().map((inspection, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {inspection.status === "ok" && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {inspection.status === "due" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                          {inspection.status === "overdue" && <AlertTriangle className="w-5 h-5 text-destructive" />}
                          {inspection.status === "unknown" && <AlertTriangle className="w-5 h-5 text-muted-foreground" />}
                          <div>
                            <p className="font-medium">{inspection.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {inspection.date ? `Last done: ${format(new Date(inspection.date), "PPP")}` : "Not recorded"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          inspection.status === "ok" ? "default" :
                          inspection.status === "due" ? "secondary" :
                          inspection.status === "overdue" ? "destructive" : "outline"
                        }>
                          {inspection.status === "ok" ? "OK" :
                           inspection.status === "due" ? "Due Soon" :
                           inspection.status === "overdue" ? "Overdue" : "Unknown"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Item details */}
                {itemDetails && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="text-sm font-medium mb-2">Item Details</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {itemCategory === "tank" && (
                        <>
                          <div><span className="text-muted-foreground">Gas Type:</span> {itemDetails.gas_type}</div>
                          <div><span className="text-muted-foreground">Pressure:</span> {itemDetails.pressure_bar || "N/A"} bar</div>
                        </>
                      )}
                      {itemCategory === "equipment" && (
                        <>
                          <div><span className="text-muted-foreground">Type:</span> {itemDetails.equipment_type}</div>
                          <div><span className="text-muted-foreground">Size:</span> {itemDetails.size || "N/A"}</div>
                          {itemDetails.purchase_date && (
                            <div><span className="text-muted-foreground">Purchased:</span> {format(new Date(itemDetails.purchase_date), "PP")}</div>
                          )}
                        </>
                      )}
                      {itemCategory === "boat" && (
                        <div><span className="text-muted-foreground">Capacity:</span> {itemDetails.max_capacity} passengers</div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Maintenance History Tab */}
            <TabsContent value="maintenance" className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Maintenance History</h4>
              </div>
              {maintenanceLogs.length === 0 ? (
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">No maintenance records</p>
                </Card>
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
            </TabsContent>

            {/* Usage History Tab */}
            <TabsContent value="usage" className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Usage History</h4>
                <Badge variant="secondary">{assignments.length} uses</Badge>
              </div>
              {assignments.length === 0 ? (
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">No usage records</p>
                </Card>
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
                              <p className="font-medium">{assignment.booking.group_name || "Dive Trip"}</p>
                              <p className="text-muted-foreground">
                                Date: {format(new Date(assignment.booking.dive_date), "PP")}
                              </p>
                              {assignment.booking.dive_type && (
                                <p className="text-muted-foreground">Type: {assignment.booking.dive_type}</p>
                              )}
                              {assignment.booking.location && (
                                <p className="text-muted-foreground">Location: {assignment.booking.location}</p>
                              )}
                            </div>
                          )}
                          {assignment.event && (
                            <div className="text-sm space-y-1">
                              <p className="font-medium">{assignment.event.title}</p>
                              <p className="text-muted-foreground">
                                {format(new Date(assignment.event.start_time), "PP")}
                              </p>
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
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
