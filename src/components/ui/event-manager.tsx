"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, Grid3x3, List, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  color: string
  category?: string
  attendees?: string[]
  tags?: string[]
  completed?: boolean
  diveType?: string
  eventGroupId?: string
  displayOrder?: number
}

export interface EventManagerProps {
  events?: Event[]
  onEventCreate?: (event: Omit<Event, "id">) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  onEventClick?: (eventId: string) => void
  onEventReorder?: (eventId: string, newOrder: number) => void
  categories?: string[]
  colors?: { name: string; value: string; bg: string; text: string }[]
  defaultView?: "month" | "week" | "day" | "list"
  className?: string
  availableTags?: string[]
}

const defaultColors = [{ name: "Blue", value: "blue", bg: "bg-blue-500", text: "text-blue-700" }]

export function EventManager({
  events: initialEvents = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onEventClick,
  onEventReorder,
  defaultView = "month",
  className,
}: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day" | "list">(defaultView)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({ title: "", startTime: undefined, endTime: undefined, color: "blue", completed: false })

  // Sync with external events prop
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  const filteredEvents = useMemo(() => events.slice().sort((a,b)=> {
    // First sort by display order, then by start time
    const orderA = a.displayOrder ?? 0;
    const orderB = b.displayOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.startTime.getTime()-b.startTime.getTime();
  }), [events])

  const navigateDate = (dir: "prev" | "next") => {
    setCurrentDate((d) => {
      const n = new Date(d)
      if (view === "month") n.setMonth(n.getMonth() + (dir === "next" ? 1 : -1))
      else if (view === "week") n.setDate(n.getDate() + (dir === "next" ? 7 : -7))
      else n.setDate(n.getDate() + (dir === "next" ? 1 : -1))
      return n
    })
  }

  const timeInputValue = (d?: Date) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16) : "")

  const handleCreate = useCallback(() => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return
    const ev: Event = { 
      id: Math.random().toString(36).slice(2,11), 
      title: newEvent.title, 
      description: newEvent.description || "", 
      startTime: newEvent.startTime, 
      endTime: newEvent.endTime, 
      color: newEvent.color || "blue",
      completed: false,
      diveType: newEvent.diveType,
      eventGroupId: newEvent.eventGroupId
    }
    setEvents((p)=>[...p, ev]); onEventCreate?.(ev)
    setIsDialogOpen(false); setIsCreating(false); setNewEvent({ title: "", color: "blue", completed: false })
  }, [newEvent, onEventCreate])

  const handleSave = useCallback(() => {
    if (!selectedEvent) return
    setEvents((p)=>p.map((e)=>e.id===selectedEvent.id?selectedEvent:e))
    onEventUpdate?.(selectedEvent.id, selectedEvent)
    setIsDialogOpen(false); setSelectedEvent(null)
  }, [selectedEvent, onEventUpdate])

  const handleDelete = (id: string) => {
    setEvents((p)=>p.filter((e)=>e.id!==id)); onEventDelete?.(id)
    setIsDialogOpen(false); setSelectedEvent(null)
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => navigateDate("next")} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
          <Button variant={view==="month"?"secondary":"ghost"} size="sm" onClick={()=>setView("month")} className="h-8"><Calendar className="h-4 w-4"/><span className="ml-1">Month</span></Button>
          <Button variant={view==="week"?"secondary":"ghost"} size="sm" onClick={()=>setView("week")} className="h-8"><Grid3x3 className="h-4 w-4"/><span className="ml-1">Week</span></Button>
          <Button variant={view==="day"?"secondary":"ghost"} size="sm" onClick={()=>setView("day")} className="h-8"><Clock className="h-4 w-4"/><span className="ml-1">Day</span></Button>
          <Button variant={view==="list"?"secondary":"ghost"} size="sm" onClick={()=>setView("list")} className="h-8"><List className="h-4 w-4"/><span className="ml-1">List</span></Button>
        </div>
        <Button onClick={()=>{ setIsCreating(true); setIsDialogOpen(true) }}><Plus className="mr-2 h-4 w-4"/>New Event</Button>
      </div>

      {/* Views */}
      {view==="month" && <MonthView currentDate={currentDate} events={filteredEvents} onEventClick={(e)=>{onEventClick?.(e.id)}} onEventReorder={onEventReorder} />}
      {view==="week" && <WeekView currentDate={currentDate} events={filteredEvents} onEventClick={(e)=>{onEventClick?.(e.id)}} />}
      {view==="day" && <DayView currentDate={currentDate} events={filteredEvents} onEventClick={(e)=>{onEventClick?.(e.id)}} />}
      {view==="list" && <ListView events={filteredEvents} onEventClick={(e)=>{onEventClick?.(e.id)}} />}
    </div>
  )
}

/* Helpers */
function sameDay(a: Date, b: Date){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate() }
function fmtTime(d: Date){ return d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}) }

/* Month */
function MonthView({ currentDate, events, onEventClick, onEventReorder }: { currentDate: Date; events: Event[]; onEventClick: (e: Event)=>void; onEventReorder?: (eventId: string, newOrder: number) => void }) {
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  
  const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const start = new Date(first); start.setDate(start.getDate() - start.getDay())
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate()+i))

  const handleDragStart = (e: React.DragEvent, event: Event) => {
    setDraggedEvent(event)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetEvent: Event, dayEvents: Event[]) => {
    e.preventDefault()
    if (!draggedEvent || !onEventReorder) return
    if (!sameDay(draggedEvent.startTime, targetEvent.startTime)) return // Only reorder within same day
    
    const targetIndex = dayEvents.findIndex(ev => ev.id === targetEvent.id)
    onEventReorder(draggedEvent.id, targetIndex)
    setDraggedEvent(null)
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d)=> <div key={d} className="p-2 text-center text-xs font-medium border-r last:border-r-0">{d}</div>)}</div>
      <div className="grid grid-cols-7">
        {days.map((d,i)=>{
          const dayEvents = events.filter((e)=> sameDay(e.startTime, d)).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          const isToday = sameDay(d, new Date())
          const inMonth = d.getMonth()===currentDate.getMonth()
          return (
            <div key={i} className={cn("min-h-24 p-2 border-b border-r last:border-r-0", !inMonth && "bg-muted/30")}>
              <div className={cn("mb-1 h-6 w-6 flex items-center justify-center rounded-full text-xs", isToday && "bg-primary text-primary-foreground font-semibold")}>{d.getDate()}</div>
              <div className="space-y-1">
                {dayEvents.slice(0,3).map((e)=> (
                  <div
                    key={e.id}
                    draggable={!!onEventReorder}
                    onDragStart={(ev) => handleDragStart(ev, e)}
                    onDragOver={handleDragOver}
                    onDrop={(ev) => handleDrop(ev, e, dayEvents)}
                    className={cn(
                      "w-full truncate rounded px-2 py-1 text-left text-[11px] relative cursor-pointer flex items-center gap-1",
                      e.color === "red" && "bg-red-500 text-white",
                      e.color === "blue" && "bg-blue-500 text-white",
                      e.color === "green" && "bg-green-500 text-white",
                      e.color === "yellow" && "bg-yellow-500 text-black",
                      e.color === "purple" && "bg-purple-500 text-white",
                      e.color === "orange" && "bg-orange-500 text-white",
                      e.completed && "opacity-50 line-through",
                      draggedEvent?.id === e.id && "opacity-50"
                    )}
                    onClick={()=>onEventClick(e)}
                  >
                    {onEventReorder && <GripVertical className="w-3 h-3 flex-shrink-0 cursor-grab" />}
                    <span className="truncate">
                      {e.completed && "✓ "}
                      {e.title}
                      {e.eventGroupId && <span className="ml-1 text-[9px]">📅</span>}
                    </span>
                  </div>
                ))}
                {dayEvents.length>3 && <div className="text-[10px] text-muted-foreground">+{dayEvents.length-3} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* Week */
function WeekView({ currentDate, events, onEventClick }: { currentDate: Date; events: Event[]; onEventClick: (e: Event)=>void }) {
  const start = new Date(currentDate); start.setDate(currentDate.getDate() - currentDate.getDay())
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate()+i); return d })
  const hours = Array.from({ length: 24 }, (_, i)=>i)
  return (
    <Card className="overflow-auto">
      <div className="grid grid-cols-8 border-b">
        <div className="p-2 text-xs border-r">Time</div>
        {days.map((d)=> <div key={d.toISOString()} className="p-2 text-center text-xs border-r last:border-r-0">{d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>)}
      </div>
      <div className="grid grid-cols-8">
        {hours.map((h)=> (
          <div key={h} className="contents">
            <div className="border-b border-r p-2 text-[11px] text-muted-foreground">{String(h).padStart(2,"0")}:00</div>
            {days.map((d)=> {
              const ev = events.filter((e)=> sameDay(e.startTime, d) && e.startTime.getHours()===h)
              return (
                <div key={`${d.toISOString()}-${h}`} className="min-h-16 border-b border-r last:border-r-0 p-1">
                  {ev.map((e)=> (
                    <button 
                      key={e.id} 
                      onClick={()=>onEventClick(e)} 
                      className={cn(
                        "w-full truncate rounded px-2 py-1 text-left text-[11px] mb-1",
                        e.color === "red" && "bg-red-500 text-white",
                        e.color === "blue" && "bg-blue-500 text-white",
                        e.color === "green" && "bg-green-500 text-white",
                        e.color === "yellow" && "bg-yellow-500 text-black",
                        e.color === "purple" && "bg-purple-500 text-white",
                        e.color === "orange" && "bg-orange-500 text-white",
                        e.completed && "opacity-50 line-through"
                      )}
                    >
                      {e.completed && "✓ "}{e.title}{e.eventGroupId && " 📅"}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}

/* Day */
function DayView({ currentDate, events, onEventClick }: { currentDate: Date; events: Event[]; onEventClick: (e: Event)=>void }) {
  const hours = Array.from({ length: 24 }, (_, i)=>i)
  return (
    <Card className="overflow-auto">
      {hours.map((h)=> {
        const slot = events.filter((e)=> sameDay(e.startTime, currentDate) && e.startTime.getHours()===h)
        return (
          <div key={h} className="flex border-b">
            <div className="w-20 border-r p-3 text-sm text-muted-foreground">{String(h).padStart(2,"0")}:00</div>
            <div className="flex-1 p-2">
              {slot.map((e)=> (
                <button 
                  key={e.id} 
                  onClick={()=>onEventClick(e)} 
                  className={cn(
                    "mb-2 w-full rounded border px-2 py-2 text-left",
                    e.completed && "opacity-50"
                  )}
                >
                  <div className={cn("text-sm font-medium flex items-center gap-1", e.completed && "line-through")}>
                    {e.completed && "✓ "}{e.title}
                    {e.eventGroupId && <span className="text-[10px]">📅</span>}
                    {e.diveType && <span className="text-[10px] px-1 rounded bg-accent">{e.diveType}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{fmtTime(e.startTime)} - {fmtTime(e.endTime)}</div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </Card>
  )
}

/* List */
function ListView({ events, onEventClick }: { events: Event[]; onEventClick: (e: Event)=>void }) {
  const sorted = [...events].sort((a,b)=>a.startTime.getTime()-b.startTime.getTime())
  const groups = sorted.reduce<Record<string, Event[]>>((acc, e) => {
    const key = e.startTime.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})
    ;(acc[key] ||= []).push(e); return acc
  }, {})
  return (
    <Card className="p-4">
      {Object.entries(groups).map(([date, items])=> (
        <div key={date} className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{date}</h3>
          <div className="space-y-2">
            {items.map((e)=> (
              <button 
                key={e.id} 
                onClick={()=>onEventClick(e)} 
                className={cn(
                  "w-full rounded-lg border bg-card p-3 text-left hover:shadow-sm",
                  e.completed && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("font-semibold flex items-center gap-2", e.completed && "line-through")}>
                    {e.completed && "✓"}
                    <span>{e.title}</span>
                    {e.eventGroupId && (
                      <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground" title="Multi-day event">
                        📅
                      </span>
                    )}
                    {e.diveType && (
                      <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-accent">
                        {e.diveType}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{fmtTime(e.startTime)} - {fmtTime(e.endTime)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
      {!sorted.length && <div className="py-10 text-center text-sm text-muted-foreground">No events found</div>}
    </Card>
  )
}
