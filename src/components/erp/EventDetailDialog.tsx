import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, MapPin, Clock, Users, Package, Wand2, X, CheckCircle2, Link2, Copy, RotateCcw, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  type: "booking" | "maintenance" | "work-order" | "custom";
  priority: "low" | "medium" | "high";
  bookingId?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  type: "boat" | "equipment" | "tank";
  status: string;
  condition?: string;
  purchase_date?: string;
  last_used?: string;
  usage_count?: number;
}

interface EventDetailDialogProps {
  event: Event | null;
  diveCenterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export const EventDetailDialog = ({ event, diveCenterId, open, onOpenChange, onUpdated }: EventDetailDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [availableInventory, setAvailableInventory] = useState<InventoryItem[]>([]);
  const [assignedInventory, setAssignedInventory] = useState<InventoryItem[]>([]);
  const [autoAssignMethod, setAutoAssignMethod] = useState<"fifo" | "usage">("fifo");
  const [bookingStatus, setBookingStatus] = useState<string>("");
  const [equipmentRequests, setEquipmentRequests] = useState<any[]>([]);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    if (open && event) {
      fetchInventory();
      fetchAssignedInventory();
      fetchBookingStatus();
      fetchEquipmentRequests();
    }
  }, [open, event, diveCenterId]);

  const fetchBookingStatus = async () => {
    if (!event?.bookingId) return;
    
    try {
      const { data } = await supabase
        .from("dive_bookings")
        .select("status, dive_date, end_date, participants_count")
        .eq("id", event.bookingId)
        .single();
      
      if (data) {
        setBookingStatus(data.status);
        setBookingDetails(data);
      }
    } catch (error) {
      console.error("Failed to fetch booking status:", error);
    }
  };

  const fetchEquipmentRequests = async () => {
    if (!event?.bookingId) return;
    
    try {
      const { data } = await supabase
        .from("equipment_requests")
        .select("*")
        .eq("booking_id", event.bookingId)
        .order("created_at", { ascending: false });
      
      if (data) {
        setEquipmentRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch equipment requests:", error);
    }
  };

  const copyEquipmentRequestLink = () => {
    if (!event?.bookingId) return;
    
    const link = `${window.location.origin}/equipment-request/${event.bookingId}`;
    navigator.clipboard.writeText(link);
    toast.success("Equipment request link copied to clipboard!");
  };

  // Calculate equipment needs vs availability
  const calculateEquipmentSummary = () => {
    const needed: Record<string, number> = {
      BCD: 0,
      Fins: 0,
      Regulator: 0,
      Mask: 0,
      Wetsuit: 0
    };

    // Sum up all equipment requests
    equipmentRequests.forEach(req => {
      if (req.bcd_needed) needed.BCD++;
      if (req.fins_needed) needed.Fins++;
      if (req.regulator_needed) needed.Regulator++;
      if (req.mask_needed) needed.Mask++;
      if (req.wetsuit_needed) needed.Wetsuit++;
    });

    // Count available equipment by type
    const available: Record<string, number> = {
      BCD: 0,
      Fins: 0,
      Regulator: 0,
      Mask: 0,
      Wetsuit: 0
    };

    availableInventory.forEach(item => {
      if (item.type === "equipment") {
        const name = item.name.toLowerCase();
        if (name.includes("bcd")) available.BCD++;
        else if (name.includes("fin")) available.Fins++;
        else if (name.includes("regulator")) available.Regulator++;
        else if (name.includes("mask")) available.Mask++;
        else if (name.includes("wetsuit")) available.Wetsuit++;
      }
    });

    // Count assigned equipment
    const assigned: Record<string, number> = {
      BCD: 0,
      Fins: 0,
      Regulator: 0,
      Mask: 0,
      Wetsuit: 0
    };

    assignedInventory.forEach(item => {
      if (item.type === "equipment") {
        const name = item.name.toLowerCase();
        if (name.includes("bcd")) assigned.BCD++;
        else if (name.includes("fin")) assigned.Fins++;
        else if (name.includes("regulator")) assigned.Regulator++;
        else if (name.includes("mask")) assigned.Mask++;
        else if (name.includes("wetsuit")) assigned.Wetsuit++;
      }
    });

    return { needed, available, assigned };
  };

  const equipmentSummary = calculateEquipmentSummary();
  const hasInsufficientEquipment = Object.keys(equipmentSummary.needed).some(
    type => equipmentSummary.needed[type] > (equipmentSummary.available[type] + equipmentSummary.assigned[type])
  );

  const fetchInventory = async () => {
    try {
      // Fetch boats
      const { data: boats } = await supabase
        .from("boats")
        .select("*")
        .eq("dive_center_id", diveCenterId)
        .eq("status", "available");

      // Fetch equipment
      const { data: equipment } = await supabase
        .from("dive_equipment")
        .select("*")
        .eq("dive_center_id", diveCenterId)
        .eq("status", "available")
        .is("assigned_booking_id", null);

      // Fetch tanks
      const { data: tanks } = await supabase
        .from("dive_tanks")
        .select("*")
        .eq("dive_center_id", diveCenterId)
        .in("status", ["full", "filled"]);

      const allInventory: InventoryItem[] = [
        ...(boats || []).map(b => ({ 
          id: b.id, 
          name: b.name, 
          type: "boat" as const, 
          status: b.status,
          purchase_date: b.created_at 
        })),
        ...(equipment || []).map(e => ({ 
          id: e.id, 
          name: `${e.equipment_type} - ${e.size || 'N/A'}`, 
          type: "equipment" as const, 
          status: e.status,
          condition: e.status,
          purchase_date: e.purchase_date 
        })),
        ...(tanks || []).map(t => ({ 
          id: t.id, 
          name: `Tank ${t.tank_number} (${t.gas_type})`, 
          type: "tank" as const, 
          status: t.status,
          purchase_date: t.created_at 
        }))
      ];

      setAvailableInventory(allInventory);
    } catch (error: any) {
      toast.error("Failed to fetch inventory");
    }
  };

  const fetchAssignedInventory = async () => {
    if (!event?.bookingId) return;

    try {
      const { data: assignments } = await supabase
        .from("equipment_assignments")
        .select("*, equipment:dive_equipment(*), tank:dive_tanks(*)")
        .eq("booking_id", event.bookingId)
        .is("returned_date", null);

      const assigned: InventoryItem[] = [];
      assignments?.forEach(a => {
        if (a.equipment) {
          assigned.push({
            id: a.equipment.id,
            name: `${a.equipment.equipment_type} - ${a.equipment.size || 'N/A'}`,
            type: "equipment",
            status: a.equipment.status
          });
        }
        if (a.tank) {
          assigned.push({
            id: a.tank.id,
            name: `Tank ${a.tank.tank_number} (${a.tank.gas_type})`,
            type: "tank",
            status: a.tank.status
          });
        }
      });

      // Check if boat is assigned
      const { data: booking } = await supabase
        .from("dive_bookings")
        .select("boat:boats(*)")
        .eq("id", event.bookingId)
        .single();

      if (booking?.boat) {
        assigned.push({
          id: booking.boat.id,
          name: booking.boat.name,
          type: "boat",
          status: booking.boat.status
        });
      }

      setAssignedInventory(assigned);
    } catch (error: any) {
      console.error("Failed to fetch assigned inventory:", error);
    }
  };

  const handleAutoAssign = () => {
    if (availableInventory.length === 0) {
      toast.error("No available inventory to assign");
      return;
    }

    let sorted = [...availableInventory];

    if (autoAssignMethod === "fifo") {
      // Sort by purchase date (oldest first)
      sorted.sort((a, b) => {
        const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
        const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
        return dateA - dateB;
      });
      toast.success("Inventory sorted by FIFO (oldest first)");
    } else {
      // Sort by usage count (least used first)
      sorted.sort((a, b) => (a.usage_count || 0) - (b.usage_count || 0));
      toast.success("Inventory sorted by usage rate (least used first)");
    }

    setAvailableInventory(sorted);
  };

  const handleAssignItem = async (item: InventoryItem) => {
    if (!event?.bookingId) {
      toast.error("Cannot assign inventory to non-booking events");
      return;
    }

    setLoading(true);
    try {
      if (item.type === "boat") {
        await supabase
          .from("dive_bookings")
          .update({ boat_id: item.id })
          .eq("id", event.bookingId);
      } else {
        await supabase
          .from("equipment_assignments")
          .insert({
            booking_id: event.bookingId,
            [item.type === "equipment" ? "equipment_id" : "tank_id"]: item.id,
            assigned_date: new Date().toISOString()
          });
      }

      toast.success(`${item.name} assigned successfully`);
      fetchInventory();
      fetchAssignedInventory();
      onUpdated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignItem = async (item: InventoryItem) => {
    if (!event?.bookingId) return;

    setLoading(true);
    try {
      if (item.type === "boat") {
        await supabase
          .from("dive_bookings")
          .update({ boat_id: null })
          .eq("id", event.bookingId);
      } else {
        await supabase
          .from("equipment_assignments")
          .update({ returned_date: new Date().toISOString() })
          .eq("booking_id", event.bookingId)
          .eq(item.type === "equipment" ? "equipment_id" : "tank_id", item.id);
      }

      toast.success(`${item.name} unassigned`);
      fetchInventory();
      fetchAssignedInventory();
      onUpdated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to unassign inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFinished = async () => {
    if (!event?.bookingId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("dive_bookings")
        .update({ status: "completed" })
        .eq("id", event.bookingId);

      if (error) throw error;

      toast.success("Dive marked as finished!");
      setBookingStatus("completed");
      onUpdated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark dive as finished");
    } finally {
      setLoading(false);
    }
  };

  const handleRevertCompletion = async () => {
    if (!event?.bookingId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("dive_bookings")
        .update({ status: "confirmed" })
        .eq("id", event.bookingId);

      if (error) throw error;

      toast.success("Completion reverted - booking is now confirmed");
      setBookingStatus("confirmed");
      onUpdated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to revert completion");
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking": return "bg-primary/20 text-primary border-primary/30";
      case "maintenance": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "work-order": return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "custom": return "bg-purple-500/20 text-purple-500 border-purple-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-500 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-500 border-green-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            Event Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{event.title}</h3>
              {event.description && (
                <p className="text-muted-foreground mt-1">{event.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getTypeColor(event.type)}>
                {event.type}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(event.priority)}>
                {event.priority} priority
              </Badge>
              {bookingStatus === "completed" && (
                <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(event.date, "PPP")}</span>
              </div>
              {bookingDetails?.end_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {differenceInDays(new Date(bookingDetails.end_date), new Date(bookingDetails.dive_date)) + 1} days
                  </span>
                  <span className="text-muted-foreground text-xs">
                    (until {format(new Date(bookingDetails.end_date), "MMM d")})
                  </span>
                </div>
              )}
              {event.time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{event.time}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}
              {bookingDetails?.participants_count && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{bookingDetails.participants_count} participants</span>
                </div>
              )}
            </div>
          </div>

          {/* Equipment Request Link */}
          {event.type === "booking" && event.bookingId && (
            <div className="border-t pt-4">
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-primary" />
                      <h5 className="font-semibold text-sm">Equipment Request Link</h5>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Share this link with clients so they can submit their equipment needs
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={copyEquipmentRequestLink}
                      className="gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* All Requested Inventory */}
          {event.type === "booking" && event.bookingId && equipmentRequests.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-primary" />
                <h5 className="font-semibold text-sm">All Requested Inventory</h5>
              </div>
              <Card className="p-4">
                <div className="space-y-2">
                  {equipmentRequests.flatMap((req) => {
                    const items = [];
                    if (req.bcd_needed) {
                      items.push({
                        type: 'BCD',
                        size: req.bcd_size,
                        customer: req.customer_name,
                        status: req.status
                      });
                    }
                    if (req.fins_needed) {
                      items.push({
                        type: 'Fins',
                        size: req.fins_size,
                        customer: req.customer_name,
                        status: req.status
                      });
                    }
                    if (req.regulator_needed) {
                      items.push({
                        type: 'Regulator',
                        size: null,
                        customer: req.customer_name,
                        status: req.status
                      });
                    }
                    if (req.mask_needed) {
                      items.push({
                        type: 'Mask',
                        size: null,
                        customer: req.customer_name,
                        status: req.status
                      });
                    }
                    if (req.wetsuit_needed) {
                      items.push({
                        type: 'Wetsuit',
                        size: req.wetsuit_size,
                        customer: req.customer_name,
                        status: req.status
                      });
                    }
                    return items;
                  }).map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="min-w-[90px] justify-center">
                          {item.type}
                        </Badge>
                        {item.size && (
                          <Badge variant="secondary" className="min-w-[60px] justify-center">
                            {item.size}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">for {item.customer}</span>
                      </div>
                      <Badge variant={item.status === "pending" ? "secondary" : "default"}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                  {equipmentRequests.every(req => 
                    !req.bcd_needed && !req.fins_needed && !req.regulator_needed && !req.mask_needed && !req.wetsuit_needed
                  ) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No equipment requested
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Mark as Finished / Revert Button */}
          {event.type === "booking" && event.bookingId && (
            <div className="border-t pt-4">
              {bookingStatus === "completed" ? (
                <Button 
                  onClick={handleRevertCompletion} 
                  disabled={loading}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4" />
                  Revert Completion
                </Button>
              ) : (
                <Button 
                  onClick={handleMarkAsFinished} 
                  disabled={loading}
                  className="w-full gap-2"
                  variant="default"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Dive as Finished
                </Button>
              )}
            </div>
          )}

          {/* Inventory Assignment */}
          {event.type === "booking" && event.bookingId && (
            <>
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Inventory Assignment</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Auto-assign method:</Label>
                    <Select value={autoAssignMethod} onValueChange={(v: any) => setAutoAssignMethod(v)}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fifo">FIFO (Oldest)</SelectItem>
                        <SelectItem value="usage">Usage Rate</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={handleAutoAssign}>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Auto Sort
                    </Button>
                  </div>
                </div>

                {/* Equipment Summary */}
                {equipmentRequests.length > 0 && (
                  <div className="mb-4">
                    {hasInsufficientEquipment && (
                      <Alert className="mb-3 border-destructive/50 bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <AlertDescription className="text-sm">
                          <strong>Insufficient Equipment:</strong> Some requested equipment is not available in sufficient quantities.
                        </AlertDescription>
                      </Alert>
                    )}
                    <Card className="p-4 bg-muted/30">
                      <h5 className="text-sm font-semibold mb-3">Equipment Status</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(equipmentSummary.needed).map(([type, needed]) => {
                          const available = equipmentSummary.available[type];
                          const assigned = equipmentSummary.assigned[type];
                          const total = available + assigned;
                          const sufficient = needed <= total;
                          
                          if (needed === 0) return null;
                          
                          return (
                            <div key={type} className={`p-2 rounded-lg border ${!sufficient ? 'bg-destructive/10 border-destructive/30' : 'bg-card'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">{type}</span>
                                {!sufficient && <AlertTriangle className="w-3 h-3 text-destructive" />}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <div>Needed: <strong>{needed}</strong></div>
                                <div>Assigned: <strong>{assigned}</strong></div>
                                <div>Available: <strong>{available}</strong></div>
                                <div className={!sufficient ? 'text-destructive font-semibold' : 'text-success'}>
                                  {sufficient ? '✓ Sufficient' : `✗ Short by ${needed - total}`}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Assigned Inventory */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium mb-2">Currently Assigned ({assignedInventory.length})</h5>
                  {assignedInventory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No inventory assigned yet</p>
                  ) : (
                    <div className="space-y-2">
                      {assignedInventory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">{item.type}</Badge>
                            <span className="text-sm">{item.name}</span>
                            <Badge variant="outline">{item.status}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnassignItem(item)}
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Inventory */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Available Inventory ({availableInventory.length})</h5>
                  {availableInventory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No inventory available</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableInventory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">{item.type}</Badge>
                            <span className="text-sm">{item.name}</span>
                            {item.condition && <Badge variant="outline">{item.condition}</Badge>}
                            {item.purchase_date && (
                              <span className="text-xs text-muted-foreground">
                                Added: {format(new Date(item.purchase_date), "PP")}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignItem(item)}
                            disabled={loading}
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};