import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Cloud, Wind, Waves, AlertTriangle, CheckCircle } from "lucide-react";

interface ConditionTrackerProps {
  bookingId: string;
  conditions?: any;
  onConditionUpdated: () => void;
}

export const ConditionTracker = ({ bookingId, conditions, onConditionUpdated }: ConditionTrackerProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    temperature: conditions?.temperature || "",
    wind_speed: conditions?.wind_speed || "",
    wave_height: conditions?.wave_height || "",
    tide_status: conditions?.tide_status || "",
  });

  const calculateFlagStatus = (windSpeed: number, waveHeight: number) => {
    if (windSpeed > 25 || waveHeight > 2.5) return { status: "red", reason: "Unsafe conditions: High wind or waves" };
    if (windSpeed > 15 || waveHeight > 1.5) return { status: "yellow", reason: "Caution: Moderate conditions" };
    return { status: "green", reason: "Safe conditions" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const windSpeed = parseFloat(formData.wind_speed);
      const waveHeight = parseFloat(formData.wave_height);
      const { status, reason } = calculateFlagStatus(windSpeed, waveHeight);

      const conditionData = {
        booking_id: bookingId,
        temperature: parseFloat(formData.temperature),
        wind_speed: windSpeed,
        wave_height: waveHeight,
        tide_status: formData.tide_status,
        flag_status: status,
        flag_reason: reason,
      };

      if (conditions?.id) {
        await supabase
          .from("dive_conditions")
          .update(conditionData)
          .eq("id", conditions.id);
      } else {
        await supabase.from("dive_conditions").insert(conditionData);
      }

      toast.success("Conditions updated successfully");
      onConditionUpdated();
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update conditions");
    } finally {
      setLoading(false);
    }
  };

  const getFlagIcon = (status: string) => {
    switch (status) {
      case "green": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "yellow": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "red": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Cloud className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getFlagColor = (status: string) => {
    switch (status) {
      case "green": return "bg-green-500";
      case "yellow": return "bg-yellow-500";
      case "red": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {getFlagIcon(conditions?.flag_status || "none")}
          {conditions ? "Update Conditions" : "Add Conditions"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Environmental Conditions</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {conditions && (
            <Card className={`border-2 ${conditions.flag_status === 'red' ? 'border-red-500' : conditions.flag_status === 'yellow' ? 'border-yellow-500' : 'border-green-500'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getFlagColor(conditions.flag_status)}>
                    {conditions.flag_status.toUpperCase()}
                  </Badge>
                  {getFlagIcon(conditions.flag_status)}
                </div>
                <p className="text-sm text-muted-foreground">{conditions.flag_reason}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="wind_speed">Wind Speed (km/h)</Label>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="wind_speed"
                  type="number"
                  step="0.1"
                  value={formData.wind_speed}
                  onChange={(e) => setFormData({ ...formData, wind_speed: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="wave_height">Wave Height (m)</Label>
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="wave_height"
                  type="number"
                  step="0.1"
                  value={formData.wave_height}
                  onChange={(e) => setFormData({ ...formData, wave_height: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tide_status">Tide Status</Label>
              <Input
                id="tide_status"
                placeholder="e.g., High Tide 10:30"
                value={formData.tide_status}
                onChange={(e) => setFormData({ ...formData, tide_status: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <p className="font-semibold mb-1">Safety Thresholds:</p>
            <p>🟢 Green: Wind &lt; 15 km/h, Waves &lt; 1.5m</p>
            <p>🟡 Yellow: Wind 15-25 km/h, Waves 1.5-2.5m</p>
            <p>🔴 Red: Wind &gt; 25 km/h, Waves &gt; 2.5m</p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Conditions"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
