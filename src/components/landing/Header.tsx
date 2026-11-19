import { Link, useLocation } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Shield, ChevronDown, Menu, X } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

const Header = () => {
  const { t } = useTranslation(['common', 'landing']);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { href: "/", label: t('common:nav.home') },
    { href: "/features", label: t('common:nav.features') },
    { href: "/security", label: t('common:nav.security') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/* Top bar - Trust indicators */}
      <div className="hidden border-b border-border/30 bg-muted/30 md:block">
        <div className="container flex h-8 items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
               <Shield className="h-3 w-3 text-success" />
               <span>{t('landing:header.sslSecured')}</span>
             </div>
             <div className="h-3 w-px bg-border" />
             <span className="text-muted-foreground">{t('landing:header.support247')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            <span>{t('landing:header.allSystems')}</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container flex h-16 items-center justify-between lg:h-18">
        {/* Logo */}
        <Logo size="lg" />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground",
                "after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2",
                "after:bg-primary after:transition-all after:duration-200",
                "hover:after:w-6",
                location.pathname === item.href && "text-foreground after:w-6"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="group relative">
            <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t('landing:header.resources')}
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="w-48 rounded-xl border bg-background/95 p-2 shadow-xl backdrop-blur-xl">
                 <Link to="/docs" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                   {t('landing:header.documentation')}
                 </Link>
                 <Link to="/api" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                   {t('landing:header.apiReference')}
                 </Link>
                 <Link to="/help" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                   {t('landing:header.helpCenter')}
                 </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="sm" className="font-medium" asChild>
              <Link to="/login">{t('common:nav.signIn')}</Link>
            </Button>
            <Button size="sm" className="font-medium shadow-md" asChild>
              <Link to="/register">{t('common:nav.createAccount')}</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-muted lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "absolute left-0 right-0 top-full border-b bg-background/98 backdrop-blur-xl transition-all duration-300 lg:hidden",
          mobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        )}
      >
        <div className="container py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" className="w-full justify-center" asChild>
                <Link to="/login">{t('common:nav.signIn')}</Link>
              </Button>
              <Button className="w-full justify-center" asChild>
                <Link to="/register">{t('common:nav.createAccount')}</Link>
              </Button>
            </div>
            <div className="flex justify-center pt-4">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
