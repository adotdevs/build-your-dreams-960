import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building2, Loader2, Eye, Search, User, KeyRound, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PlatformLayout from "./PlatformLayout";
import { createCompanyAdmin } from "@/lib/admin.functions";

interface Company {
  id: string;
  name: string;
  slug: string;
  crypto_id_code: string;
  status: string;
  default_currency: string;
  admin_username: string | null;
  created_at: string;
}

const CompaniesList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    crypto_id_code: "",
    default_currency: "EUR",
    admin_username: "",
    admin_password: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setCompanies(data as Company[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreate = async () => {
    if (!newCompany.name || !newCompany.admin_username || !newCompany.admin_password) {
      toast({ title: "Error", description: "Name, username and password are required", variant: "destructive" });
      return;
    }

    setCreating(true);

    // 1. Create company first
    const { data: companyData, error: companyError } = await supabase.from('companies').insert({
      name: newCompany.name,
      slug: newCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      crypto_id_code: newCompany.crypto_id_code ? newCompany.crypto_id_code.toUpperCase() : `NIC-${Date.now()}`,
      default_currency: newCompany.default_currency,
    }).select().single();

    if (companyError) {
      toast({
        title: "Erreur",
        description: companyError.message.includes('unique') ? "Slug or Crypto ID already in use" : companyError.message,
        variant: "destructive",
      });
      setCreating(false);
      return;
    }

    // 2. Create company admin via edge function
    const { error: adminError } = await createCompanyAdmin({
      data: {
        username: newCompany.admin_username,
        password: newCompany.admin_password,
        company_id: companyData.id,
        company_name: newCompany.name,
      },
    });

    if (adminError) {
      toast({
        title: "Company created but admin error",
        description: adminError.message || "Error creating admin account",
        variant: "destructive",
      });
    } else {
      toast({ 
        title: "Company created", 
        description: `${newCompany.name} created with username "${newCompany.admin_username}"` 
      });
    }

    setShowCreate(false);
    setNewCompany({ name: "", crypto_id_code: "", default_currency: "EUR", admin_username: "", admin_password: "" });
    fetchCompanies();
    setCreating(false);
  };

  const handleDelete = async (company: Company) => {
    setDeletingId(company.id);
    try {
      const { error } = await supabase.from('companies').delete().eq('id', company.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Company deleted", description: `${company.name} has been deleted.` });
        fetchCompanies();
      }
    } catch (err) {
      toast({ title: "Error", description: "Unable to delete company", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.crypto_id_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Companies</h1>
            <p className="text-muted-foreground">Manage all companies on the platform</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Company</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Acme Trading"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Crypto Identification Number (optional)</Label>
                  <Input
                    value={newCompany.crypto_id_code}
                    onChange={(e) => setNewCompany({ ...newCompany, crypto_id_code: e.target.value })}
                    placeholder="Will be set by the company admin"
                    className="font-mono uppercase tracking-wider"
                  />
                  <p className="text-xs text-muted-foreground">
                    The company admin can define it during their first login.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Input
                    value={newCompany.default_currency}
                    onChange={(e) => setNewCompany({ ...newCompany, default_currency: e.target.value })}
                    placeholder="EUR"
                  />
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      Admin Credentials
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" /> Username
                      </Label>
                      <Input
                        value={newCompany.admin_username}
                        onChange={(e) => setNewCompany({ ...newCompany, admin_username: e.target.value })}
                        placeholder="acme_admin"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={newCompany.admin_password}
                        onChange={(e) => setNewCompany({ ...newCompany, admin_password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Company
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or crypto ID..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Crypto ID</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.admin_username ? (
                          <code className="rounded bg-muted px-2 py-1 text-xs font-mono">{company.admin_username}</code>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">{company.crypto_id_code}</code>
                      </TableCell>
                      <TableCell>{company.default_currency}</TableCell>
                      <TableCell>
                        <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                          {company.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(company.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/platform/companies/${company.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                {deletingId === company.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                              <AlertDialogTitle>Delete {company.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action is irreversible. All data linked to this company will be permanently deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(company)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No companies found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
};

export default CompaniesList;
