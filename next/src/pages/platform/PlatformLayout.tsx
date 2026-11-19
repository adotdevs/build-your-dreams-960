import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "@/lib/router-compat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, Building2, LogOut, Loader2, BarChart3, Settings
} from "lucide-react";
import Logo from "@/components/Logo";

interface PlatformLayoutProps {
  children: ReactNode;
}

const PlatformLayout = ({ children }: PlatformLayoutProps) => {
  const { user, signOut, isPlatformOwner, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    } else if (!isLoading && user && !isPlatformOwner) {
      // Redirect non-platform owners to their correct dashboard
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, isPlatformOwner, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isPlatformOwner) return null;

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/platform" },
    { icon: Building2, label: "Companies", path: "/platform/companies" },
    { icon: BarChart3, label: "Analytics", path: "/platform/analytics" },
    { icon: Settings, label: "Settings", path: "/platform/settings" },
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
            <Logo size="md" linkTo="/platform" />
            <div className="ml-2 rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground uppercase tracking-widest">
              Platform
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
            <div className="mb-3 rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Platform Owner</p>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
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

export default PlatformLayout;
