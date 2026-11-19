import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, Users, TrendingUp, DollarSign, Loader2,
  ArrowUpRight, ArrowDownRight, TicketCheck, Activity
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import PlatformLayout from "./PlatformLayout";

interface CompanyStat {
  id: string;
  name: string;
  clientCount: number;
  agentCount: number;
  blockedFunds: number;
  ticketCount: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const PlatformAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [companyStats, setCompanyStats] = useState<CompanyStat[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalClients: 0,
    totalAgents: 0,
    totalCompanies: 0,
    totalBlockedFunds: 0,
    totalTransactions: 0,
    openTickets: 0,
    kycPending: 0,
    kycApproved: 0,
  });
  const [registrationData, setRegistrationData] = useState<{ date: string; count: number }[]>([]);
  const [transactionData, setTransactionData] = useState<{ date: string; amount: number; count: number }[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);

    const [
      companiesRes,
      profilesRes,
      rolesRes,
      transactionsRes,
      ticketsRes,
    ] = await Promise.all([
      supabase.from("companies").select("id, name"),
      supabase.from("profiles").select("id, company_id, blocked_balance, kyc_status, created_at"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("transactions").select("id, amount, created_at, company_id, type"),
      supabase.from("support_tickets").select("id, company_id, status"),
    ]);

    const companies = companiesRes.data || [];
    const profiles = profilesRes.data || [];
    const roles = rolesRes.data || [];
    const transactions = transactionsRes.data || [];
    const tickets = ticketsRes.data || [];

    const clientUserIds = new Set(roles.filter(r => r.role === "client").map(r => r.user_id));
    const agentUserIds = new Set(roles.filter(r => r.role === "admin").map(r => r.user_id));

    const clientProfiles = profiles.filter(p => clientUserIds.has(p.id));
    const totalBlockedFunds = clientProfiles.reduce((sum, p) => sum + (p.blocked_balance || 0), 0);
    const kycPending = clientProfiles.filter(p => p.kyc_status === "pending").length;
    const kycApproved = clientProfiles.filter(p => p.kyc_status === "approved").length;
    const openTickets = tickets.filter(t => t.status === "open").length;

    setGlobalStats({
      totalClients: clientUserIds.size,
      totalAgents: agentUserIds.size,
      totalCompanies: companies.length,
      totalBlockedFunds: totalBlockedFunds,
      totalTransactions: transactions.length,
      openTickets,
      kycPending,
      kycApproved,
    });

    const stats: CompanyStat[] = companies.map(c => {
      const companyProfiles = profiles.filter(p => p.company_id === c.id);
      const companyClientIds = companyProfiles.filter(p => clientUserIds.has(p.id));
      const companyAgentIds = companyProfiles.filter(p => agentUserIds.has(p.id));
      const companyBlocked = companyClientIds.reduce((sum, p) => sum + (p.blocked_balance || 0), 0);
      const companyTickets = tickets.filter(t => t.company_id === c.id);

      return {
        id: c.id,
        name: c.name,
        clientCount: companyClientIds.length,
        agentCount: companyAgentIds.length,
        blockedFunds: companyBlocked,
        ticketCount: companyTickets.length,
      };
    });
    setCompanyStats(stats.sort((a, b) => b.clientCount - a.clientCount));

    const now = new Date();
    const regMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      regMap.set(d.toISOString().slice(0, 10), 0);
    }
    clientProfiles.forEach(p => {
      const day = p.created_at?.slice(0, 10);
      if (day && regMap.has(day)) regMap.set(day, (regMap.get(day) || 0) + 1);
    });
    setRegistrationData(
      Array.from(regMap.entries()).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("en-US", { day: "2-digit", month: "short" }),
        count,
      }))
    );

    const txMap = new Map<string, { amount: number; count: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      txMap.set(d.toISOString().slice(0, 10), { amount: 0, count: 0 });
    }
    transactions.forEach(t => {
      const day = t.created_at?.slice(0, 10);
      if (day && txMap.has(day)) {
        const cur = txMap.get(day)!;
        txMap.set(day, { amount: cur.amount + (t.amount || 0), count: cur.count + 1 });
      }
    });
    setTransactionData(
      Array.from(txMap.entries()).map(([date, val]) => ({
        date: new Date(date).toLocaleDateString("en-US", { day: "2-digit", month: "short" }),
        amount: val.amount,
        count: val.count,
      }))
    );

    setIsLoading(false);
  };

  const kycData = [
    { name: "Approved", value: globalStats.kycApproved },
    { name: "Pending", value: globalStats.kycPending },
    { name: "Not submitted", value: Math.max(0, globalStats.totalClients - globalStats.kycApproved - globalStats.kycPending) },
  ].filter(d => d.value > 0);

  const clientDistribution = companyStats
    .filter(c => c.clientCount > 0)
    .map(c => ({ name: c.name, value: c.clientCount }));

  if (isLoading) {
    return (
      <PlatformLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Platform performance overview</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total Clients" value={globalStats.totalClients} icon={Users} accent="text-blue-500" />
          <KpiCard title="Active Companies" value={globalStats.totalCompanies} icon={Building2} accent="text-primary" />
          <KpiCard title="Blocked Funds" value={`€${globalStats.totalBlockedFunds.toLocaleString()}`} icon={DollarSign} accent="text-orange-500" />
          <KpiCard title="Open Tickets" value={globalStats.openTickets} icon={TicketCheck} accent="text-red-500" />
        </div>

        {/* Charts */}
        <Tabs defaultValue="registrations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" /> New Registrations (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={registrationData}>
                      <defs>
                        <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" fontSize={11} tickLine={false} className="fill-muted-foreground" />
                      <YAxis allowDecimals={false} fontSize={11} tickLine={false} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#regGrad)" strokeWidth={2} name="Registrations" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" /> Transaction Volume (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transactionData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" fontSize={11} tickLine={false} className="fill-muted-foreground" />
                      <YAxis fontSize={11} tickLine={false} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number) => [`€${value.toLocaleString()}`, "Volume"]}
                      />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Volume (€)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Clients by Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {clientDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={clientDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} fontSize={11}>
                            {clientDistribution.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">KYC Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {kycData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={kycData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} fontSize={11}>
                            <Cell fill="hsl(142, 71%, 45%)" />
                            <Cell fill="hsl(48, 96%, 53%)" />
                            <Cell fill="hsl(var(--muted-foreground))" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Company Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {companyStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No companies</p>
            ) : (
              <div className="space-y-3">
                {companyStats.map((cs, i) => (
                  <div key={cs.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cs.name}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{cs.clientCount} clients</span>
                        <span>{cs.agentCount} agents</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">€{cs.blockedFunds.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{cs.ticketCount} tickets</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
};

const KpiCard = ({ title, value, icon: Icon, accent }: { title: string; value: string | number; icon: any; accent: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${accent}`} />
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

export default PlatformAnalytics;
