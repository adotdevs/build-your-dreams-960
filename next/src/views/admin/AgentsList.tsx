import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Loader2, UserCog, Trash2, Users, CheckCircle, MessageSquare, Shield, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ALL_PERMISSION_KEYS, getAccessLevel, getAccessBadgeProps } from "@/data/agentPermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createAgent, resetAdminPassword } from "@/lib/admin.functions";
import {
  AlertDialog,

  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Agent {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  client_count: number;
  verified_clients: number;
  open_tickets: number;
  access_level: string;
  access_badge: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
}

const AgentsList = () => {
  const { isSuperAdmin, isCompanyAdmin, isLoading: authLoading } = useAuth();
  const hasAccess = isSuperAdmin || isCompanyAdmin;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAgentUsername, setNewAgentUsername] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentFirstName, setNewAgentFirstName] = useState("");
  const [newAgentLastName, setNewAgentLastName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Password reset state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetAgentId, setResetAgentId] = useState<string | null>(null);
  const [resetAgentName, setResetAgentName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
const MIN_PASSWORD_LENGTH = 1;

  useEffect(() => {
    if (!authLoading && !hasAccess) {
      navigate("/admin");
    }
  }, [authLoading, hasAccess, navigate]);

  useEffect(() => {
    if (hasAccess) {
      fetchAgents();
    }
  }, [hasAccess]);

  const fetchAgents = async () => {
    try {
      // Get all agents (users with 'admin' role)
      const { data: agentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      if (!agentRoles || agentRoles.length === 0) {
        setAgents([]);
        setIsLoading(false);
        return;
      }

      const agentIds = agentRoles.map(r => r.user_id);

      // Get agent profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_secure')
        .select('id, email, first_name, last_name, created_at')
        .in('id', agentIds);

      if (profilesError) throw profilesError;

      // Get all clients assigned to these agents
      const { data: assignedClients, error: clientsError } = await supabase
        .from('profiles_secure')
        .select('id, agent_id')
        .in('agent_id', agentIds);

      if (clientsError) throw clientsError;

      // Get completed Account Synchronization actions (template_id = 'account_sync' and status = 'completed')
      const clientIds = (assignedClients || []).map(c => c.id);
      
      let completedActions: { user_id: string }[] = [];
      if (clientIds.length > 0) {
        const { data: actions, error: actionsError } = await supabase
          .from('required_actions')
          .select('user_id')
          .in('user_id', clientIds)
          .eq('template_id', 'account_sync')
          .eq('status', 'completed');

        if (actionsError) throw actionsError;
        completedActions = actions || [];
      }

      // Get open support tickets for assigned clients
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
      const clientCountMap = new Map<string, number>();
      const clientsByAgent = new Map<string, string[]>();
      
      (assignedClients || []).forEach(c => {
        if (c.agent_id) {
          clientCountMap.set(c.agent_id, (clientCountMap.get(c.agent_id) || 0) + 1);
          const existing = clientsByAgent.get(c.agent_id) || [];
          existing.push(c.id);
          clientsByAgent.set(c.agent_id, existing);
        }
      });

      // Count verified clients per agent
      const verifiedCountMap = new Map<string, number>();
      completedActions.forEach(action => {
        // Find which agent this client belongs to
        const client = assignedClients?.find(c => c.id === action.user_id);
        if (client?.agent_id) {
          verifiedCountMap.set(client.agent_id, (verifiedCountMap.get(client.agent_id) || 0) + 1);
        }
      });

      // Count open tickets per agent
      const ticketCountMap = new Map<string, number>();
      openTickets.forEach(ticket => {
        // Find which agent this client belongs to
        const client = assignedClients?.find(c => c.id === ticket.user_id);
        if (client?.agent_id) {
          ticketCountMap.set(client.agent_id, (ticketCountMap.get(client.agent_id) || 0) + 1);
        }
      });

      // Fetch permissions for all agents
      const { data: allPerms } = await supabase
        .from('agent_permissions')
        .select('agent_id, permission_key, enabled')
        .in('agent_id', agentIds);

      const permsByAgent = new Map<string, Record<string, boolean>>();
      agentIds.forEach(id => {
        const permsMap: Record<string, boolean> = {};
        ALL_PERMISSION_KEYS.forEach(k => { permsMap[k] = false; });
        permsByAgent.set(id, permsMap);
      });
      (allPerms || []).forEach(row => {
        const map = permsByAgent.get(row.agent_id);
        if (map) map[row.permission_key] = row.enabled;
      });

      const agentsWithStats: Agent[] = (profiles || []).map(p => {
        const perms = permsByAgent.get(p.id) || {};
        const level = getAccessLevel(perms);
        const badge = getAccessBadgeProps(level);
        return {
          ...p,
          client_count: clientCountMap.get(p.id) || 0,
          verified_clients: verifiedCountMap.get(p.id) || 0,
          open_tickets: ticketCountMap.get(p.id) || 0,
          access_level: level,
          access_badge: badge,
        };
      });

      setAgents(agentsWithStats);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgentUsername || !newAgentPassword) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const agentEmail = newAgentUsername.includes('@') ? newAgentUsername : `${newAgentUsername}@cryptogen.internal`;
      
      // Call edge function to create agent without affecting current session
      const { error } = await createAgent({
        data: {
          email: agentEmail,
          password: newAgentPassword,
          first_name: newAgentFirstName,
          last_name: newAgentLastName,
        },
      });

      if (error) throw new Error(error.message);

      toast({
        title: "Agent created",
        description: `Agent ${newAgentUsername} has been created successfully`,
      });

      setIsAddDialogOpen(false);
      setNewAgentUsername("");
      setNewAgentPassword("");
      setNewAgentFirstName("");
      setNewAgentLastName("");
      fetchAgents();
    } catch (error: any) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create agent",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      // First, unassign all clients from this agent
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ agent_id: null })
        .eq('agent_id', agentId);

      if (updateError) throw updateError;

      // Change role back to client (we can't delete users via client SDK)
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'client' })
        .eq('user_id', agentId);

      if (roleError) throw roleError;

      toast({
        title: "Agent removed",
        description: "The agent has been demoted to client and their clients have been unassigned",
      });

      fetchAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: "Error",
        description: "Failed to remove agent",
        variant: "destructive",
      });
    }
  };

  const extractEdgeErrorMessage = async (err: any): Promise<string> => {
    try {
      if (err?.context) {
        const body = await err.context.json();
        if (body?.error) return body.error;
      }
    } catch {
      // ignore JSON parse errors
    }
    return err?.message || "Failed to reset password";
  };

  const handleResetPassword = async () => {
    const normalizedPassword = newPassword.trim();

    if (!resetAgentId || !normalizedPassword) {
      toast({ title: "Error", description: "Password is required", variant: "destructive" });
      return;
    }

    if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: "Error",
        description: `Password must contain at least ${MIN_PASSWORD_LENGTH} characters`,
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await resetAdminPassword({
        data: { user_id: resetAgentId, new_password: normalizedPassword },
      });
      if (error) throw new Error(error.message);
      toast({ title: "Password updated", description: `Password for ${resetAgentName} has been reset successfully.` });
      setResetDialogOpen(false);
      setNewPassword("");
      setResetAgentId(null);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      const message = await extractEdgeErrorMessage(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      agent.email.toLowerCase().includes(searchLower) ||
      agent.first_name?.toLowerCase().includes(searchLower) ||
      agent.last_name?.toLowerCase().includes(searchLower)
    );
  });

  if (!hasAccess) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agents</h1>
            <p className="text-muted-foreground">
              Manage your team of agents and their client assignments.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
                <DialogDescription>
                  Create a new agent account. They will receive access to manage assigned clients.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newAgentFirstName}
                      onChange={(e) => setNewAgentFirstName(e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newAgentLastName}
                      onChange={(e) => setNewAgentLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    value={newAgentUsername}
                    onChange={(e) => setNewAgentUsername(e.target.value)}
                    placeholder="agent_username"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The agent will log in with this username. The suffix @cryptogen.internal will be added automatically.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAgentPassword}
                    onChange={(e) => setNewAgentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAgent} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Agent"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="outline" className="px-4 py-2">
                {filteredAgents.length} agents
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="py-12 text-center">
                <UserCog className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No agents found.</p>
                <p className="text-sm text-muted-foreground">Create your first agent to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Clients</TableHead>
                    <TableHead className="text-center">Verified (1 ETH)</TableHead>
                    <TableHead className="text-center">Open Tickets</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <UserCog className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {agent.first_name || ''} {agent.last_name || ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{agent.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {agent.client_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={agent.verified_clients > 0 ? "default" : "outline"} className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {agent.verified_clients}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={agent.open_tickets > 0 ? "destructive" : "outline"} className="gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {agent.open_tickets}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.access_badge.variant}>
                          {agent.access_badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/agents/${agent.id}/permissions`)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Permissions
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setResetAgentId(agent.id);
                              setResetAgentName(`${agent.first_name || ''} ${agent.last_name || ''}`.trim() || agent.email);
                              setNewPassword("");
                              setResetDialogOpen(true);
                            }}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Password
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Agent</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will demote the agent to a regular client and unassign all their clients. 
                                  The account will remain active but without admin access.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAgent(agent.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove Agent
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reset Password Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Agent Password</DialogTitle>
              <DialogDescription>
                Set a new password for {resetAgentName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={MIN_PASSWORD_LENGTH}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={isResetting || newPassword.trim().length < MIN_PASSWORD_LENGTH}>
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AgentsList;
