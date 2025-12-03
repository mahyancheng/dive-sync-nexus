import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, IdCard, Award, AlertCircle, Package } from "lucide-react";

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

interface ParticipantDetailDialogProps {
  participant: Participant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ParticipantDetailDialog = ({ participant, open, onOpenChange }: ParticipantDetailDialogProps) => {
  if (!participant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {participant.participant_name}
          </DialogTitle>
          <DialogDescription>
            Registered on {new Date(participant.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Contact Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{participant.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{participant.phone_number}</span>
              </div>
            </div>
            {participant.ic_passport_number && (
              <div className="flex items-center gap-2 text-sm">
                <IdCard className="w-4 h-4 text-muted-foreground" />
                <span>IC/Passport: {participant.ic_passport_number}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Certification Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Award className="w-4 h-4" />
              Dive Certification
            </h4>
            <div className="text-sm space-y-1">
              {participant.dive_cert_level ? (
                <>
                  <div>Level: <Badge variant="secondary">{participant.dive_cert_level}</Badge></div>
                  {participant.dive_cert_number && (
                    <div className="text-muted-foreground">Cert #: {participant.dive_cert_number}</div>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">No certification info provided</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Emergency Contact */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Emergency Contact
            </h4>
            <div className="text-sm">
              {participant.emergency_contact_name ? (
                <div className="space-y-1">
                  <div>{participant.emergency_contact_name}</div>
                  {participant.emergency_contact_phone && (
                    <div className="text-muted-foreground">{participant.emergency_contact_phone}</div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">No emergency contact provided</span>
              )}
            </div>
          </div>

          {/* Medical Conditions */}
          {participant.medical_conditions && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Medical Conditions</h4>
                <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-lg">
                  {participant.medical_conditions}
                </p>
              </div>
            </>
          )}

          {/* Equipment Requests */}
          {participant.equipment_requests && participant.equipment_requests.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Equipment Rental Requests
                </h4>
                <div className="space-y-2">
                  {participant.equipment_requests.map((eq) => (
                    <div key={eq.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                      <span>{eq.equipment_type}</span>
                      {eq.size && <Badge variant="outline">{eq.size}</Badge>}
                    </div>
                  ))}
                  {participant.equipment_requests.some(eq => eq.notes) && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Notes: {participant.equipment_requests.find(eq => eq.notes)?.notes}
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
