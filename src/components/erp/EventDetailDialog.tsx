import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Link as LinkIcon, Package, Ship, Cylinder } from "lucide-react";
import { InventoryAssignment } from "./InventoryAssignment";

interface Participant {
  id: string;
  participant_name: string;
  email: string;
  phone_number: string;
  dive_cert_level?: string;
  created_at: string;
}

interface EventDetailDialogProps {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EventDetailDialog = ({ eventId, open, onOpenChange }: EventDetailDialogProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLink, setFormLink] = useState("");

  useEffect(() => {
    if (open && eventId) {
      fetchParticipants();
      generateFormLink();
    }
  }, [open, eventId]);

  const fetchParticipants = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dive_trip_participants")
        .select("*")
        .eq("event_id", eventId)
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
    const link = `${window.location.origin}/dive-trip-form/${eventId}`;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
          <DialogDescription>
            View participants, manage inventory assignments, and share registration form
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                eventId={eventId}
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
                eventId={eventId}
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
                eventId={eventId}
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
