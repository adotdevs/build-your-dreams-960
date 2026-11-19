import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Search, Eye, Loader2, UserCog, CheckSquare, X, Trash2, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteUser, resetClientPassword } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
}

interface ClientProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  kyc_status: string | null;
  available_balance: number;
  blocked_balance: number;
  created_at: string;
  agent_id: string | null;
}

const ClientsList = () => {
  const { t } = useTranslation('admin');
  const { isSuperAdmin, isCompanyAdmin } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAgentId, setBulkAgentId] = useState<string>("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetClient, setResetClient] = useState<ClientProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const resetPassword = useServerFn(resetClientPassword);

  const canManageAgents = isSuperAdmin || isCompanyAdmin;
  const canDeleteClients = isSuperAdmin || isCompanyAdmin;


  useEffect(() => { fetchClients(); if (canManageAgents) fetchAgents(); }, [isSuperAdmin, isCompanyAdmin]);

  // Live updates: reflect profile changes (e.g. KYC submissions) immediately
  useEffect(() => {
    const channel = supabase
      .channel('admin-clients-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
        const updated = payload.new as Partial<ClientProfile> | undefined;
        if (!updated?.id) { fetchClients(); return; }
        setClients(prev => {
          const exists = prev.some(c => c.id === updated.id);
          return exists
            ? prev.map(c => c.id === updated.id ? { ...c, ...updated } as ClientProfile : c)
            : prev;
        });
        if (payload.eventType === 'UPDATE' && updated.kyc_status === 'pending' && (payload.old as any)?.kyc_status !== 'pending' && (updated as any).kyc_document_front_url) {
          toast({ title: "KYC submitted", description: `${updated.email ?? 'A client'} just finished identity verification.` });
        }
        if (payload.eventType === 'INSERT') fetchClients();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchClients = async () => {
    try {
      const { data: adminRoles, error: rolesError } = await supabase.from('user_roles').select('user_id').in('role', ['admin', 'super_admin', 'platform_owner', 'company_admin']);
      if (rolesError) throw rolesError;
      const adminIds = (adminRoles || []).map(r => r.user_id);
      const { data, error } = await supabase.from('profiles_secure').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClients((data || []).filter(p => !adminIds.includes(p.id)));
    } catch (error) { console.error('Error fetching clients:', error); } finally { setIsLoading(false); }
  };

  const fetchAgents = async () => {
    try {
      const { data: agentRoles, error: rolesError } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
      if (rolesError) throw rolesError;
      if (!agentRoles || agentRoles.length === 0) { setAgents([]); return; }
      const { data: profiles, error: profilesError } = await supabase.from('profiles_secure').select('id, email, first_name, last_name').in('id', agentRoles.map(r => r.user_id));
      if (profilesError) throw profilesError;
      setAgents(profiles || []);
    } catch (error) { console.error('Error fetching agents:', error); }
  };

  const handleDeleteClient = async (clientId: string) => {
    setDeletingId(clientId);
    try {
      const res: any = await deleteUser({ data: { user_id: clientId } });
      if (res?.error) throw new Error(res.error?.message || String(res.error));
      setClients(prev => prev.filter(c => c.id !== clientId));
      setSelectedIds(prev => { const next = new Set(prev); next.delete(clientId); return next; });
      toast({ title: "Client deleted", description: "The client account and its data have been removed." });
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({ title: "Error", description: error?.message || "Failed to delete client", variant: "destructive" });
    } finally { setDeletingId(null); }
  };


  const closePasswordReset = () => {
    setResetClient(null);
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetClient || isResetting) return;
    if (newPassword.length < 8) { setResetError("Use a password with at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setResetError("Passwords do not match."); return; }
    setIsResetting(true);
    setResetError("");
    try {
      const result = await resetPassword({ data: { user_id: resetClient.id, new_password: newPassword } });
      if (result.error) throw new Error(result.error.message);
      toast({ title: "Password reset", description: `${resetClient.email} can now sign in with the new password.` });
      closePasswordReset();
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Failed to reset password. Please try again.");
    } finally { setIsResetting(false); }
  };

  const handleAssignAgent = async (clientId: string, agentId: string | null) => {
    try {
      const { error } = await supabase.from('profiles').update({ agent_id: agentId === "unassigned" ? null : agentId }).eq('id', clientId);
      if (error) throw error;
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, agent_id: agentId === "unassigned" ? null : agentId } : c));
      toast({ title: t('clients.clientAssigned'), description: agentId === "unassigned" ? t('clients.clientUnassigned') : t('clients.clientAssignedToAgent') });
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({ title: t('clients.error'), description: t('clients.assignError'), variant: "destructive" });
    }
  };

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return null;
    return agent.first_name || agent.last_name ? `${agent.first_name || ''} ${agent.last_name || ''}`.trim() : agent.email;
  };

  const filteredClients = clients.filter((client) => {
    const s = searchQuery.toLowerCase();
    return client.email.toLowerCase().includes(s) || client.first_name?.toLowerCase().includes(s) || client.last_name?.toLowerCase().includes(s);
  });

  const toggleSelect = (id: string) => { setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };
  const toggleSelectAll = () => { selectedIds.size === filteredClients.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredClients.map(c => c.id))); };
  const clearSelection = () => { setSelectedIds(new Set()); setBulkAgentId(""); };

  const handleBulkAssign = async () => {
    if (!bulkAgentId || selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const agentValue = bulkAgentId === "unassigned" ? null : bulkAgentId;
      for (const clientId of selectedIds) { const { error } = await supabase.from('profiles').update({ agent_id: agentValue }).eq('id', clientId); if (error) throw error; }
      setClients(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, agent_id: agentValue } : c));
      toast({ title: t('clients.bulkAssignComplete'), description: t('clients.bulkAssignDesc', { count: selectedIds.size, action: agentValue ? t('clients.assigned') : t('clients.unassigned') }) });
      clearSelection();
    } catch (error) {
      console.error('Bulk assign error:', error);
      toast({ title: t('clients.error'), description: t('clients.assignError'), variant: "destructive" });
    } finally { setIsBulkProcessing(false); }
  };

  const getKycBadge = (status: string | null) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-500/10 text-green-500">{t('clients.verified')}</Badge>;
      case 'rejected': return <Badge variant="destructive">{t('clients.rejected')}</Badge>;
      default: return <Badge variant="secondary">{t('clients.pending')}</Badge>;
    }
  };

  const hasSelection = selectedIds.size > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('clients.title')}</h1>
            <p className="text-muted-foreground">{isSuperAdmin ? t('clients.subtitleAdmin') : t('clients.subtitleAgent')}</p>
          </div>
        </div>

        {hasSelection && canManageAgents && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-4 py-3">
              <Badge variant="default" className="gap-1"><CheckSquare className="h-3 w-3" />{t('clients.selected', { count: selectedIds.size })}</Badge>
              <Select value={bulkAgentId} onValueChange={setBulkAgentId}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('clients.assignToAgent')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('clients.unassign')}</SelectItem>
                  {agents.map((agent) => (<SelectItem key={agent.id} value={agent.id}>{agent.first_name || agent.last_name ? `${agent.first_name || ''} ${agent.last_name || ''}`.trim() : agent.email}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleBulkAssign} disabled={!bulkAgentId || isBulkProcessing}>
                {isBulkProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{t('clients.apply')}
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}><X className="h-4 w-4 mr-1" />{t('clients.cancel')}</Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('clients.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Badge variant="outline" className="px-4 py-2">{filteredClients.length} {t('clients.title').toLowerCase()}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredClients.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">{t('clients.noClientsFound')}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {canManageAgents && <TableHead className="w-[40px]"><Checkbox checked={selectedIds.size === filteredClients.length && filteredClients.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>}
                    <TableHead>{t('clients.client')}</TableHead>
                    <TableHead>{t('clients.email')}</TableHead>
                    <TableHead>{t('clients.kycStatus')}</TableHead>
                    {canManageAgents && <TableHead>{t('clients.assignedAgent')}</TableHead>}
                    <TableHead className="text-right">{t('clients.available')}</TableHead>
                    <TableHead className="text-right">{t('clients.blocked')}</TableHead>
                    <TableHead className="text-right">{t('clients.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className={selectedIds.has(client.id) ? "bg-primary/5" : ""}>
                      {canManageAgents && <TableCell><Checkbox checked={selectedIds.has(client.id)} onCheckedChange={() => toggleSelect(client.id)} /></TableCell>}
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.first_name || ''} {client.last_name || ''}</p>
                          <p className="text-xs text-muted-foreground">{new Date(client.created_at).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{getKycBadge(client.kyc_status)}</TableCell>
                      {canManageAgents && (
                        <TableCell>
                          <Select value={client.agent_id || "unassigned"} onValueChange={(value) => handleAssignAgent(client.id, value)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue>{client.agent_id ? (<span className="flex items-center gap-2"><UserCog className="h-3 w-3" />{getAgentName(client.agent_id)}</span>) : (<span className="text-muted-foreground">{t('clients.unassign')}</span>)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned"><span className="text-muted-foreground">{t('clients.unassign')}</span></SelectItem>
                              {agents.map((agent) => (<SelectItem key={agent.id} value={agent.id}><span className="flex items-center gap-2"><UserCog className="h-3 w-3" />{agent.first_name || agent.last_name ? `${agent.first_name || ''} ${agent.last_name || ''}`.trim() : agent.email}</span></SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      <TableCell className="text-right font-mono">€{parseFloat(client.available_balance?.toString() || '0').toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">€{parseFloat(client.blocked_balance?.toString() || '0').toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="sm" variant="outline"><Link to={`/admin/clients/${client.id}`}><Eye className="mr-2 h-4 w-4" />{t('clients.view')}</Link></Button>
                          {canManageAgents && (
                            <Button size="sm" variant="outline" title="Reset password" aria-label={`Reset password for ${client.email}`} onClick={() => { closePasswordReset(); setResetClient(client); }}>
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteClients && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={deletingId === client.id}>
                                  {deletingId === client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete client</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This permanently deletes {client.email} and all of their data. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteClient(client.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={resetClient !== null} onOpenChange={(open) => { if (!open && !isResetting) closePasswordReset(); }}>
        <DialogContent onInteractOutside={(event) => { if (isResetting) event.preventDefault(); }} onEscapeKeyDown={(event) => { if (isResetting) event.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>Reset client password</DialogTitle>
            <DialogDescription className="break-all">{resetClient?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-new-password">New password</Label>
              <Input id="client-new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required disabled={isResetting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-confirm-password">Confirm password</Label>
              <Input id="client-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required disabled={isResetting} />
            </div>
            {resetError && <p role="alert" className="text-sm text-destructive">{resetError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePasswordReset} disabled={isResetting}>Cancel</Button>
              <Button type="submit" disabled={isResetting || !newPassword || !confirmPassword}>
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Reset password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ClientsList;
