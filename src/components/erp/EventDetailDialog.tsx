import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Link as LinkIcon, Package, Ship, Cylinder, Save, Trash2, Calendar, Edit, MapPin, ChevronRight } from "lucide-react";
import { InventoryAssignment } from "./InventoryAssignment";
import { ParticipantDetailDialog } from "./ParticipantDetailDialog";
import type { Event as EventManagerEvent } from "@/components/ui/event-manager";

interface EquipmentRequest {
  id: string;
  equipment_type: string | null;
  size: string | null;
  notes: string | null;
}

interface Participant {
  id: string;
  participant_name: string;
  email: string;
  phone_number: string;
  ic_passport_number?: string;
  dive_cert_number?: string;
  dive_cert_level?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string;
  created_at: string;
  equipment_requests?: EquipmentRequest[];
}

interface BookingData {
  id: string;
  group_name: string | null;
  dive_date: string;
  end_date: string | null;
  dive_type: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  participants_count: number;
}

interface CustomEventData {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  color: string | null;
  dive_type: string | null;
  completed: boolean | null;
}

interface EventDetailDialogProps {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, data: Partial<EventManagerEvent>) => void;
  onDelete?: (id: string) => void;
}

export const EventDetailDialog = ({ eventId, open, onOpenChange, onUpdate, onDelete }: EventDetailDialogProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLink, setFormLink] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [customEventData, setCustomEventData] = useState<CustomEventData | null>(null);
  const [relatedBookings, setRelatedBookings] = useState<BookingData[]>([]);

  const getEventType = () => {
    if (!eventId) return null;
    if (eventId.startsWith('booking-')) return 'booking';
    if (eventId.startsWith('custom-')) return 'custom';
    if (eventId.startsWith('maintenance-')) return 'maintenance';
    return null;
  };

  const getDbId = () => {
    if (!eventId) return null;
    return eventId.replace(/^(custom|booking|maintenance)-/, '');
  };

  const eventType = getEventType();
  const dbId = getDbId();

  useEffect(() => {
    if (open && eventId) {
      setIsEditing(false);
      fetchEventData();
      fetchParticipants();
      generateFormLink();
    }
  }, [open, eventId]);

  const fetchEventData = async () => {
    if (!dbId || !eventType) return;
    
    try {
      if (eventType === 'custom') {
        const { data, error } = await supabase
          .from("custom_events")
          .select("*")
          .eq("id", dbId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setCustomEventData(data);
          setBookingData(null);
        }
      } else if (eventType === 'booking') {
        const { data, error } = await supabase
          .from("dive_bookings")
          .select("id, dive_date, end_date, group_name, dive_type, location, status, notes, participants_count")
          .eq("id", dbId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setBookingData(data);
          setCustomEventData(null);
          
          if (data.group_name) {
            const { data: related } = await supabase
              .from("dive_bookings")
              .select("id, dive_date, end_date, group_name, dive_type, location, status, notes, participants_count")
              .eq("group_name", data.group_name)
              .neq("id", dbId)
              .order("dive_date", { ascending: true });
            
            setRelatedBookings(related || []);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Failed to load event details");
    }
  };

  const fetchParticipants = async () => {
    if (!dbId) return;
    
    setLoading(true);
    try {
      // Fetch participants for both custom events and bookings
      const { data, error } = await supabase
        .from("dive_trip_participants")
        .select("*")
        .eq("event_id", dbId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch equipment requests for each participant
      const participantsWithEquipment = await Promise.all(
        (data || []).map(async (participant) => {
          const { data: equipment } = await supabase
            .from("equipment_rental_requests")
            .select("id, equipment_type, size, notes")
            .eq("participant_id", participant.id);
          
          return {
            ...participant,
            equipment_requests: equipment || []
          };
        })
      );
      
      setParticipants(participantsWithEquipment);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateFormLink = () => {
    if (!dbId) return;
    const link = `${window.location.origin}/dive-trip-form/${dbId}`;
    setFormLink(link);
  };

  const copyFormLink = () => {
    navigator.clipboard.writeText(formLink);
    toast.success("Form link copied!");
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Please fill out the dive trip registration form: ${formLink}`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleSaveCustomEvent = async () => {
    if (!customEventData || !eventId) return;
    
    try {
      const payload: Partial<EventManagerEvent> = {
        title: customEventData.title,
        description: customEventData.description || undefined,
        startTime: new Date(customEventData.start_time),
        endTime: new Date(customEventData.end_time),
        color: customEventData.color as any,
        completed: customEventData.completed || false,
        diveType: customEventData.dive_type || undefined,
      };

      onUpdate?.(eventId, payload);
      toast.success("Event updated");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  };

  const handleSaveBooking = async () => {
    if (!bookingData || !dbId) return;
    
    try {
      const { error } = await supabase
        .from("dive_bookings")
        .update({
          group_name: bookingData.group_name,
          dive_date: bookingData.dive_date,
          end_date: bookingData.end_date,
          dive_type: bookingData.dive_type,
          location: bookingData.location,
          notes: bookingData.notes,
        })
        .eq("id", dbId);

      if (error) throw error;
      
      toast.success("Booking updated");
      setIsEditing(false);
      
      if (onUpdate && eventId) {
        onUpdate(eventId, {
          title: bookingData.group_name || "Booking",
          startTime: new Date(bookingData.dive_date),
          endTime: bookingData.end_date ? new Date(bookingData.end_date) : undefined,
        });
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    if (!confirm("Are you sure you want to delete this event?")) return;

    if (eventType === 'custom') {
      onDelete?.(eventId);
      onOpenChange(false);
    } else {
      toast.error("Bookings cannot be deleted from here");
    }
  };

  const getTitle = () => {
    if (eventType === 'custom' && customEventData) return customEventData.title;
    if (eventType === 'booking' && bookingData) return bookingData.group_name || "Dive Trip";
    return "Event Details";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTitle()}
            <Badge variant={eventType === 'booking' ? 'default' : 'secondary'}>
              {eventType === 'booking' ? 'Dive Trip' : 'Custom Event'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Manage event details, participants, and equipment assignments
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {eventType === 'custom' && customEventData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Event Information</h3>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                          <Edit className="w-4 h-4 mr-2" />
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
                        <Button size="sm" onClick={handleSaveCustomEvent}>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Title</Label>
                      <Input
                        value={customEventData.title}
                        onChange={(e) => setCustomEventData({ ...customEventData, title: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={customEventData.description || ""}
                        onChange={(e) => setCustomEventData({ ...customEventData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={customEventData.start_time ? new Date(customEventData.start_time).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setCustomEventData({ ...customEventData, start_time: new Date(e.target.value).toISOString() })}
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="datetime-local"
                        value={customEventData.end_time ? new Date(customEventData.end_time).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setCustomEventData({ ...customEventData, end_time: new Date(e.target.value).toISOString() })}
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <Select 
                        value={customEventData.color || "blue"} 
                        onValueChange={(value) => setCustomEventData({ ...customEventData, color: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">🔵 Blue</SelectItem>
                          <SelectItem value="red">🔴 Red</SelectItem>
                          <SelectItem value="green">🟢 Green</SelectItem>
                          <SelectItem value="yellow">🟡 Yellow</SelectItem>
                          <SelectItem value="purple">🟣 Purple</SelectItem>
                          <SelectItem value="orange">🟠 Orange</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Dive Type</Label>
                      <Select 
                        value={customEventData.dive_type || ""} 
                        onValueChange={(value) => setCustomEventData({ ...customEventData, dive_type: value })}
                      >
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
                  </div>
                ) : (
                  <div className="space-y-2 text-sm border rounded-lg p-4 bg-muted/10">
                    <div><span className="font-medium">Description:</span> {customEventData.description || "No description"}</div>
                    <div><span className="font-medium">Type:</span> {customEventData.dive_type || "Not specified"}</div>
                    <div><span className="font-medium">Start:</span> {new Date(customEventData.start_time).toLocaleString()}</div>
                    <div><span className="font-medium">End:</span> {new Date(customEventData.end_time).toLocaleString()}</div>
                    <div><span className="font-medium">Status:</span> {customEventData.completed ? "Completed" : "Pending"}</div>
                  </div>
                )}
              </div>
            )}

            {eventType === 'booking' && bookingData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Dive Trip Information</h3>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveBooking}>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Group/Trip Name</Label>
                      <Input
                        value={bookingData.group_name || ""}
                        onChange={(e) => setBookingData({ ...bookingData, group_name: e.target.value })}
                        placeholder="e.g., Weekend Dive Trip"
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={bookingData.dive_date ? new Date(bookingData.dive_date).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setBookingData({ ...bookingData, dive_date: new Date(e.target.value).toISOString() })}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="datetime-local"
                        value={bookingData.end_date ? new Date(bookingData.end_date).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setBookingData({ ...bookingData, end_date: new Date(e.target.value).toISOString() })}
                      />
                    </div>
                    <div>
                      <Label>Dive Type</Label>
                      <Select 
                        value={bookingData.dive_type || ""} 
                        onValueChange={(value) => setBookingData({ ...bookingData, dive_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shore">Shore Dive</SelectItem>
                          <SelectItem value="boat">Boat Dive</SelectItem>
                          <SelectItem value="night">Night Dive</SelectItem>
                          <SelectItem value="wreck">Wreck Dive</SelectItem>
                          <SelectItem value="deep">Deep Dive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={bookingData.location || ""}
                        onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                        placeholder="Dive site location"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={bookingData.notes || ""}
                        onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm border rounded-lg p-4 bg-muted/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Date:</span> 
                      {new Date(bookingData.dive_date).toLocaleDateString()}
                      {bookingData.end_date && ` - ${new Date(bookingData.end_date).toLocaleDateString()}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">Location:</span> {bookingData.location || "Not specified"}
                    </div>
                    <div><span className="font-medium">Type:</span> {bookingData.dive_type || "Not specified"}</div>
                    <div><span className="font-medium">Participants:</span> {bookingData.participants_count}</div>
                    <div><span className="font-medium">Status:</span> <Badge variant="outline">{bookingData.status}</Badge></div>
                    {bookingData.notes && <div><span className="font-medium">Notes:</span> {bookingData.notes}</div>}
                  </div>
                )}

                {relatedBookings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Related Trip Days ({bookingData.group_name})</h4>
                    <div className="space-y-2">
                      {relatedBookings.map((related) => (
                        <div key={related.id} className="p-3 border rounded-lg bg-muted/5 text-sm">
                          <div className="flex justify-between items-center">
                            <span>{new Date(related.dive_date).toLocaleDateString()}</span>
                            <Badge variant="outline">{related.status}</Badge>
                          </div>
                          {related.location && <div className="text-muted-foreground">{related.location}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="participants" className="space-y-4">
            {/* Form Link - Available for both custom events and bookings */}
            <div className="p-4 border rounded-lg bg-accent/10 space-y-3">
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
                Share this link with participants to register for the dive trip and request equipment.
              </p>
              <code className="block p-2 bg-muted rounded text-xs break-all">
                {formLink}
              </code>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Registered Participants ({participants.length})
              </h3>
              
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : participants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  No participants registered yet
                  <p className="text-xs mt-2">Share the registration link above to collect participants</p>
                </div>
              ) : (
              <div className="space-y-3">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id} 
                      className="p-4 border rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedParticipant(participant);
                        setParticipantDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">{participant.participant_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {participant.email} • {participant.phone_number}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.dive_cert_level && (
                            <Badge variant="secondary">{participant.dive_cert_level}</Badge>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      
                      {/* Equipment Requests */}
                      {participant.equipment_requests && participant.equipment_requests.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-medium text-muted-foreground mb-2">Equipment Requested:</div>
                          <div className="flex flex-wrap gap-2">
                            {participant.equipment_requests.map((eq) => (
                              <Badge key={eq.id} variant="outline" className="text-xs">
                                {eq.equipment_type}{eq.size ? ` (${eq.size})` : ''}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6">
            {dbId ? (
              <>
                {/* Equipment Requests Summary */}
                {participants.some(p => p.equipment_requests && p.equipment_requests.length > 0) && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Equipment Requested by Participants
                    </h3>
                    <div className="space-y-2">
                      {participants.filter(p => p.equipment_requests && p.equipment_requests.length > 0).map((participant) => (
                        <div key={participant.id} className="flex items-start gap-3 text-sm">
                          <span className="font-medium min-w-[120px]">{participant.participant_name}:</span>
                          <div className="flex flex-wrap gap-1">
                            {participant.equipment_requests?.map((eq) => (
                              <Badge key={eq.id} variant="secondary" className="text-xs">
                                {eq.equipment_type}{eq.size ? ` (${eq.size})` : ''}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Cylinder className="w-4 h-4" />
                    Tank Assignments
                  </h3>
                  <InventoryAssignment
                    eventId={dbId}
                    inventoryType="tank"
                    participants={participants}
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Ship className="w-4 h-4" />
                    Boat Assignments
                  </h3>
                  <InventoryAssignment
                    eventId={dbId}
                    inventoryType="boat"
                    participants={participants}
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Equipment Assignments
                  </h3>
                  <InventoryAssignment
                    eventId={dbId}
                    inventoryType="equipment"
                    participants={participants}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Unable to load equipment assignments
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ParticipantDetailDialog
          participant={selectedParticipant}
          open={participantDialogOpen}
          onOpenChange={setParticipantDialogOpen}
        />
      </DialogContent>
    </Dialog>
  );
};
