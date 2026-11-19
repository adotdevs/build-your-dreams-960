import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, UserCheck, DollarSign, Loader2 } from "lucide-react";
import PlatformLayout from "./PlatformLayout";

const PlatformDashboard = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalClients: 0,
    totalAgents: 0,
    totalBlocked: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [companiesRes, clientsRes, agentsRes, blockedRes] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('profiles').select('blocked_balance'),
      ]);

      const totalBlocked = blockedRes.data?.reduce((sum, p) => sum + (p.blocked_balance || 0), 0) || 0;

      setStats({
        totalCompanies: companiesRes.count || 0,
        totalClients: clientsRes.count || 0,
        totalAgents: agentsRes.count || 0,
        totalBlocked: totalBlocked,
      });
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const cards = [
    { title: "Companies", value: stats.totalCompanies, icon: Building2, color: "text-primary" },
    { title: "Total Clients", value: stats.totalClients, icon: Users, color: "text-blue-500" },
    { title: "Total Agents", value: stats.totalAgents, icon: UserCheck, color: "text-green-500" },
    { title: "Total Blocked Funds", value: `€${stats.totalBlocked.toLocaleString()}`, icon: DollarSign, color: "text-orange-500" },
  ];

  return (
    <PlatformLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest">
              PLATFORM OWNER
            </span>
          </div>
          <h1 className="text-3xl font-bold">Platform Dashboard</h1>
          <p className="text-muted-foreground">Global overview of all companies and operations</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PlatformLayout>
  );
};

export default PlatformDashboard;
