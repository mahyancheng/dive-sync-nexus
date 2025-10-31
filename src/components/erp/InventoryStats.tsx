import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, TrendingDown, Wrench, AlertCircle, Ship } from "lucide-react";

interface InventoryStatsProps {
  totalItems: number;
  totalValue: number;
  depreciation: number;
  maintenanceDue: number;
  checkedOut: number;
  anomalies: number;
}

export const InventoryStats = ({
  totalItems,
  totalValue,
  depreciation,
  maintenanceDue,
  checkedOut,
  anomalies
}: InventoryStatsProps) => {
  const stats = [
    {
      title: "Total Items",
      value: totalItems,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Total Value",
      value: `$${totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Depreciation",
      value: `$${depreciation.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Maintenance Due",
      value: maintenanceDue,
      icon: Wrench,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      alert: maintenanceDue > 0
    },
    {
      title: "Checked Out",
      value: checkedOut,
      icon: Ship,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Anomalies",
      value: anomalies,
      icon: AlertCircle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      alert: anomalies > 0
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="glass-effect">
          <CardContent className="p-4">
            <div className={`${stat.bgColor} p-3 rounded-lg mb-3`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.alert ? stat.color : ""}`}>
                  {stat.value}
                </p>
              </div>
              {stat.alert && (
                <AlertCircle className={`w-4 h-4 ${stat.color}`} />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
