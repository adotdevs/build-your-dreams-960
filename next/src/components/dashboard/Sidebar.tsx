import { Link, useLocation } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  Settings, 
  HelpCircle,
  LogOut,
  Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";

const Sidebar = () => {
  const { t } = useTranslation(['common', 'dashboard']);
  const location = useLocation();

  const navigation = [
    { name: t('common:nav.dashboard'), href: "/dashboard", icon: LayoutDashboard },
    { name: t('common:nav.wallet'), href: "/dashboard/wallet", icon: Wallet },
    { name: t('common:nav.bankWithdrawal'), href: "/dashboard/withdrawal", icon: Landmark },
    { name: t('common:nav.transactions'), href: "/dashboard/transactions", icon: ArrowLeftRight },
    { name: t('common:nav.settings'), href: "/dashboard/settings", icon: Settings },
    { name: t('common:nav.support'), href: "/dashboard/support", icon: HelpCircle },
  ];

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
      {/* Logo */}
      <div className="flex h-14 items-center px-6 border-b border-border">
        <Logo size="md" linkTo="/dashboard" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="px-1">
          <LanguageSwitcher />
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" asChild>
          <Link to="/">
            <LogOut className="h-4 w-4" />
            {t('common:nav.signOut')}
          </Link>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
