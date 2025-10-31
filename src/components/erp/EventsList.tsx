import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Clock, MapPin, AlertCircle } from "lucide-react";
import { format, isFuture, isPast, isToday } from "date-fns";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  type: "booking" | "maintenance" | "work-order" | "custom";
  priority: "low" | "medium" | "high";
  bookingId?: string;
}

interface EventsListProps {
  events: Event[];
  onEventClick: (eventId: string) => void;
  selectedDate: Date | null;
}

export const EventsList = ({ events, onEventClick, selectedDate }: EventsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !event.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Time filter
      if (timeFilter === "today" && !isToday(event.date)) return false;
      if (timeFilter === "upcoming" && !isFuture(event.date)) return false;
      if (timeFilter === "past" && !isPast(event.date)) return false;

      // Type filter
      if (typeFilter !== "all" && event.type !== typeFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && event.priority !== priorityFilter) return false;

      // Selected date filter
      if (selectedDate && format(event.date, "yyyy-MM-dd") !== format(selectedDate, "yyyy-MM-dd")) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, timeFilter, typeFilter, priorityFilter, selectedDate]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking": return "border-blue-500 text-blue-500";
      case "maintenance": return "border-orange-500 text-orange-500";
      case "work-order": return "border-purple-500 text-purple-500";
      case "custom": return "border-green-500 text-green-500";
      default: return "border-gray-500 text-gray-500";
    }
  };

  const upcomingCount = events.filter(e => isFuture(e.date)).length;
  const highPriorityCount = events.filter(e => e.priority === "high").length;
  const todayCount = events.filter(e => isToday(e.date)).length;

  return (
    <Card className="glass-effect h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Events
        </CardTitle>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 bg-blue-500/10 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">{upcomingCount}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </div>
          <div className="text-center p-2 bg-red-500/10 rounded-lg">
            <div className="text-2xl font-bold text-red-500">{highPriorityCount}</div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
          <div className="text-center p-2 bg-green-500/10 rounded-lg">
            <div className="text-2xl font-bold text-green-500">{todayCount}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSearchQuery("");
              setTimeFilter("all");
              setTypeFilter("all");
              setPriorityFilter("all");
            }}
            title="Clear all filters"
          >
            <AlertCircle className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="booking">Bookings</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="work-order">Work Orders</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No events found</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick(event.id)}
                className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm">{event.title}</h4>
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`} />
                </div>
                
                {event.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(event.date, "MMM d, yyyy")}
                    {event.time && ` ${event.time}`}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </div>
                  )}
                </div>
                
                <Badge variant="outline" className={`mt-2 ${getTypeColor(event.type)}`}>
                  {event.type}
                </Badge>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
