import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Users, UserCheck, DollarSign, Loader2, LogIn, KeyRound, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PlatformLayout from "./PlatformLayout";
import { resetAdminPassword } from "@/lib/admin.functions";

const CompanyDetail = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState({ clients: 0, agents: 0, blockedFunds: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;

      const [companyRes, profilesRes] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
        supabase.from('profiles').select('id, blocked_balance, agent_id').eq('company_id', companyId),
      ]);

      if (companyRes.data) {
        setCompany(companyRes.data);
      }

      if (profilesRes.data) {
        const agents = new Set(profilesRes.data.map(p => p.agent_id).filter(Boolean));
        const totalBlocked = profilesRes.data.reduce((sum, p) => sum + (p.blocked_balance || 0), 0);
        setStats({
          clients: profilesRes.data.length,
          agents: agents.size,
          blockedFunds: totalBlocked,
        });
      }

      setIsLoading(false);
    };

    fetchData();
  }, [companyId]);

  const handleEnterCompany = () => {
    navigate(`/admin?viewCompany=${companyId}`);
  };

  const handleTogglePause = async () => {
    if (!companyId) return;
    const newStatus = company.status === 'paused' ? 'active' : 'paused';
    const { error } = await supabase
      .from('companies')
      .update({ status: newStatus })
      .eq('id', companyId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setCompany({ ...company, status: newStatus });
      toast({
        title: newStatus === 'paused' ? "Accès mis en pause" : "Accès réactivé",
        description: newStatus === 'paused'
          ? "Les admins et agents de cette société n'ont plus accès au panneau d'administration."
          : "Les admins et agents de cette société ont de nouveau accès.",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !company?.admin_user_id) return;
    setIsResetting(true);

    const { error } = await resetAdminPassword({
      data: { user_id: company.admin_user_id, new_password: newPassword },
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password reset", description: `Password for ${company.admin_username} has been changed.` });
      setShowResetDialog(false);
      setNewPassword("");
    }
    setIsResetting(false);
  };

  if (isLoading) {
    return (
      <PlatformLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PlatformLayout>
    );
  }

  if (!company) {
    return (
      <PlatformLayout>
        <p>Company not found</p>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/platform/companies")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Companies
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <code className="rounded bg-muted px-2 py-1 text-sm font-mono">{company.crypto_id_code}</code>
              <Badge variant={company.status === 'active' ? 'default' : company.status === 'paused' ? 'destructive' : 'secondary'}>{company.status === 'paused' ? 'En pause' : company.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={company.status === 'paused' ? 'default' : 'outline'}
              onClick={handleTogglePause}
              className={company.status === 'paused' ? '' : 'text-orange-600 border-orange-300 hover:bg-orange-50'}
            >
              {company.status === 'paused' ? (
                <><Play className="mr-2 h-4 w-4" /> Réactiver l'accès</>
              ) : (
                <><Pause className="mr-2 h-4 w-4" /> Mettre en pause</>
              )}
            </Button>
            {company.admin_user_id && (
              <Button variant="outline" onClick={() => setShowResetDialog(true)}>
                <KeyRound className="mr-2 h-4 w-4" /> Reset Password
              </Button>
            )}
            <Button onClick={handleEnterCompany}>
              <LogIn className="mr-2 h-4 w-4" /> Enter Company View
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats.clients}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Agents</CardTitle>
              <UserCheck className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats.agents}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blocked Funds</CardTitle>
              <DollarSign className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">${stats.blockedFunds.toLocaleString()}</p></CardContent>
          </Card>
        </div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{company.admin_username}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button onClick={handleResetPassword} disabled={isResetting || !newPassword} className="w-full">
              {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PlatformLayout>
  );
};

export default CompanyDetail;
