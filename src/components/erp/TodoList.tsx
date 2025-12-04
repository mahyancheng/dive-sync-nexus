import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isTomorrow, addDays, isBefore, startOfDay } from "date-fns";
import { CheckCircle2, Circle, AlertTriangle, Package, Anchor, Users, ClipboardList, Plus, RefreshCw } from "lucide-react";
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

interface TodoListProps {
  diveCenterId: string;
  operatorMode?: boolean;
  selectedDate?: Date;
  onRefresh?: () => void;
}

const TASK_TYPES = {
  equipment_prep: { label: "Equipment Prep", icon: Package, color: "bg-blue-500" },
  tank_fill: { label: "Tank Fill", icon: Anchor, color: "bg-cyan-500" },
  boat_prep: { label: "Boat Prep", icon: Anchor, color: "bg-indigo-500" },
  briefing: { label: "Briefing", icon: Users, color: "bg-green-500" },
  checkout: { label: "Checkout", icon: ClipboardList, color: "bg-orange-500" },
  custom: { label: "Custom", icon: Circle, color: "bg-gray-500" },
};

export function TodoList({ diveCenterId, operatorMode = false, selectedDate, onRefresh }: TodoListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [diveCenterId, selectedDate]);

  const fetchTasks = async () => {
    try {
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
  };

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

  const generateTasksForBookings = async () => {
    setGenerating(true);
    try {
      // Get upcoming bookings without tasks
      const targetDate = selectedDate || new Date();
      const startDate = format(startOfDay(targetDate), "yyyy-MM-dd'T'HH:mm:ss");
      const endDate = format(addDays(targetDate, 7), "yyyy-MM-dd'T'HH:mm:ss");

      const { data: bookings, error: bookingsError } = await supabase
        .from("dive_bookings")
        .select("id, group_name, dive_date, location, participants_count")
        .eq("dive_center_id", diveCenterId)
        .gte("dive_date", startDate)
        .lte("dive_date", endDate);

      if (bookingsError) throw bookingsError;

      // Get existing tasks to avoid duplicates
      const { data: existingTasks } = await supabase
        .from("booking_tasks")
        .select("booking_id, task_type")
        .eq("dive_center_id", diveCenterId);

      const existingTaskMap = new Set(
        existingTasks?.map(t => `${t.booking_id}-${t.task_type}`) || []
      );

      const newTasks: any[] = [];

      for (const booking of bookings || []) {
        const diveDate = new Date(booking.dive_date);
        const prepDate = format(addDays(diveDate, -1), "yyyy-MM-dd");
        const dayOfDate = format(diveDate, "yyyy-MM-dd");

        // Equipment prep task (day before)
        if (!existingTaskMap.has(`${booking.id}-equipment_prep`)) {
          newTasks.push({
            dive_center_id: diveCenterId,
            booking_id: booking.id,
            task_type: "equipment_prep",
            title: `Prepare equipment for ${booking.group_name || "dive trip"}`,
            description: `Check and prepare ${booking.participants_count} sets of equipment`,
            due_date: prepDate,
            priority: 2,
          });
        }

        // Tank fill task (day before)
        if (!existingTaskMap.has(`${booking.id}-tank_fill`)) {
          newTasks.push({
            dive_center_id: diveCenterId,
            booking_id: booking.id,
            task_type: "tank_fill",
            title: `Fill tanks for ${booking.group_name || "dive trip"}`,
            description: `Ensure tanks are filled for ${booking.participants_count} divers`,
            due_date: prepDate,
            priority: 3,
          });
        }

        // Boat prep task (day of)
        if (!existingTaskMap.has(`${booking.id}-boat_prep`)) {
          newTasks.push({
            dive_center_id: diveCenterId,
            booking_id: booking.id,
            task_type: "boat_prep",
            title: `Prepare boat for ${booking.group_name || "dive trip"}`,
            description: `Load equipment and supplies for trip to ${booking.location || "dive site"}`,
            due_date: dayOfDate,
            priority: 3,
          });
        }

        // Briefing task (day of)
        if (!existingTaskMap.has(`${booking.id}-briefing`)) {
          newTasks.push({
            dive_center_id: diveCenterId,
            booking_id: booking.id,
            task_type: "briefing",
            title: `Conduct briefing for ${booking.group_name || "dive trip"}`,
            description: `Safety briefing and dive plan for ${booking.participants_count} participants`,
            due_date: dayOfDate,
            priority: 2,
          });
        }

        // Checkout task (day of)
        if (!existingTaskMap.has(`${booking.id}-checkout`)) {
          newTasks.push({
            dive_center_id: diveCenterId,
            booking_id: booking.id,
            task_type: "checkout",
            title: `Checkout: ${booking.group_name || "dive trip"}`,
            description: `Verify equipment return and complete paperwork`,
            due_date: dayOfDate,
            priority: 1,
          });
        }
      }

      if (newTasks.length > 0) {
        const { error } = await supabase.from("booking_tasks").insert(newTasks);
        if (error) throw error;
        toast.success(`Generated ${newTasks.length} new tasks`);
        fetchTasks();
      } else {
        toast.info("No new tasks to generate");
      }
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast.error("Failed to generate tasks");
    } finally {
      setGenerating(false);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateTasksForBookings}
              disabled={generating}
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Generate Tasks
            </Button>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground mt-2">
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
      </CardHeader>
      <CardContent>
        <ScrollArea className={operatorMode ? "h-[calc(100vh-300px)]" : "h-[400px]"}>
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tasks scheduled</p>
              <p className="text-sm">Click "Generate Tasks" to create tasks from bookings</p>
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
                      const TaskIcon = TASK_TYPES[task.task_type as keyof typeof TASK_TYPES]?.icon || Circle;
                      const taskColor = TASK_TYPES[task.task_type as keyof typeof TASK_TYPES]?.color || "bg-gray-500";

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
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`p-1 rounded ${taskColor}`}>
                                <TaskIcon className="h-3 w-3 text-white" />
                              </div>
                              <span className={`font-medium ${task.completed ? "line-through" : ""}`}>
                                {task.title}
                              </span>
                              {getPriorityBadge(task.priority)}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground truncate">
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
      </CardContent>
    </Card>
  );
}
