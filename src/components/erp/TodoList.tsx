import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isToday, isTomorrow, addDays, isBefore, startOfDay, differenceInDays } from "date-fns";
import { 
  CheckCircle2, Circle, AlertTriangle, Package, Anchor, Users, 
  ClipboardList, RefreshCw, Wrench, AlertCircle, Gauge, Ship
} from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  booking_id: string | null;
  event_id: string | null;
  task_type: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
  priority: number;
  booking?: {
    group_name: string | null;
    dive_date: string;
    location: string | null;
  };
  event?: {
    title: string;
    start_time: string;
  };
}

interface Alert {
  id: string;
  type: "maintenance" | "unassigned" | "shortage" | "tank_service";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  relatedId?: string;
  dueDate?: string;
}

interface TodoListProps {
  diveCenterId: string;
  operatorMode?: boolean;
  selectedDate?: Date;
  onRefresh?: () => void;
}

const TASK_TYPES: Record<string, { label: string; icon: typeof Package; color: string }> = {
  equipment_prep: { label: "Equipment Prep", icon: Package, color: "bg-blue-500" },
  tank_fill: { label: "Tank Fill", icon: Anchor, color: "bg-cyan-500" },
  boat_prep: { label: "Boat Prep", icon: Ship, color: "bg-indigo-500" },
  briefing: { label: "Briefing", icon: Users, color: "bg-green-500" },
  checkout: { label: "Checkout", icon: ClipboardList, color: "bg-orange-500" },
  equipment_check: { label: "Equipment Check", icon: Wrench, color: "bg-amber-500" },
  participant_check: { label: "Participant Check", icon: Users, color: "bg-teal-500" },
  maintenance: { label: "Maintenance", icon: Wrench, color: "bg-red-500" },
  tank_service: { label: "Tank Service", icon: Gauge, color: "bg-purple-500" },
  custom: { label: "Custom", icon: Circle, color: "bg-gray-500" },
};

export function TodoList({ diveCenterId, operatorMode = false, selectedDate, onRefresh }: TodoListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");
  const generatingRef = useRef(false);
  const lastGeneratedRef = useRef<string>("");

  // Fetch equipment and inventory alerts
  const fetchAlerts = useCallback(async () => {
    const newAlerts: Alert[] = [];

    try {
      // 1. Equipment needing maintenance (overdue or upcoming)
      const { data: equipment } = await supabase
        .from("dive_equipment")
        .select("id, equipment_type, size, status, next_service_date, last_service_date")
        .eq("dive_center_id", diveCenterId);

      if (equipment) {
        const today = new Date();
        
        equipment.forEach(eq => {
          // Maintenance status check
          if (eq.status === "maintenance") {
            newAlerts.push({
              id: `eq-maint-${eq.id}`,
              type: "maintenance",
              title: `${eq.equipment_type} ${eq.size || ""} in maintenance`,
              description: "Equipment currently under maintenance - not available for trips",
              priority: "medium",
              relatedId: eq.id,
            });
          }

          // Upcoming/overdue service
          if (eq.next_service_date) {
            const serviceDate = new Date(eq.next_service_date);
            const daysUntil = differenceInDays(serviceDate, today);
            
            if (daysUntil < 0) {
              newAlerts.push({
                id: `eq-overdue-${eq.id}`,
                type: "maintenance",
                title: `${eq.equipment_type} ${eq.size || ""} - OVERDUE service`,
                description: `Service was due ${Math.abs(daysUntil)} days ago`,
                priority: "high",
                relatedId: eq.id,
                dueDate: eq.next_service_date,
              });
            } else if (daysUntil <= 7) {
              newAlerts.push({
                id: `eq-upcoming-${eq.id}`,
                type: "maintenance",
                title: `${eq.equipment_type} ${eq.size || ""} - service due soon`,
                description: `Scheduled service in ${daysUntil} days`,
                priority: daysUntil <= 3 ? "high" : "medium",
                relatedId: eq.id,
                dueDate: eq.next_service_date,
              });
            }
          }
        });

        // Count available equipment by type and size
        const availableEquipment = equipment.filter(e => e.status === "available");
        const equipmentCounts: Record<string, number> = {};
        availableEquipment.forEach(e => {
          const key = `${e.equipment_type}-${e.size || "any"}`;
          equipmentCounts[key] = (equipmentCounts[key] || 0) + 1;
        });

        // 2. Check upcoming events (both bookings AND custom events) for equipment shortages
        const targetDate = selectedDate || new Date();
        
        // Check dive_bookings
        const { data: bookings } = await supabase
          .from("dive_bookings")
          .select("id, group_name, dive_date, participants_count")
          .eq("dive_center_id", diveCenterId)
          .gte("dive_date", format(targetDate, "yyyy-MM-dd"))
          .lte("dive_date", format(addDays(targetDate, 7), "yyyy-MM-dd"));

        // Check custom_events (dive trips)
        const { data: customEvents } = await supabase
          .from("custom_events")
          .select("id, title, start_time, event_group_id")
          .eq("dive_center_id", diveCenterId)
          .gte("start_time", format(targetDate, "yyyy-MM-dd"))
          .lte("start_time", format(addDays(targetDate, 7), "yyyy-MM-dd"));

        // Process custom events for equipment alerts
        const processedGroups = new Set<string>();
        for (const event of customEvents || []) {
          // Skip duplicates for multi-day trips
          if (event.event_group_id && processedGroups.has(event.event_group_id)) continue;
          if (event.event_group_id) processedGroups.add(event.event_group_id);

          // Get participants for this event
          const { data: participants } = await supabase
            .from("dive_trip_participants")
            .select("id")
            .eq("event_id", event.id);

          const participantCount = participants?.length || 0;
          if (participantCount === 0) continue;

          // Get equipment requests from participants
          const { data: equipmentRequests } = await supabase
            .from("equipment_rental_requests")
            .select("*")
            .in("participant_id", participants?.map(p => p.id) || []);

          // Get assignments for this event
          const { data: assignments } = await supabase
            .from("event_inventory_assignments")
            .select("equipment_id, tank_id")
            .eq("event_id", event.id);

          const assignedEquipmentCount = assignments?.filter(a => a.equipment_id).length || 0;
          const assignedTankCount = assignments?.filter(a => a.tank_id).length || 0;

          // Calculate needed equipment
          let totalNeeded = 0;
          const neededByType: Record<string, number> = {};
          
          equipmentRequests?.forEach(req => {
            if (req.bcd_needed) { totalNeeded++; neededByType['BCD'] = (neededByType['BCD'] || 0) + 1; }
            if (req.fins_needed) { totalNeeded++; neededByType['Fins'] = (neededByType['Fins'] || 0) + 1; }
            if (req.mask_needed) { totalNeeded++; neededByType['Mask'] = (neededByType['Mask'] || 0) + 1; }
            if (req.wetsuit_needed) { totalNeeded++; neededByType['Wetsuit'] = (neededByType['Wetsuit'] || 0) + 1; }
            if (req.regulator_needed) { totalNeeded++; neededByType['Regulator'] = (neededByType['Regulator'] || 0) + 1; }
          });

          if (totalNeeded > 0 && assignedEquipmentCount < totalNeeded) {
            const shortage = totalNeeded - assignedEquipmentCount;
            const neededList = Object.entries(neededByType).map(([type, count]) => `${count}x ${type}`).join(", ");
            newAlerts.push({
              id: `shortage-event-${event.id}`,
              type: "shortage",
              title: `Equipment shortage: ${event.title}`,
              description: `${shortage} items unassigned (${assignedEquipmentCount}/${totalNeeded}). Needed: ${neededList}`,
              priority: "high",
              relatedId: event.id,
              dueDate: event.start_time,
            });
          }

          // Check tanks
          if (participantCount > 0 && assignedTankCount === 0) {
            newAlerts.push({
              id: `tanks-event-${event.id}`,
              type: "unassigned",
              title: `No tanks assigned: ${event.title}`,
              description: `${participantCount} divers need tanks for ${format(new Date(event.start_time), "MMM d")}`,
              priority: "high",
              relatedId: event.id,
              dueDate: event.start_time,
            });
          } else if (participantCount > assignedTankCount && assignedTankCount > 0) {
            newAlerts.push({
              id: `tanks-partial-${event.id}`,
              type: "shortage",
              title: `Insufficient tanks: ${event.title}`,
              description: `Only ${assignedTankCount}/${participantCount} tanks assigned`,
              priority: "high",
              relatedId: event.id,
              dueDate: event.start_time,
            });
          }
        }

        // Process dive_bookings similarly
        for (const booking of bookings || []) {
          const { data: assignments } = await supabase
            .from("event_inventory_assignments")
            .select("equipment_id, tank_id")
            .eq("event_id", booking.id);

          const { data: participants } = await supabase
            .from("dive_trip_participants")
            .select("id")
            .eq("event_id", booking.id);

          const { data: equipmentRequests } = await supabase
            .from("equipment_rental_requests")
            .select("*")
            .in("participant_id", participants?.map(p => p.id) || []);

          const assignedEquipmentCount = assignments?.filter(a => a.equipment_id).length || 0;
          const assignedTankCount = assignments?.filter(a => a.tank_id).length || 0;

          let totalNeeded = 0;
          equipmentRequests?.forEach(req => {
            if (req.bcd_needed) totalNeeded++;
            if (req.fins_needed) totalNeeded++;
            if (req.mask_needed) totalNeeded++;
            if (req.wetsuit_needed) totalNeeded++;
            if (req.regulator_needed) totalNeeded++;
          });

          if (totalNeeded > 0 && assignedEquipmentCount < totalNeeded) {
            newAlerts.push({
              id: `shortage-${booking.id}`,
              type: "shortage",
              title: `Equipment shortage: ${booking.group_name || "Dive trip"}`,
              description: `${totalNeeded - assignedEquipmentCount} items unassigned (${assignedEquipmentCount}/${totalNeeded})`,
              priority: "high",
              relatedId: booking.id,
              dueDate: booking.dive_date,
            });
          }

          if (booking.participants_count > 0 && assignedTankCount === 0) {
            newAlerts.push({
              id: `tanks-${booking.id}`,
              type: "unassigned",
              title: `No tanks assigned: ${booking.group_name || "Dive trip"}`,
              description: `${booking.participants_count} divers need tanks`,
              priority: "high",
              relatedId: booking.id,
              dueDate: booking.dive_date,
            });
          }
        }
      }

      // 3. Tanks needing service (hydrostatic or visual test)
      const { data: tanks } = await supabase
        .from("dive_tanks")
        .select("id, tank_number, status, hydrostatic_test_date, visual_test_date")
        .eq("dive_center_id", diveCenterId);

      if (tanks) {
        const today = new Date();

        tanks.forEach(tank => {
          // Check hydrostatic test (typically every 5 years)
          if (tank.hydrostatic_test_date) {
            const hydroDate = new Date(tank.hydrostatic_test_date);
            const daysSince = differenceInDays(today, hydroDate);
            const fiveYears = 365 * 5;
            
            if (daysSince > fiveYears) {
              newAlerts.push({
                id: `tank-hydro-${tank.id}`,
                type: "tank_service",
                title: `Tank ${tank.tank_number} - Hydrostatic test OVERDUE`,
                description: `Last tested ${Math.floor(daysSince / 365)} years ago`,
                priority: "high",
                relatedId: tank.id,
              });
            } else if (daysSince > fiveYears - 90) {
              newAlerts.push({
                id: `tank-hydro-soon-${tank.id}`,
                type: "tank_service",
                title: `Tank ${tank.tank_number} - Hydrostatic test due soon`,
                description: `Due within ${Math.floor((fiveYears - daysSince) / 30)} months`,
                priority: "medium",
                relatedId: tank.id,
              });
            }
          }

          // Check visual test (typically annual)
          if (tank.visual_test_date) {
            const visualDate = new Date(tank.visual_test_date);
            const daysSince = differenceInDays(today, visualDate);
            
            if (daysSince > 365) {
              newAlerts.push({
                id: `tank-visual-${tank.id}`,
                type: "tank_service",
                title: `Tank ${tank.tank_number} - Visual inspection OVERDUE`,
                description: `Last inspected ${Math.floor(daysSince / 30)} months ago`,
                priority: "high",
                relatedId: tank.id,
              });
            } else if (daysSince > 300) {
              newAlerts.push({
                id: `tank-visual-soon-${tank.id}`,
                type: "tank_service",
                title: `Tank ${tank.tank_number} - Visual inspection due soon`,
                description: `Due within ${Math.floor((365 - daysSince) / 7)} weeks`,
                priority: "medium",
                relatedId: tank.id,
              });
            }
          }
        });

        // Count available tanks
        const availableTanks = tanks.filter(t => t.status === "full" || t.status === "empty").length;
        const { data: upcomingBookings } = await supabase
          .from("dive_bookings")
          .select("participants_count")
          .eq("dive_center_id", diveCenterId)
          .gte("dive_date", format(new Date(), "yyyy-MM-dd"))
          .lte("dive_date", format(addDays(new Date(), 3), "yyyy-MM-dd"));

        const totalDiversSoon = upcomingBookings?.reduce((sum, b) => sum + b.participants_count, 0) || 0;
        
        if (totalDiversSoon > availableTanks) {
          newAlerts.push({
            id: "tank-shortage-overall",
            type: "shortage",
            title: "Tank shortage warning",
            description: `${totalDiversSoon} divers expected in next 3 days but only ${availableTanks} tanks available`,
            priority: "high",
          });
        }
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  }, [diveCenterId, selectedDate]);

  // Auto-generate tasks from bookings AND custom events
  const autoGenerateTasks = useCallback(async () => {
    const cacheKey = `${diveCenterId}-${selectedDate?.toISOString() || "now"}`;
    if (generatingRef.current || lastGeneratedRef.current === cacheKey) return;
    generatingRef.current = true;

    try {
      const targetDate = selectedDate || new Date();
      const startDate = format(startOfDay(targetDate), "yyyy-MM-dd'T'HH:mm:ss");
      const endDate = format(addDays(targetDate, 14), "yyyy-MM-dd'T'HH:mm:ss");

      // Get upcoming bookings
      const { data: bookings } = await supabase
        .from("dive_bookings")
        .select("id, group_name, dive_date, location, participants_count")
        .eq("dive_center_id", diveCenterId)
        .gte("dive_date", startDate)
        .lte("dive_date", endDate);

      // Get custom events (dive trips, etc.)
      const { data: customEvents } = await supabase
        .from("custom_events")
        .select("id, title, start_time, end_time, category, dive_type, event_group_id")
        .eq("dive_center_id", diveCenterId)
        .gte("start_time", startDate)
        .lte("start_time", endDate);

      // Get maintenance logs for scheduled maintenance
      const { data: maintenanceLogs } = await supabase
        .from("maintenance_logs")
        .select("id, maintenance_type, description, next_due_date, equipment_id, tank_id, boat_id")
        .eq("dive_center_id", diveCenterId)
        .not("next_due_date", "is", null)
        .gte("next_due_date", format(targetDate, "yyyy-MM-dd"))
        .lte("next_due_date", format(addDays(targetDate, 14), "yyyy-MM-dd"));

      // Get existing tasks to avoid duplicates
      const { data: existingTasks } = await supabase
        .from("booking_tasks")
        .select("booking_id, task_type, event_id")
        .eq("dive_center_id", diveCenterId);

      const existingTaskMap = new Set(
        existingTasks?.map(t => `${t.booking_id || t.event_id}-${t.task_type}`) || []
      );

      const newTasks: any[] = [];

      // Generate booking tasks
      for (const booking of bookings || []) {
        const diveDate = new Date(booking.dive_date);
        const prepDate = format(addDays(diveDate, -1), "yyyy-MM-dd");
        const dayOfDate = format(diveDate, "yyyy-MM-dd");

        const taskTemplates = [
          { type: "equipment_prep", title: `Prepare equipment for ${booking.group_name || "dive trip"}`, desc: `Check and prepare ${booking.participants_count} sets of equipment`, date: prepDate, priority: 2 },
          { type: "tank_fill", title: `Fill tanks for ${booking.group_name || "dive trip"}`, desc: `Ensure tanks are filled for ${booking.participants_count} divers`, date: prepDate, priority: 3 },
          { type: "participant_check", title: `Verify participants for ${booking.group_name || "dive trip"}`, desc: `Confirm ${booking.participants_count} participants registered`, date: prepDate, priority: 2 },
          { type: "boat_prep", title: `Prepare boat for ${booking.group_name || "dive trip"}`, desc: `Load equipment for ${booking.location || "dive site"}`, date: dayOfDate, priority: 3 },
          { type: "equipment_check", title: `Equipment check: ${booking.group_name || "dive trip"}`, desc: `Verify all assigned equipment for ${booking.participants_count} divers`, date: dayOfDate, priority: 3 },
          { type: "briefing", title: `Briefing: ${booking.group_name || "dive trip"}`, desc: `Safety briefing for ${booking.participants_count} participants`, date: dayOfDate, priority: 2 },
          { type: "checkout", title: `Checkout: ${booking.group_name || "dive trip"}`, desc: `Verify equipment return and complete paperwork`, date: dayOfDate, priority: 1 },
        ];

        for (const template of taskTemplates) {
          if (!existingTaskMap.has(`${booking.id}-${template.type}`)) {
            newTasks.push({
              dive_center_id: diveCenterId,
              booking_id: booking.id,
              task_type: template.type,
              title: template.title,
              description: template.desc,
              due_date: template.date,
              priority: template.priority,
            });
          }
        }
      }

      // Generate tasks from custom events (dive trips)
      // Group events by event_group_id to avoid duplicate tasks for multi-day trips
      const processedGroups = new Set<string>();
      
      for (const event of customEvents || []) {
        // Skip if this is part of a multi-day trip and we already processed it
        if (event.event_group_id && processedGroups.has(event.event_group_id)) {
          continue;
        }
        if (event.event_group_id) {
          processedGroups.add(event.event_group_id);
        }

        // Get participant count for this event
        const { data: participants } = await supabase
          .from("dive_trip_participants")
          .select("id")
          .eq("event_id", event.id);

        const participantCount = participants?.length || 0;
        const eventDate = new Date(event.start_time);
        const prepDate = format(addDays(eventDate, -1), "yyyy-MM-dd");
        const dayOfDate = format(eventDate, "yyyy-MM-dd");

        const taskTemplates = [
          { type: "equipment_prep", title: `Prepare equipment: ${event.title}`, desc: `Check and prepare ${participantCount} sets of equipment`, date: prepDate, priority: 2 },
          { type: "tank_fill", title: `Fill tanks: ${event.title}`, desc: `Ensure tanks are filled for ${participantCount} divers`, date: prepDate, priority: 3 },
          { type: "participant_check", title: `Verify participants: ${event.title}`, desc: `Confirm ${participantCount} participants registered`, date: prepDate, priority: 2 },
          { type: "boat_prep", title: `Prepare boat: ${event.title}`, desc: `Load equipment and supplies`, date: dayOfDate, priority: 3 },
          { type: "equipment_check", title: `Equipment check: ${event.title}`, desc: `Verify all assigned equipment for ${participantCount} divers`, date: dayOfDate, priority: 3 },
          { type: "briefing", title: `Briefing: ${event.title}`, desc: `Safety briefing for ${participantCount} participants`, date: dayOfDate, priority: 2 },
          { type: "checkout", title: `Checkout: ${event.title}`, desc: `Verify equipment return and complete paperwork`, date: dayOfDate, priority: 1 },
        ];

        for (const template of taskTemplates) {
          if (!existingTaskMap.has(`${event.id}-${template.type}`)) {
            newTasks.push({
              dive_center_id: diveCenterId,
              event_id: event.id,
              task_type: template.type,
              title: template.title,
              description: template.desc,
              due_date: template.date,
              priority: template.priority,
            });
          }
        }
      }

      // Generate maintenance tasks from scheduled maintenance
      for (const maint of maintenanceLogs || []) {
        const taskKey = `maint-${maint.id}-maintenance`;
        if (!existingTaskMap.has(taskKey)) {
          newTasks.push({
            dive_center_id: diveCenterId,
            task_type: "maintenance",
            title: `Maintenance: ${maint.maintenance_type}`,
            description: maint.description,
            due_date: format(new Date(maint.next_due_date!), "yyyy-MM-dd"),
            priority: 3,
          });
        }
      }

      if (newTasks.length > 0) {
        await supabase.from("booking_tasks").insert(newTasks);
      }
      lastGeneratedRef.current = cacheKey;
    } catch (error) {
      console.error("Error auto-generating tasks:", error);
    } finally {
      generatingRef.current = false;
    }
  }, [diveCenterId, selectedDate]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      // First auto-generate any missing tasks
      await autoGenerateTasks();
      // Fetch alerts from inventory
      await fetchAlerts();

      const targetDate = selectedDate || new Date();
      const startDate = format(startOfDay(targetDate), "yyyy-MM-dd");
      const endDate = format(addDays(targetDate, operatorMode ? 0 : 7), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("booking_tasks")
        .select(`
          *,
          booking:dive_bookings(group_name, dive_date, location),
          event:custom_events(title, start_time)
        `)
        .eq("dive_center_id", diveCenterId)
        .gte("due_date", startDate)
        .lte("due_date", endDate)
        .order("due_date", { ascending: true })
        .order("priority", { ascending: false })
        .order("completed", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [diveCenterId, selectedDate, operatorMode, autoGenerateTasks, fetchAlerts]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Subscribe to changes
  useEffect(() => {
    const channel = supabase
      .channel('todo-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dive_bookings', filter: `dive_center_id=eq.${diveCenterId}` }, () => {
        lastGeneratedRef.current = "";
        fetchTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_events', filter: `dive_center_id=eq.${diveCenterId}` }, () => {
        lastGeneratedRef.current = "";
        fetchTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dive_trip_participants' }, () => {
        lastGeneratedRef.current = "";
        fetchTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dive_equipment', filter: `dive_center_id=eq.${diveCenterId}` }, () => {
        fetchAlerts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dive_tanks', filter: `dive_center_id=eq.${diveCenterId}` }, () => {
        fetchAlerts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_inventory_assignments' }, () => {
        fetchAlerts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_rental_requests' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [diveCenterId, fetchTasks, fetchAlerts]);

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("booking_tasks")
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null }
            : t
        )
      );
      
      if (completed) {
        toast.success("Task completed!");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const getPriorityBadge = (priority: number | string) => {
    const p = typeof priority === "string" ? (priority === "high" ? 3 : priority === "medium" ? 2 : 1) : priority;
    switch (p) {
      case 3:
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 2:
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Low</Badge>;
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.due_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;
  const overdueCount = tasks.filter(t => !t.completed && isBefore(new Date(t.due_date), startOfDay(new Date()))).length;
  const highPriorityAlerts = alerts.filter(a => a.priority === "high").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading tasks...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={operatorMode ? "border-primary border-2" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {operatorMode ? "Today's Operations" : "Task Checklist"}
          </CardTitle>
          {highPriorityAlerts > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {highPriorityAlerts} Alert{highPriorityAlerts > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="tasks" className="flex-1 gap-1">
              <ClipboardList className="h-4 w-4" />
              Tasks
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex-1 gap-1">
              <AlertCircle className="h-4 w-4" />
              Alerts
              {alerts.length > 0 && (
                <Badge variant={highPriorityAlerts > 0 ? "destructive" : "secondary"} className="ml-1 h-5 px-1.5">
                  {alerts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-0">
            <div className="flex gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {completedCount} done
              </span>
              <span className="flex items-center gap-1">
                <Circle className="h-4 w-4 text-blue-500" />
                {pendingCount} pending
              </span>
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {overdueCount} overdue
                </span>
              )}
            </div>

            <ScrollArea className={operatorMode ? "h-[calc(100vh-350px)]" : "h-[350px]"}>
              {Object.keys(groupedTasks).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks scheduled</p>
                  <p className="text-sm">Tasks appear automatically from bookings</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedTasks).map(([date, dateTasks]) => (
                    <div key={date}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                        {getDateLabel(date)}
                      </h4>
                      <div className="space-y-2">
                        {dateTasks.map(task => {
                          const taskTypeInfo = TASK_TYPES[task.task_type] || TASK_TYPES.custom;
                          const TaskIcon = taskTypeInfo.icon;
                          const taskColor = taskTypeInfo.color;

                          return (
                            <div
                              key={task.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                                task.completed
                                  ? "bg-muted/50 opacity-60"
                                  : isBefore(new Date(task.due_date), startOfDay(new Date()))
                                  ? "border-destructive/50 bg-destructive/5"
                                  : "hover:bg-accent/50"
                              }`}
                            >
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={(checked) => toggleTask(task.id, !!checked)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <div className={`p-1 rounded ${taskColor}`}>
                                    <TaskIcon className="h-3 w-3 text-white" />
                                  </div>
                                  <span className={`font-medium text-sm ${task.completed ? "line-through" : ""}`}>
                                    {task.title}
                                  </span>
                                  {getPriorityBadge(task.priority)}
                                </div>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {task.description}
                                  </p>
                                )}
                                {task.booking && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    📍 {task.booking.location || "No location"} • {format(new Date(task.booking.dive_date), "h:mm a")}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <ScrollArea className={operatorMode ? "h-[calc(100vh-350px)]" : "h-[350px]"}>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                  <p>No alerts</p>
                  <p className="text-sm">All equipment and inventory looks good!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts
                    .sort((a, b) => {
                      const priorityOrder = { high: 0, medium: 1, low: 2 };
                      return priorityOrder[a.priority] - priorityOrder[b.priority];
                    })
                    .map(alert => {
                      const alertIcons = {
                        maintenance: Wrench,
                        unassigned: Package,
                        shortage: AlertCircle,
                        tank_service: Gauge,
                      };
                      const AlertIcon = alertIcons[alert.type];
                      const alertColors = {
                        high: "border-destructive/50 bg-destructive/5",
                        medium: "border-yellow-500/50 bg-yellow-500/5",
                        low: "border-muted",
                      };

                      return (
                        <div
                          key={alert.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${alertColors[alert.priority]}`}
                        >
                          <div className={`p-1.5 rounded ${
                            alert.priority === "high" ? "bg-destructive" : 
                            alert.priority === "medium" ? "bg-yellow-500" : "bg-muted"
                          }`}>
                            <AlertIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-sm">{alert.title}</span>
                              {getPriorityBadge(alert.priority)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {alert.description}
                            </p>
                            {alert.dueDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                📅 {getDateLabel(alert.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
