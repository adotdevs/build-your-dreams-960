import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import PlatformLayout from "./PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserCheck,
  Shield,
  Building2,
  Search,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Link2,
  CheckCircle2,
  Clock,
} from "lucide-react";

type DirectoryUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  company_id: string | null;
  company_name: string | null;
  agent_id: string | null;
  agent_name: string | null;
  agent_email: string | null;
  assigned_clients_count: number;
  kyc_status: string;
  available_balance: number;
  blocked_balance: number;
  email_verified: boolean;
  created_at: string;
};

type CompanyOption = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type AgentOption = {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  admin: "Agent",
  company_admin: "Company Admin",
  super_admin: "Super Admin",
  platform_owner: "Platform Owner",
};

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "platform_owner":
      return "bg-primary text-primary-foreground";
    case "super_admin":
      return "bg-purple-600 text-white";
    case "company_admin":
      return "bg-indigo-600 text-white";
    case "admin":
      return "bg-emerald-600 text-white";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

const PlatformUsers = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleTab, setRoleTab] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<DirectoryUser | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "client",
    company_id: "none",
    agent_id: "none",
    kyc_status: "pending",
    email_verified: true,
    new_password: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deletingUser, setDeletingUser] = useState<DirectoryUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/users", { credentials: "include" });
      const json = await res.json();
      if (json.error) {
        toast({ title: "Error", description: json.error.message, variant: "destructive" });
      } else if (json.data) {
        setUsers(json.data.users || []);
        setCompanies(json.data.companies || []);
        setAgents(json.data.agents || []);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load users directory", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const stats = useMemo(() => {
    const clients = users.filter((u) => u.role === "client");
    const agentUsers = users.filter((u) => u.role === "admin");
    const companyAdmins = users.filter((u) => u.role === "company_admin");
    const unassignedClients = clients.filter((u) => !u.agent_id);
    return {
      total: users.length,
      clients: clients.length,
      agents: agentUsers.length,
      companyAdmins: companyAdmins.length,
      unassignedClients: unassignedClients.length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleTab === "clients" && u.role !== "client") return false;
      if (roleTab === "agents" && u.role !== "admin") return false;
      if (roleTab === "company_admins" && u.role !== "company_admin") return false;
      if (roleTab === "owners" && u.role !== "platform_owner" && u.role !== "super_admin") return false;

      if (companyFilter === "unassigned" && u.company_id !== null) return false;
      if (companyFilter !== "all" && companyFilter !== "unassigned" && u.company_id !== companyFilter) return false;

      if (q) {
        const hay = [
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.company_name || "",
          u.agent_name || "",
          u.agent_email || "",
          ROLE_LABELS[u.role] || u.role,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, roleTab, companyFilter, search]);

  const openEdit = (u: DirectoryUser) => {
    setEditingUser(u);
    setEditForm({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      company_id: u.company_id || "none",
      agent_id: u.agent_id || "none",
      kyc_status: u.kyc_status || "pending",
      email_verified: u.email_verified,
      new_password: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/platform/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editingUser.id,
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone: editForm.phone,
          role: editForm.role,
          company_id: editForm.company_id === "none" ? null : editForm.company_id,
          agent_id: editForm.agent_id === "none" ? null : editForm.agent_id,
          kyc_status: editForm.kyc_status,
          email_verified: editForm.email_verified,
          ...(editForm.new_password.trim() ? { new_password: editForm.new_password.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (json.error) {
        toast({ title: "Error", description: json.error.message, variant: "destructive" });
      } else {
        toast({ title: "User updated" });
        setEditingUser(null);
        await fetchDirectory();
      }
    } catch {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/platform/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: deletingUser.id }),
      });
      const json = await res.json();
      if (json.error) {
        toast({ title: "Error", description: json.error.message, variant: "destructive" });
      } else {
        toast({ title: "User deleted", description: `${deletingUser.email} has been removed.` });
        setDeletingUser(null);
        await fetchDirectory();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const availableAgentsForEdit = useMemo(() => {
    if (!editingUser) return agents;
    return agents.filter((a) => {
      if (a.id === editingUser.id) return false;
      if (editForm.company_id !== "none" && a.company_id && a.company_id !== editForm.company_id) {
        return false;
      }
      return true;
    });
  }, [agents, editingUser, editForm.company_id]);

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Users, Admins &amp; Agents</h1>
            <p className="text-muted-foreground">
              View, edit, reassign connections, or delete any account across the entire platform
            </p>
          </div>
          <Button variant="outline" onClick={fetchDirectory} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Accounts</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.clients}</p>
              <p className="text-xs text-muted-foreground">{stats.unassignedClients} without an agent</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Agents</CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.agents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Company Admins</CardTitle>
              <Shield className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.companyAdmins}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <Tabs value={roleTab} onValueChange={setRoleTab}>
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                  <TabsTrigger value="clients">Clients ({stats.clients})</TabsTrigger>
                  <TabsTrigger value="agents">Agents ({stats.agents})</TabsTrigger>
                  <TabsTrigger value="company_admins">Company Admins ({stats.companyAdmins})</TabsTrigger>
                  <TabsTrigger value="owners">Platform Owners</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, agent..."
                    className="pl-9"
                  />
                </div>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="sm:w-52">
                    <SelectValue placeholder="Filter by company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    <SelectItem value="unassigned">No Company</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No accounts match your current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const fullName = `${u.first_name} ${u.last_name}`.trim();
                      const isSelf = currentUser?.id === u.id;
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="font-medium flex items-center gap-2">
                                {fullName || u.email}
                                {isSelf && (
                                  <Badge variant="outline" className="text-[10px]">You</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                              {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={roleBadgeVariant(u.role)}>
                              {ROLE_LABELS[u.role] || u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.company_id && u.company_name ? (
                              <Link
                                to={`/platform/companies/${u.company_id}`}
                                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                              >
                                <Building2 className="h-3.5 w-3.5" />
                                {u.company_name}
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {u.role === "client" ? (
                              u.agent_id ? (
                                <div className="text-sm">
                                  <div className="flex items-center gap-1.5 font-medium">
                                    <Link2 className="h-3.5 w-3.5 text-emerald-600" />
                                    {u.agent_name}
                                  </div>
                                  {u.agent_email && (
                                    <p className="text-xs text-muted-foreground">{u.agent_email}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No agent assigned</span>
                              )
                            ) : u.role === "admin" ? (
                              <div className="inline-flex items-center gap-1.5 text-sm">
                                <Users className="h-3.5 w-3.5 text-blue-500" />
                                <span>{u.assigned_clients_count} assigned client{u.assigned_clients_count === 1 ? "" : "s"}</span>
                              </div>
                            ) : u.role === "company_admin" ? (
                              <span className="text-xs text-muted-foreground">
                                {u.company_name ? `Manages ${u.company_name}` : "Company Admin"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Global access</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 text-xs">
                                {u.email_verified ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-emerald-700 dark:text-emerald-400">Verified</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                                    <span className="text-amber-700 dark:text-amber-400">Unverified</span>
                                  </>
                                )}
                              </span>
                              {u.role === "client" && (
                                <span className="text-xs text-muted-foreground">
                                  KYC: <span className="capitalize">{u.kyc_status}</span> · €{u.available_balance.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(u)}
                                title="Edit user and connections"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingUser(u)}
                                disabled={isSelf}
                                title={isSelf ? "You cannot delete your own account" : "Delete user"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Account &amp; Connections</DialogTitle>
            <DialogDescription>
              Update profile details, role, company, agent assignment, or password for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                  disabled={editingUser?.id === currentUser?.id}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="admin">Agent</SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="platform_owner">Platform Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>KYC Status</Label>
                <Select
                  value={editForm.kyc_status}
                  onValueChange={(v) => setEditForm({ ...editForm, kyc_status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company Connection</Label>
                <Select
                  value={editForm.company_id}
                  onValueChange={(v) => setEditForm({ ...editForm, company_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assigned Agent</Label>
                <Select
                  value={editForm.agent_id}
                  onValueChange={(v) => setEditForm({ ...editForm, agent_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Unassigned</SelectItem>
                    {availableAgentsForEdit.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({ROLE_LABELS[a.role] || a.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Email Verified</p>
                <p className="text-xs text-muted-foreground">
                  Allow sign-in when email link verification is enabled
                </p>
              </div>
              <Switch
                checked={editForm.email_verified}
                onCheckedChange={(v) => setEditForm({ ...editForm, email_verified: v })}
              />
            </div>

            <div className="space-y-2">
              <Label>Reset Password (optional)</Label>
              <Input
                type="password"
                value={editForm.new_password}
                onChange={(e) => setEditForm({ ...editForm, new_password: e.target.value })}
                placeholder="Leave blank to keep existing password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingUser?.email}</strong> ({ROLE_LABELS[deletingUser?.role || ""] || deletingUser?.role}) along with their profile, sessions, transactions, tickets, and activity logs.
              {deletingUser?.role === "admin" && deletingUser.assigned_clients_count > 0 && (
                <> Their {deletingUser.assigned_clients_count} assigned client(s) will be unassigned.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PlatformLayout>
  );
};

export default PlatformUsers;
