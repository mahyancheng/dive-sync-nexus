import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, History, Edit, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export interface InventoryItem {
  id: string;
  name: string;
  asset_code: string;
  category: "boat" | "equipment" | "tank" | "other";
  status: "available" | "maintenance" | "rented" | "disposed" | "lost" | "checked-out";
  condition: "excellent" | "good" | "fair" | "poor";
  current_value: number;
  location?: string;
  next_maintenance?: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  onViewHistory: (itemId: string) => void;
  onEditItem: (itemId: string) => void;
}

export const InventoryTable = ({ items, onViewHistory, onEditItem }: InventoryTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.asset_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "maintenance": return "bg-yellow-500";
      case "rented": return "bg-blue-500";
      case "checked-out": return "bg-purple-500";
      case "disposed": return "bg-red-500";
      case "lost": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent": return "bg-green-500";
      case "good": return "bg-blue-500";
      case "fair": return "bg-yellow-500";
      case "poor": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const isMaintenanceUrgent = (date?: string) => {
    if (!date) return false;
    const daysUntil = differenceInDays(new Date(date), new Date());
    return daysUntil <= 30 && daysUntil >= 0;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or asset code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="boat">Boats</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="tank">Tanks</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Asset Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Next Maintenance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-accent/50">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {item.asset_code}
                    </code>
                  </TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell>{item.location || "—"}</TableCell>
                  <TableCell>${item.current_value.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getConditionColor(item.condition)}>
                      {item.condition}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.next_maintenance ? (
                      <span className={isMaintenanceUrgent(item.next_maintenance) ? "text-red-500 font-semibold flex items-center gap-1" : ""}>
                        {isMaintenanceUrgent(item.next_maintenance) && <AlertCircle className="w-3 h-3" />}
                        {format(new Date(item.next_maintenance), "MMM d, yyyy")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewHistory(item.id)}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditItem(item.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
