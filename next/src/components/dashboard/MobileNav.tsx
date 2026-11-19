import { useState } from "react";
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
  Menu,
  Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";

const MobileNav = () => {
  const { t } = useTranslation(['common', 'dashboard']);
  const [open, setOpen] = useState(false);
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
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
      <Logo size="sm" linkTo="/dashboard" />

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <div className="flex h-14 items-center border-b border-border px-4">
              <span className="font-semibold">{t('dashboard:sidebar.menu')}</span>
            </div>

            <nav className="flex-1 space-y-0.5 p-3">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
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

            <div className="border-t border-border p-3">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" asChild>
                <Link to="/" onClick={() => setOpen(false)}>
                  <LogOut className="h-4 w-4" />
                  {t('common:nav.signOut')}
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default MobileNav;
