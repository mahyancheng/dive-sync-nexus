import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BookingInfo {
  id: string;
  dive_date: string;
  group_name: string | null;
  location: string | null;
  dive_center_id: string;
  dive_center_name?: string;
}

const EquipmentRequest = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingInfo | null>(null);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    bcd_needed: false,
    bcd_size: "",
    fins_needed: false,
    fins_size: "",
    regulator_needed: false,
    mask_needed: false,
    wetsuit_needed: false,
    wetsuit_size: "",
    notes: "",
  });

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    if (!bookingId) {
      toast.error("Invalid booking link");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("dive_bookings")
      .select(`
        id,
        dive_date,
        group_name,
        location,
        dive_center_id,
        dive_centers (name)
      `)
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !data) {
      toast.error("Booking not found");
      setLoading(false);
      return;
    }

    setBooking({
      ...data,
      dive_center_name: (data.dive_centers as any)?.name,
    });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!bookingId) return;

    setSubmitting(true);

    const { error } = await supabase.from("equipment_requests").insert({
      booking_id: bookingId,
      customer_name: formData.customer_name.trim(),
      customer_email: formData.customer_email.trim() || null,
      bcd_needed: formData.bcd_needed,
      bcd_size: formData.bcd_needed ? formData.bcd_size : null,
      fins_needed: formData.fins_needed,
      fins_size: formData.fins_needed ? formData.fins_size : null,
      regulator_needed: formData.regulator_needed,
      mask_needed: formData.mask_needed,
      wetsuit_needed: formData.wetsuit_needed,
      wetsuit_size: formData.wetsuit_needed ? formData.wetsuit_size : null,
      notes: formData.notes.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit equipment request");
      return;
    }

    toast.success("Equipment request submitted successfully!");
    
    // Reset form
    setFormData({
      customer_name: "",
      customer_email: "",
      bcd_needed: false,
      bcd_size: "",
      fins_needed: false,
      fins_size: "",
      regulator_needed: false,
      mask_needed: false,
      wetsuit_needed: false,
      wetsuit_size: "",
      notes: "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground">
            The booking you're looking for doesn't exist or the link is invalid.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Equipment Request</h1>
            <p className="text-muted-foreground">
              {booking.dive_center_name && `${booking.dive_center_name} - `}
              {new Date(booking.dive_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {booking.location && (
              <p className="text-sm text-muted-foreground mt-1">📍 {booking.location}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Your Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customer_email">Email (Optional)</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Equipment Needs */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Equipment Needed</h3>

              {/* BCD */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bcd_needed"
                    checked={formData.bcd_needed}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, bcd_needed: checked as boolean })
                    }
                  />
                  <Label htmlFor="bcd_needed" className="cursor-pointer">
                    BCD (Buoyancy Control Device)
                  </Label>
                </div>
                {formData.bcd_needed && (
                  <Select
                    value={formData.bcd_size}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bcd_size: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">Extra Small (XS)</SelectItem>
                      <SelectItem value="S">Small (S)</SelectItem>
                      <SelectItem value="M">Medium (M)</SelectItem>
                      <SelectItem value="L">Large (L)</SelectItem>
                      <SelectItem value="XL">Extra Large (XL)</SelectItem>
                      <SelectItem value="XXL">2XL</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Fins */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fins_needed"
                    checked={formData.fins_needed}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, fins_needed: checked as boolean })
                    }
                  />
                  <Label htmlFor="fins_needed" className="cursor-pointer">
                    Fins
                  </Label>
                </div>
                {formData.fins_needed && (
                  <Select
                    value={formData.fins_size}
                    onValueChange={(value) =>
                      setFormData({ ...formData, fins_size: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6-7">6-7 (EU 39-40)</SelectItem>
                      <SelectItem value="8-9">8-9 (EU 41-42)</SelectItem>
                      <SelectItem value="10-11">10-11 (EU 43-44)</SelectItem>
                      <SelectItem value="12-13">12-13 (EU 45-46)</SelectItem>
                      <SelectItem value="14+">14+ (EU 47+)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Regulator */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regulator_needed"
                  checked={formData.regulator_needed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, regulator_needed: checked as boolean })
                  }
                />
                <Label htmlFor="regulator_needed" className="cursor-pointer">
                  Regulator
                </Label>
              </div>

              {/* Mask */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mask_needed"
                  checked={formData.mask_needed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, mask_needed: checked as boolean })
                  }
                />
                <Label htmlFor="mask_needed" className="cursor-pointer">
                  Mask
                </Label>
              </div>

              {/* Wetsuit */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wetsuit_needed"
                    checked={formData.wetsuit_needed}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, wetsuit_needed: checked as boolean })
                    }
                  />
                  <Label htmlFor="wetsuit_needed" className="cursor-pointer">
                    Wetsuit
                  </Label>
                </div>
                {formData.wetsuit_needed && (
                  <Select
                    value={formData.wetsuit_size}
                    onValueChange={(value) =>
                      setFormData({ ...formData, wetsuit_size: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">Extra Small (XS)</SelectItem>
                      <SelectItem value="S">Small (S)</SelectItem>
                      <SelectItem value="M">Medium (M)</SelectItem>
                      <SelectItem value="L">Large (L)</SelectItem>
                      <SelectItem value="XL">Extra Large (XL)</SelectItem>
                      <SelectItem value="XXL">2XL</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any special requirements or preferences..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Equipment Request"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EquipmentRequest;
