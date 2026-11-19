import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  UserCog,
  MessageSquare,
  AlertCircle,
  ArrowUpRight,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AgentStats {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  total_clients: number;
  clients_with_actions: number;
  completed_identity: number;
  completed_sync: number;
  completed_tax: number;
  completed_insurance: number;
  completed_aml: number;
  completed_fees: number;
  completed_banking: number;
  open_tickets: number;
  avg_completion_rate: number;
}

interface GlobalStats {
  total_agents: number;
  total_clients: number;
  total_verified: number;
  total_open_tickets: number;
  avg_clients_per_agent: number;
  overall_completion_rate: number;
}

const STEP_TEMPLATES = [
  { id: 'identity_verification', label: 'Identity', shortLabel: 'ID' },
  { id: 'account_sync', label: 'Account Sync', shortLabel: 'Sync' },
  { id: 'tax_settlement', label: 'Tax', shortLabel: 'Tax' },
  { id: 'insurance_liability', label: 'Insurance', shortLabel: 'Ins.' },
  { id: 'aml_compliance', label: 'AML', shortLabel: 'AML' },
  { id: 'release_fees', label: 'Fees', shortLabel: 'Fees' },
  { id: 'banking_history', label: 'Banking', shortLabel: 'Bank' },
];

const AgentAnalytics = () => {
  const { isSuperAdmin, isCompanyAdmin, isLoading: authLoading } = useAuth();
  const hasAccess = isSuperAdmin || isCompanyAdmin;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !hasAccess) {
      navigate("/admin");
    }
  }, [authLoading, hasAccess, navigate]);

  useEffect(() => {
    if (hasAccess) {
      fetchAnalytics();
    }
  }, [hasAccess]);

  const fetchAnalytics = async () => {
    try {
      // Get all agents
      const { data: agentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      if (!agentRoles || agentRoles.length === 0) {
        setAgentStats([]);
        setGlobalStats({
          total_agents: 0,
          total_clients: 0,
          total_verified: 0,
          total_open_tickets: 0,
          avg_clients_per_agent: 0,
          overall_completion_rate: 0,
        });
        setIsLoading(false);
        return;
      }

      const agentIds = agentRoles.map(r => r.user_id);

      // Get agent profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_secure')
        .select('id, email, first_name, last_name')
        .in('id', agentIds);

      if (profilesError) throw profilesError;

      // Get all clients assigned to agents
      const { data: assignedClients, error: clientsError } = await supabase
        .from('profiles_secure')
        .select('id, agent_id')
        .in('agent_id', agentIds);

      if (clientsError) throw clientsError;

      const clientIds = (assignedClients || []).map(c => c.id);

      // Get all required actions for these clients
      let allActions: { user_id: string; template_id: string | null; status: string | null }[] = [];
      if (clientIds.length > 0) {
        const { data: actions, error: actionsError } = await supabase
          .from('required_actions')
          .select('user_id, template_id, status')
          .in('user_id', clientIds);

        if (actionsError) throw actionsError;
        allActions = actions || [];
      }

      // Get open tickets
      let openTickets: { user_id: string }[] = [];
      if (clientIds.length > 0) {
        const { data: tickets, error: ticketsError } = await supabase
          .from('support_tickets')
          .select('user_id')
          .in('user_id', clientIds)
          .eq('status', 'open');

        if (ticketsError) throw ticketsError;
        openTickets = tickets || [];
      }

      // Build stats per agent
      const stats: AgentStats[] = (profiles || []).map(agent => {
        const agentClients = (assignedClients || []).filter(c => c.agent_id === agent.id);
        const agentClientIds = agentClients.map(c => c.id);
        const agentActions = allActions.filter(a => agentClientIds.includes(a.user_id));
        const agentTickets = openTickets.filter(t => agentClientIds.includes(t.user_id));

        // Count completed steps
        const countCompleted = (templateId: string) => 
          agentActions.filter(a => a.template_id === templateId && a.status === 'completed').length;

        const completedSteps = {
          identity: countCompleted('identity_verification'),
          sync: countCompleted('account_sync'),
          tax: countCompleted('tax_settlement'),
          insurance: countCompleted('insurance_liability'),
          aml: countCompleted('aml_compliance'),
          fees: countCompleted('release_fees'),
          banking: countCompleted('banking_history'),
        };

        // Calculate average completion rate
        const totalPossibleSteps = agentClients.length * 7; // 7 possible steps per client
        const totalCompletedSteps = Object.values(completedSteps).reduce((a, b) => a + b, 0);
        const avgRate = totalPossibleSteps > 0 ? (totalCompletedSteps / totalPossibleSteps) * 100 : 0;

        // Count clients with at least one action
        const clientsWithActions = new Set(agentActions.map(a => a.user_id)).size;

        return {
          id: agent.id,
          email: agent.email,
          first_name: agent.first_name,
          last_name: agent.last_name,
          total_clients: agentClients.length,
          clients_with_actions: clientsWithActions,
          completed_identity: completedSteps.identity,
          completed_sync: completedSteps.sync,
          completed_tax: completedSteps.tax,
          completed_insurance: completedSteps.insurance,
          completed_aml: completedSteps.aml,
          completed_fees: completedSteps.fees,
          completed_banking: completedSteps.banking,
          open_tickets: agentTickets.length,
          avg_completion_rate: avgRate,
        };
      });

      // Calculate global stats
      const totalClients = stats.reduce((sum, a) => sum + a.total_clients, 0);
      const totalVerified = stats.reduce((sum, a) => sum + a.completed_sync, 0);
      const totalTickets = stats.reduce((sum, a) => sum + a.open_tickets, 0);
      const avgCompletion = stats.length > 0 
        ? stats.reduce((sum, a) => sum + a.avg_completion_rate, 0) / stats.length 
        : 0;

      setGlobalStats({
        total_agents: stats.length,
        total_clients: totalClients,
        total_verified: totalVerified,
        total_open_tickets: totalTickets,
        avg_clients_per_agent: stats.length > 0 ? totalClients / stats.length : 0,
        overall_completion_rate: avgCompletion,
      });

      // Sort by total clients descending
      stats.sort((a, b) => b.total_clients - a.total_clients);
      setAgentStats(stats);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentName = (agent: AgentStats) => {
    if (agent.first_name || agent.last_name) {
      return `${agent.first_name || ''} ${agent.last_name || ''}`.trim();
    }
    return agent.email.split('@')[0];
  };

  if (!hasAccess) {
    return null;
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Agent Performance
          </h1>
          <p className="text-muted-foreground">
            Real-time analytics on agent productivity and client progress.
          </p>
        </div>

        {/* Global Stats */}
        {globalStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{globalStats.total_agents}</div>
                <p className="text-xs text-muted-foreground">
                  {globalStats.avg_clients_per_agent.toFixed(1)} clients/agent avg
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{globalStats.total_clients}</div>
                <p className="text-xs text-muted-foreground">
                  Assigned to agents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Verified (1 ETH)</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{globalStats.total_verified}</div>
                <p className="text-xs text-muted-foreground">
                  {globalStats.total_clients > 0 
                    ? `${((globalStats.total_verified / globalStats.total_clients) * 100).toFixed(0)}% of clients`
                    : '0% of clients'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <MessageSquare className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{globalStats.total_open_tickets}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting response
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overall Completion Rate */}
        {globalStats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall Procedure Completion
              </CardTitle>
              <CardDescription>
                Average progress across all clients and all verification steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={globalStats.overall_completion_rate} className="flex-1 h-3" />
                <span className="text-2xl font-bold min-w-[60px] text-right">
                  {globalStats.overall_completion_rate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Breakdown</CardTitle>
            <CardDescription>
              Detailed performance metrics per agent with step-by-step completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agentStats.length === 0 ? (
              <div className="py-12 text-center">
                <UserCog className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No agents found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-center">Clients</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                      {STEP_TEMPLATES.map(step => (
                        <TableHead key={step.id} className="text-center text-xs">
                          {step.shortLabel}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Tickets</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentStats.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              <UserCog className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{getAgentName(agent)}</p>
                              <p className="text-xs text-muted-foreground">{agent.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="gap-1">
                            <Users className="h-3 w-3" />
                            {agent.total_clients}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {agent.clients_with_actions}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <StepBadge count={agent.completed_identity} total={agent.total_clients} />
                        </TableCell>
                        <TableCell className="text-center">
                          <StepBadge count={agent.completed_sync} total={agent.total_clients} />
                        </TableCell>
                        <TableCell className="text-center">
                          <StepBadge count={agent.completed_tax} total={agent.total_clients} />
                        </TableCell>
                        <TableCell className="text-center">
                          <StepBadge count={agent.completed_insurance} total={agent.total_clients} />
                        </TableCell>
                        <TableCell className="text-center">
                          <StepBadge count={agent.completed_aml} total={agent.total_clients} />
                        </TableCell>
                        <TableCell className="text-center">
                          <StepBadge count={agent.completed_fees} total={agent.total_clients} />
                        </TableCell>
                        <TableCell className="text-center">
                          <StepBadge count={agent.completed_banking} total={agent.total_clients} />
                        </TableCell>
                        <TableCell className="text-center">
                          {agent.open_tickets > 0 ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {agent.open_tickets}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              0
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={agent.avg_completion_rate} className="h-2 flex-1" />
                            <span className="text-xs font-medium min-w-[35px] text-right">
                              {agent.avg_completion_rate.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Step Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {STEP_TEMPLATES.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">{step.shortLabel}</Badge>
                  <span className="text-muted-foreground">{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

// Helper component for step completion badges
const StepBadge = ({ count, total }: { count: number; total: number }) => {
  if (total === 0) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }
  
  const percentage = (count / total) * 100;
  
  let variant: "default" | "secondary" | "outline" = "outline";
  if (percentage === 100) variant = "default";
  else if (percentage > 0) variant = "secondary";

  return (
    <Badge variant={variant} className="min-w-[40px] justify-center text-xs">
      {count}/{total}
    </Badge>
  );
};

export default AgentAnalytics;
