import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  type: "booking" | "maintenance" | "work-order" | "custom";
  priority: "low" | "medium" | "high";
  bookingId?: string;
}

interface CalendarViewProps {
  events: Event[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export const CalendarView = ({ events, selectedDate, onDateSelect }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day (including multi-day events)
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = event.date;
      const eventEnd = event.endDate || event.date;
      return day >= eventStart && day <= eventEnd;
    });
  };

  // Check if this is the first day of a multi-day event
  const isEventStartDay = (event: Event, day: Date) => {
    return isSameDay(event.date, day);
  };

  // Calculate how many days an event spans from a given day
  const getEventSpanFromDay = (event: Event, day: Date) => {
    if (!event.endDate) return 1;
    
    const eventEnd = event.endDate;
    const monthEnd = endOfMonth(currentMonth);
    const effectiveEnd = eventEnd < monthEnd ? eventEnd : monthEnd;
    
    // Calculate days until end of week (Saturday) or event end
    let span = 0;
    let currentDay = new Date(day);
    const startDayOfWeek = currentDay.getDay();
    const daysUntilSaturday = 6 - startDayOfWeek;
    
    while (currentDay <= effectiveEnd && span <= daysUntilSaturday) {
      span++;
      currentDay.setDate(currentDay.getDate() + 1);
      if (currentDay > effectiveEnd) break;
    }
    
    return Math.max(1, span);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  // Fill in empty days at start of month
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  return (
    <Card className="glass-effect">
      <CardContent className="p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {/* Empty days before month starts */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar Days */}
          {daysInMonth.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            // Only show events on their start day to avoid duplicates
            const eventsToShow = dayEvents.filter(e => isEventStartDay(e, day));

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                className={`
                  relative p-3 rounded-lg border transition-all min-h-[120px] text-left overflow-visible
                  ${isCurrentDay ? "border-primary bg-primary/10" : "border-border"}
                  ${isSelected ? "ring-2 ring-primary" : ""}
                  ${!isSameMonth(day, currentMonth) ? "opacity-50" : ""}
                  hover:bg-accent
                `}
              >
                <div className="flex flex-col h-full gap-2">
                  <span className={`text-sm font-bold ${isCurrentDay ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </span>
                  
                  {/* Event List */}
                  {eventsToShow.length > 0 && (
                    <div className="space-y-1 overflow-visible">
                      {eventsToShow.slice(0, 3).map((event, idx) => {
                        const span = event.endDate ? getEventSpanFromDay(event, day) : 1;
                        const isMultiDay = event.endDate && span > 1;
                        
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1.5 rounded border-l-2 border-current truncate z-10 ${
                              isMultiDay ? 'absolute bg-primary/20 backdrop-blur-sm' : 'bg-accent/50'
                            }`}
                            style={isMultiDay ? { 
                              borderColor: `var(--${getPriorityColor(event.priority).replace('bg-', '')})`,
                              width: `calc(${span * 100}% + ${(span - 1) * 8}px)`,
                              top: `${2.5 + idx * 1.8}rem`,
                              left: '0.75rem'
                            } : {
                              borderColor: `var(--${getPriorityColor(event.priority).replace('bg-', '')})`
                            }}
                            title={event.endDate 
                              ? `${event.title} (${format(event.date, 'MMM d')} - ${format(event.endDate, 'MMM d')})`
                              : event.title
                            }
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {event.description && (
                              <div className="text-muted-foreground truncate text-[10px]">
                                {event.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {eventsToShow.length > 3 && (
                        <div className="text-[10px] text-muted-foreground font-medium mt-16">
                          +{eventsToShow.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
