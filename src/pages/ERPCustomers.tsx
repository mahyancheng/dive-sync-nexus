import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ArrowLeft, Search, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ERPCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: centers } = await supabase
      .from("dive_centers")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!centers) return;

    // Fetch all customers who have bookings with this dive center
    const { data: bookingsData } = await supabase
      .from("dive_bookings")
      .select(`
        customer_id,
        profiles:customer_id(
          id,
          username,
          full_name,
          avatar_url,
          certifications,
          total_dives
        )
      `)
      .eq("dive_center_id", centers.id);

    if (bookingsData) {
      // Get unique customers
      const uniqueCustomers = Array.from(
        new Map(bookingsData.map(b => [b.customer_id, b.profiles])).values()
      );

      // Fetch forms for each customer
      const customersWithForms = await Promise.all(
        uniqueCustomers.map(async (customer: any) => {
          const { data: forms } = await supabase
            .from("customer_forms")
            .select("*")
            .eq("customer_id", customer.id)
            .eq("dive_center_id", centers.id);

          return {
            ...customer,
            forms: forms || []
          };
        })
      );

      setCustomers(customersWithForms);
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const needsRefresher = (customer: any) => {
    // Check if customer has no recent bookings or forms
    const pendingForms = customer.forms?.filter((f: any) => f.status === "pending").length || 0;
    return pendingForms > 0;
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
                <Users className="w-8 h-8 text-primary" />
                Customer Management
              </h1>
              <p className="text-sm text-muted-foreground">Safety forms and customer records</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search customers by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-effect border-primary/20"
            />
          </div>
        </div>

        {/* Customers List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="glass-effect">
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading customers...
              </CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card className="glass-effect">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No customers found</p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="glass-effect border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={customer.avatar_url} />
                      <AvatarFallback>
                        {customer.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold">{customer.full_name || customer.username}</h3>
                          <p className="text-sm text-muted-foreground">@{customer.username}</p>
                        </div>
                        {needsRefresher(customer) && (
                          <Badge variant="outline" className="border-orange-500 text-orange-500">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pending Forms
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Dives</p>
                          <p className="text-lg font-bold text-primary">{customer.total_dives || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Certifications</p>
                          <p className="text-lg font-bold">{customer.certifications?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Forms Status</p>
                          <div className="flex items-center gap-1 mt-1">
                            {customer.forms?.some((f: any) => f.status === "signed") ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                            <span className="text-sm font-medium">
                              {customer.forms?.filter((f: any) => f.status === "signed").length || 0}/
                              {customer.forms?.length || 0}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Actions</p>
                          <Button size="sm" variant="outline" className="mt-1 h-8">
                            <FileText className="w-3 h-3 mr-1" />
                            View Forms
                          </Button>
                        </div>
                      </div>

                      {customer.certifications && customer.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {customer.certifications.map((cert: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ERPCustomers;
