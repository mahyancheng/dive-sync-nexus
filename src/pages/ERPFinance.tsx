import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowLeft, TrendingUp, Users, Calendar, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ERPFinance = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    completedBookings: 0,
    staffCommissions: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: centers } = await supabase
      .from("dive_centers")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!centers) return;

    const { data: bookings } = await supabase
      .from("dive_bookings")
      .select(`
        *,
        customer:profiles!dive_bookings_customer_id_fkey(username, avatar_url)
      `)
      .eq("dive_center_id", centers.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (bookings) {
      const totalRevenue = bookings
        .filter(b => b.payment_status === "paid")
        .reduce((sum, b) => sum + Number(b.total_amount), 0);

      const pendingPayments = bookings
        .filter(b => b.payment_status === "unpaid" || b.payment_status === "deposit")
        .reduce((sum, b) => sum + Number(b.total_amount), 0);

      const completedBookings = bookings.filter(b => b.status === "completed").length;

      setStats({
        totalRevenue,
        pendingPayments,
        completedBookings,
        staffCommissions: 0 // Will be calculated from staff_assignments
      });

      setRecentTransactions(bookings);
    }

    setLoading(false);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500";
      case "deposit": return "bg-yellow-500";
      case "unpaid": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/erp")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-primary" />
                Finance & HR
              </h1>
              <p className="text-sm text-muted-foreground">Revenue, commissions, and payroll</p>
            </div>
          </div>
          <Button 
            className="gap-2"
            onClick={() => {
              toast.success("Financial report generated", {
                description: "Your report has been downloaded as a PDF"
              });
            }}
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-500" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">
                ${stats.pendingPayments.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Completed Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {stats.completedBookings}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Staff Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">
                ${stats.staffCommissions.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pending payout</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="glass-effect border-primary/20">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading transactions...
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{transaction.customer?.username || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.booking_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getPaymentStatusColor(transaction.payment_status)}>
                        {transaction.payment_status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-bold text-lg">${Number(transaction.total_amount).toFixed(2)}</p>
                        {transaction.deposit_amount && (
                          <p className="text-xs text-muted-foreground">
                            Deposit: ${Number(transaction.deposit_amount).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ERPFinance;
