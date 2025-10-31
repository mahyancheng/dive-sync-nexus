import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Calendar } from "lucide-react";
import { format } from "date-fns";

interface CreateEventDialogProps {
  diveCenterId: string;
  onEventCreated: () => void;
}

export const CreateEventDialog = ({ diveCenterId, onEventCreated }: CreateEventDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    time: "",
    location: "",
    dive_type: "shore",
    participants_count: 1,
    group_name: "",
    priority: "medium" as "low" | "medium" | "high"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create booking for each day in the date range
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date || formData.start_date);
      
      const bookingsToCreate = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const diveDateTime = new Date(currentDate);
        if (formData.time) {
          const [hours, minutes] = formData.time.split(':');
          diveDateTime.setHours(parseInt(hours), parseInt(minutes));
        }

        bookingsToCreate.push({
          dive_center_id: diveCenterId,
          customer_id: user.id,
          dive_date: diveDateTime.toISOString(),
          dive_type: formData.dive_type,
          group_name: formData.group_name || formData.title,
          booking_date: new Date().toISOString(),
          participants_count: formData.participants_count,
          total_amount: 0,
          payment_status: "unpaid",
          status: formData.priority === "high" ? "confirmed" : "pending",
          notes: formData.description
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const { error } = await supabase
        .from("dive_bookings")
        .insert(bookingsToCreate);

      if (error) throw error;

      const dayCount = bookingsToCreate.length;
      toast.success(`Event created successfully${dayCount > 1 ? ` across ${dayCount} days` : ''}`);
      
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        time: "",
        location: "",
        dive_type: "shore",
        participants_count: 1,
        group_name: "",
        priority: "medium"
      });
      onEventCreated();
    } catch (error: any) {
      toast.error(error.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const isMultiDay = formData.start_date && formData.end_date && formData.start_date !== formData.end_date;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Create New Event
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Morning Dive Session"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Event details and notes..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for single-day event
              </p>
            </div>
          </div>

          {isMultiDay && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary">
                This event will be created for {Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} consecutive days
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., North Reef"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dive_type">Dive Type *</Label>
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

            <div>
              <Label htmlFor="participants_count">Participants *</Label>
              <Input
                id="participants_count"
                type="number"
                min="1"
                required
                value={formData.participants_count}
                onChange={(e) => setFormData({ ...formData, participants_count: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="group_name">Group Name</Label>
            <Input
              id="group_name"
              value={formData.group_name}
              onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
              placeholder="Optional group identifier"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating..." : isMultiDay ? "Create Multi-Day Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};