import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";

const generalInfoSchema = z.object({
  participant_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone_number: z.string().trim().min(8, "Phone number required").max(20),
  ic_passport_number: z.string().trim().min(1, "IC/Passport required").max(50),
  dive_cert_number: z.string().trim().max(50).optional(),
  dive_cert_level: z.string().trim().max(50).optional(),
  emergency_contact_name: z.string().trim().max(100).optional(),
  emergency_contact_phone: z.string().trim().max(20).optional(),
  medical_conditions: z.string().trim().max(500).optional(),
});

type EquipmentRequest = {
  equipment_type: string;
  needed: boolean;
  size?: string;
};

export const DiveTripForm = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [availableEquipmentTypes, setAvailableEquipmentTypes] = useState<string[]>([]);
  const [equipmentRequests, setEquipmentRequests] = useState<EquipmentRequest[]>([]);
  
  const [formData, setFormData] = useState({
    participant_name: "",
    email: "",
    phone_number: "",
    ic_passport_number: "",
    dive_cert_number: "",
    dive_cert_level: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    equipment_notes: "",
  });

  // Standard equipment types for rental
  const standardEquipmentTypes = ["BCD", "Regulator", "Wetsuit", "Fins", "Mask", "Dive Computer", "Torch/Light", "SMB"];

  useEffect(() => {
    // Initialize with standard equipment types
    setAvailableEquipmentTypes(standardEquipmentTypes);
    setEquipmentRequests(standardEquipmentTypes.map(type => ({ equipment_type: type, needed: false, size: "" })));
  }, []);

  const equipmentNeedsSize = (type: string) => {
    const sizableTypes = ["BCD", "Fins", "Wetsuit"];
    return sizableTypes.some(t => type.toLowerCase().includes(t.toLowerCase()));
  };

  const handleEquipmentChange = (index: number, field: "needed" | "size", value: any) => {
    setEquipmentRequests(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStep1Next = () => {
    try {
      const validated = generalInfoSchema.parse({
        participant_name: formData.participant_name,
        email: formData.email,
        phone_number: formData.phone_number,
        ic_passport_number: formData.ic_passport_number,
        dive_cert_number: formData.dive_cert_number || undefined,
        dive_cert_level: formData.dive_cert_level || undefined,
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
        medical_conditions: formData.medical_conditions || undefined,
      });
      setStep(2);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    if (!eventId) {
      toast.error("Invalid event");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Signature required");
      return;
    }

    const signatureData = canvas.toDataURL();
    if (!signatureData || signatureData === "data:,") {
      toast.error("Please sign the waiver");
      return;
    }

    setLoading(true);
    try {
      // Create participant record
      const { data: participant, error: participantError } = await supabase
        .from("dive_trip_participants")
        .insert({
          event_id: eventId,
          participant_name: formData.participant_name,
          email: formData.email,
          phone_number: formData.phone_number,
          ic_passport_number: formData.ic_passport_number,
          dive_cert_number: formData.dive_cert_number || null,
          dive_cert_level: formData.dive_cert_level || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          medical_conditions: formData.medical_conditions || null,
        })
        .select()
        .single();

      if (participantError) throw participantError;

      // Create equipment rental requests for each needed equipment
      const equipmentInserts = equipmentRequests
        .filter(req => req.needed)
        .map(req => ({
          participant_id: participant.id,
          equipment_type: req.equipment_type,
          size: req.size || null,
          notes: formData.equipment_notes || null,
        }));

      if (equipmentInserts.length > 0) {
        await supabase.from("equipment_rental_requests").insert(equipmentInserts);
      }

      // Create waiver signature
      await supabase.from("waiver_signatures").insert({
        participant_id: participant.id,
        signature_data: signatureData,
        waiver_type: "PADI",
      });

      toast.success("Registration completed successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Dive Trip Registration</CardTitle>
            <CardDescription>
              Step {step} of 2: {step === 1 ? "General Information & Equipment" : "Waiver & Signature"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                {/* General Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">General Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.participant_name}
                      onChange={(e) => handleInputChange("participant_name", e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        maxLength={255}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange("phone_number", e.target.value)}
                        maxLength={20}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ic">IC / Passport Number *</Label>
                    <Input
                      id="ic"
                      value={formData.ic_passport_number}
                      onChange={(e) => handleInputChange("ic_passport_number", e.target.value)}
                      maxLength={50}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="certNumber">Dive Certification Number</Label>
                      <Input
                        id="certNumber"
                        value={formData.dive_cert_number}
                        onChange={(e) => handleInputChange("dive_cert_number", e.target.value)}
                        maxLength={50}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certLevel">Certification Level</Label>
                      <Input
                        id="certLevel"
                        value={formData.dive_cert_level}
                        onChange={(e) => handleInputChange("dive_cert_level", e.target.value)}
                        placeholder="e.g., Open Water, Advanced"
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                      <Input
                        id="emergencyName"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                      <Input
                        id="emergencyPhone"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical">Medical Conditions / Allergies</Label>
                    <Textarea
                      id="medical"
                      value={formData.medical_conditions}
                      onChange={(e) => handleInputChange("medical_conditions", e.target.value)}
                      placeholder="Please list any medical conditions or allergies we should be aware of"
                      maxLength={500}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Equipment Rental */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Equipment Rental</h3>
                  
                  {availableEquipmentTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading available equipment...</p>
                  ) : (
                    <div className="space-y-3">
                      {equipmentRequests.map((request, index) => (
                        <div key={request.equipment_type} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`equipment-${index}`}
                              checked={request.needed}
                              onCheckedChange={(checked) => handleEquipmentChange(index, "needed", checked)}
                            />
                            <Label htmlFor={`equipment-${index}`}>{request.equipment_type}</Label>
                          </div>
                          {request.needed && equipmentNeedsSize(request.equipment_type) && (
                            <Input
                              placeholder={`Size (${request.equipment_type.includes("Fins") ? "e.g., 8, 9, 10" : "S/M/L/XL"})`}
                              value={request.size}
                              onChange={(e) => handleEquipmentChange(index, "size", e.target.value)}
                              maxLength={10}
                              className="ml-6"
                            />
                          )}
                        </div>
                      ))}

                      <div className="space-y-2 mt-4">
                        <Label htmlFor="equipmentNotes">Additional Equipment Notes</Label>
                        <Textarea
                          id="equipmentNotes"
                          value={formData.equipment_notes}
                          onChange={(e) => handleInputChange("equipment_notes", e.target.value)}
                          placeholder="Any special requirements or preferences?"
                          maxLength={500}
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={handleStep1Next} className="w-full">
                  Next: Waiver & Signature <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">PADI Liability Release and Assumption of Risk Agreement</h3>
                  
                  <div className="max-h-64 overflow-y-auto border rounded-lg p-4 bg-muted/30 text-sm space-y-2">
                    <p className="font-semibold">Please read carefully before signing:</p>
                    <p>
                      I understand and agree that skin and scuba diving have inherent risks which may result in serious injury or death.
                    </p>
                    <p>
                      I understand that diving with compressed air involves certain inherent risks; decompression sickness, embolism or other hyperbaric injury can occur that require treatment in a recompression chamber.
                    </p>
                    <p>
                      I further understand that the open water diving trips which are necessary for training and for certification may be conducted at a site that is remote, either by time or distance or both, from such a recompression chamber.
                    </p>
                    <p>
                      I still choose to proceed with such instructional dives in spite of the possible absence of a recompression chamber in proximity to the dive site.
                    </p>
                    <p>
                      I understand and agree that neither the dive center, instructors, nor PADI through whom I receive my training, nor the vessel or facility through which I receive my training, nor their respective employees, officers, agents, contractors or assigns, may be held liable or responsible in any way for any injury, death or other damages to me, my family, estate, heirs or assigns that may occur as a result of my participation in this diving program or as a result of the negligence of any party, including the Released Parties, whether passive or active.
                    </p>
                    <p className="font-semibold mt-4">
                      By signing below, I agree to the terms and conditions stated in this waiver.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Your Signature *</Label>
                    <div className="border-2 border-dashed rounded-lg">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        className="w-full h-48 touch-none cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={clearSignature}>
                      Clear Signature
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ChevronLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                    {loading ? "Submitting..." : "Complete Registration"}
                    <CheckCircle className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
