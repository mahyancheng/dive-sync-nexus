import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddBookingDialogProps {
  diveCenterId: string;
  onBookingAdded: () => void;
}

export const AddBookingDialog = ({ diveCenterId, onBookingAdded }: AddBookingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boats, setBoats] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    dive_date: "",
    dive_type: "shore",
    boat_id: "",
    group_name: "",
    participants_count: 1,
    total_amount: "",
    deposit_amount: "",
    payment_status: "unpaid",
    status: "pending",
    notes: ""
  });

  useEffect(() => {
    const fetchBoats = async () => {
      const { data } = await supabase
        .from("boats")
        .select("*")
        .eq("dive_center_id", diveCenterId);
      if (data) setBoats(data);
    };
    fetchBoats();
  }, [diveCenterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("dive_bookings")
        .insert({
          dive_center_id: diveCenterId,
          customer_id: user.id,
          dive_date: new Date(formData.dive_date).toISOString(),
          dive_type: formData.dive_type,
          boat_id: formData.boat_id || null,
          group_name: formData.group_name || null,
          booking_date: new Date().toISOString(),
          participants_count: formData.participants_count,
          total_amount: parseFloat(formData.total_amount),
          deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
          payment_status: formData.payment_status,
          status: formData.status,
          notes: formData.notes || null
        });

      if (error) throw error;

      toast.success("Booking created successfully");
      setOpen(false);
      setFormData({
        dive_date: "",
        dive_type: "shore",
        boat_id: "",
        group_name: "",
        participants_count: 1,
        total_amount: "",
        deposit_amount: "",
        payment_status: "unpaid",
        status: "pending",
        notes: ""
      });
      onBookingAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dive_date">Dive Date & Time</Label>
              <Input
                id="dive_date"
                type="datetime-local"
                required
                value={formData.dive_date}
                onChange={(e) => setFormData({ ...formData, dive_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dive_type">Dive Type</Label>
              <Select
                value={formData.dive_type}
                onValueChange={(value) => setFormData({ ...formData, dive_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shore">Shore Dive</SelectItem>
                  <SelectItem value="boat">Boat Dive</SelectItem>
                  <SelectItem value="night">Night Dive</SelectItem>
                  <SelectItem value="double">Double Dive</SelectItem>
                  <SelectItem value="3-dive-trip">3-Dive Trip</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="boat">Assigned Boat</Label>
              <Select
                value={formData.boat_id}
                onValueChange={(value) => setFormData({ ...formData, boat_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select boat (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {boats.map((boat) => (
                    <SelectItem key={boat.id} value={boat.id}>
                      {boat.name} (Cap: {boat.max_capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="group_name">Group Name</Label>
              <Input
                id="group_name"
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                placeholder="e.g., Morning Group"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="participants_count">Number of Divers</Label>
            <Input
              id="participants_count"
              type="number"
              min="1"
              required
              value={formData.participants_count}
              onChange={(e) => setFormData({ ...formData, participants_count: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="total_amount">Total Amount ($)</Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              required
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="deposit_amount">Deposit Amount ($)</Label>
            <Input
              id="deposit_amount"
              type="number"
              step="0.01"
              value={formData.deposit_amount}
              onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="payment_status">Payment Status</Label>
            <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="deposit">Deposit Paid</SelectItem>
                <SelectItem value="paid">Fully Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Booking Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Booking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
