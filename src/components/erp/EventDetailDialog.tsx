import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Link as LinkIcon, Package, Ship, Cylinder, Save, Trash2 } from "lucide-react";
import { InventoryAssignment } from "./InventoryAssignment";

interface Participant {
  id: string;
  participant_name: string;
  email: string;
  phone_number: string;
  dive_cert_level?: string;
  created_at: string;
}

interface EventData {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  color?: string;
  dive_type?: string;
  completed?: boolean;
}

interface EventDetailDialogProps {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, data: Partial<EventData>) => void;
  onDelete?: (id: string) => void;
}

export const EventDetailDialog = ({ eventId, open, onOpenChange, onUpdate, onDelete }: EventDetailDialogProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLink, setFormLink] = useState("");
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open && eventId) {
      fetchEventData();
      fetchParticipants();
      generateFormLink();
    }
  }, [open, eventId]);

  const fetchEventData = async () => {
    if (!eventId) return;
    
    try {
      // Determine event type from the ID prefix safely
      const prefix = eventId.startsWith('custom-') ? 'custom' : eventId.startsWith('booking-') ? 'booking' : eventId.startsWith('maintenance-') ? 'maintenance' : 'unknown';
      const dbId = eventId.replace(/^(custom|booking|maintenance)-/, '');
      
      if (prefix === 'custom') {
        const { data, error } = await supabase
          .from("custom_events")
          .select("*")
          .eq("id", dbId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setEventData(data);
        } else {
          toast.error("Event not found");
        }
      } else if (prefix === 'booking') {
        // For bookings, we can still show participant and inventory management
        // but can't edit the booking details themselves
        setEventData({
          id: dbId,
          title: "Booking Event",
          description: "Booking event - view participants and inventory",
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
        } as EventData);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Failed to load event details");
    }
  };

  const fetchParticipants = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      // Use the actual database ID (without prefix)
      const dbId = eventId.replace(/^(custom|booking|maintenance)-/, '');
      
      const { data, error } = await supabase
        .from("dive_trip_participants")
        .select("*")
        .eq("event_id", dbId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  const generateFormLink = () => {
    if (!eventId) return;
    // Use the actual database ID (without prefix)
    const dbId = eventId.replace(/^(custom|booking|maintenance)-/, '');
    const link = `${window.location.origin}/dive-trip-form/${dbId}`;
    setFormLink(link);
  };

  const copyFormLink = () => {
    navigator.clipboard.writeText(formLink);
    toast.success("Form link copied to clipboard!");
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Please fill out the dive trip registration form: ${formLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleSave = async () => {
    if (!eventData || !eventId) return;
    
    try {
      // Use the actual database ID (without prefix)
      const dbId = eventId.replace(/^(custom|booking|maintenance)-/, '');
      
      if (!eventId.startsWith('custom-')) {
        toast.error("Can only edit custom events");
        return;
      }
      
      const { error } = await supabase
        .from("custom_events")
        .update({
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          color: eventData.color,
          dive_type: eventData.dive_type,
          completed: eventData.completed,
        })
        .eq("id", dbId);

      if (error) throw error;
      
      toast.success("Event updated");
      onUpdate?.(eventId, eventData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      // Use the actual database ID (without prefix)
      const dbId = eventId.replace(/^(custom|booking|maintenance)-/, '');
      
      if (!eventId.startsWith('custom-')) {
        toast.error("Can only delete custom events");
        return;
      }
      
      const { error } = await supabase
        .from("custom_events")
        .delete()
        .eq("id", dbId);

      if (error) throw error;
      
      toast.success("Event deleted");
      onDelete?.(eventId);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{eventData?.title || "Event Details"}</DialogTitle>
          <DialogDescription>
            View and manage event participants, inventory, and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Edit Section - Always Visible */}
          {eventData && (
            <div className="p-4 border rounded-lg space-y-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Event Information</h3>
                {eventId?.startsWith('custom-') && (
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleDelete}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Title</Label>
                    <Input
                      value={eventData.title}
                      onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={eventData.description || ""}
                      onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={eventData.start_time ? new Date(eventData.start_time).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEventData({ ...eventData, start_time: new Date(e.target.value).toISOString() })}
                    />
                  </div>

                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={eventData.end_time ? new Date(eventData.end_time).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEventData({ ...eventData, end_time: new Date(e.target.value).toISOString() })}
                    />
                  </div>

                  <div>
                    <Label>Color</Label>
                    <Select value={eventData.color || "blue"} onValueChange={(value) => setEventData({ ...eventData, color: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Dive Type</Label>
                    <Select value={eventData.dive_type || ""} onValueChange={(value) => setEventData({ ...eventData, dive_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shore Dive">Shore Dive</SelectItem>
                        <SelectItem value="Boat Dive">Boat Dive</SelectItem>
                        <SelectItem value="Night Dive">Night Dive</SelectItem>
                        <SelectItem value="Wreck Dive">Wreck Dive</SelectItem>
                        <SelectItem value="Deep Dive">Deep Dive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Button
                      variant={eventData.completed ? "outline" : "default"}
                      onClick={() => setEventData({ ...eventData, completed: !eventData.completed })}
                      className="w-full"
                    >
                      {eventData.completed ? "Mark as Incomplete" : "Mark as Complete"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Description:</span> {eventData.description || "No description"}</div>
                  <div><span className="font-medium">Type:</span> {eventData.dive_type || "Not specified"}</div>
                  <div><span className="font-medium">Status:</span> {eventData.completed ? "Completed" : "Pending"}</div>
                </div>
              )}
            </div>
          )}

          {/* Form Link Section */}
          <div className="p-4 border rounded-lg bg-accent/20 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Registration Form Link
              </h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyFormLink}>
                  Copy Link
                </Button>
                <Button size="sm" onClick={shareViaWhatsApp}>
                  Share via WhatsApp
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with participants to register for the dive trip. Each participant must fill their own form.
            </p>
            <code className="block p-2 bg-muted rounded text-xs break-all">
              {formLink}
            </code>
          </div>

          {/* Participants List */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Registered Participants ({participants.length})
            </h3>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : participants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No participants registered yet
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-3 border rounded-lg hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{participant.participant_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {participant.email} • {participant.phone_number}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {participant.dive_cert_level && (
                          <Badge variant="secondary">{participant.dive_cert_level}</Badge>
                        )}
                        <Badge variant="outline">Registered</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tanks Assignment */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Cylinder className="w-4 h-4" />
              Tank Assignments
            </h3>
            {eventId && (
              <InventoryAssignment
                eventId={eventId.replace(/^(custom|booking|maintenance)-/, '')}
                inventoryType="tank"
                participants={participants}
              />
            )}
          </div>

          {/* Boats Assignment */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Ship className="w-4 h-4" />
              Boat Assignments
            </h3>
            {eventId && (
              <InventoryAssignment
                eventId={eventId.replace(/^(custom|booking|maintenance)-/, '')}
                inventoryType="boat"
                participants={participants}
              />
            )}
          </div>

          {/* Equipment Assignment */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" />
              Equipment Assignments
            </h3>
            {eventId && (
              <InventoryAssignment
                eventId={eventId.replace(/^(custom|booking|maintenance)-/, '')}
                inventoryType="equipment"
                participants={participants}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
