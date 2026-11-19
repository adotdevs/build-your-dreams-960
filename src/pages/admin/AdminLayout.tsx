import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Loader2,
  MessageSquare,
  BarChart3,
  FileText,
  Settings,
  PauseCircle
} from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t } = useTranslation('admin');
  const { user, signOut, isAdmin, isSuperAdmin, isPlatformOwner, isCompanyAdmin, isLoading, companyId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [companyPaused, setCompanyPaused] = useState(false);
  const [checkingPause, setCheckingPause] = useState(true);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.first_name || data?.last_name) {
            setDisplayName(`${data.first_name || ''} ${data.last_name || ''}`.trim());
          }
        });
    }
  }, [user]);

  // Check if company is paused (skip for platform owners)
  useEffect(() => {
    if (isPlatformOwner || !companyId) {
      setCompanyPaused(false);
      setCheckingPause(false);
      return;
    }
    
    const check = async () => {
      const { data } = await supabase
        .from('companies')
        .select('status')
        .eq('id', companyId)
        .maybeSingle();
      
      setCompanyPaused(data?.status === 'paused');
      setCheckingPause(false);
    };
    check();
  }, [companyId, isPlatformOwner]);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading || checkingPause) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  // Show paused screen for company admins/agents
  if (companyPaused) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <PauseCircle className="h-10 w-10 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Accès temporairement suspendu</h1>
          <p className="text-muted-foreground">
            L'accès administrateur de votre société a été mis en pause. Les clients peuvent toujours accéder à leur espace personnel.
          </p>
          <p className="text-sm text-muted-foreground">
            Contactez le support de la plateforme pour plus d'informations ou pour réactiver votre accès.
          </p>
          <Button variant="outline" onClick={async () => { await signOut(); navigate("/login"); }}>
            <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  const getRoleLabel = () => {
    if (isPlatformOwner) return t('layout.platformOwner');
    if (isCompanyAdmin) return t('layout.companyAdmin');
    if (isSuperAdmin) return t('layout.superAdmin');
    return t('layout.agent');
  };

  const navItems = [
    { icon: LayoutDashboard, label: t('layout.dashboard'), path: "/admin" },
    { icon: Users, label: t('layout.clients'), path: "/admin/clients" },
    { icon: MessageSquare, label: t('layout.support'), path: "/admin/support" },
    ...(isSuperAdmin || isCompanyAdmin ? [
      { icon: Users, label: t('layout.agents'), path: "/admin/agents" },
      { icon: BarChart3, label: t('layout.analytics'), path: "/admin/analytics" },
      { icon: FileText, label: t('layout.activityLogs'), path: "/admin/logs" },
      { icon: Settings, label: t('layout.settings'), path: "/admin/settings" },
    ] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <Logo size="md" linkTo="/admin" />
            <div className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t('layout.admin')}
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t p-4">
            <div className="mb-3">
              <LanguageSwitcher />
            </div>
            <div className="mb-3 rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium truncate">{displayName || user?.email}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              {t('layout.signOut')}
            </Button>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;