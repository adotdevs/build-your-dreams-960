import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { 
  Shield, 
  FileText, 
  HelpCircle,
} from "lucide-react";

const DashboardFooter = () => {
  const { t } = useTranslation('dashboard');
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { label: t('dashboardFooter.terms'), href: "/terms" },
    { label: t('dashboardFooter.privacy'), href: "/privacy" },
    { label: t('dashboardFooter.legalNotice'), href: "/legal" },
    { label: t('dashboardFooter.cookiePolicy'), href: "/cookies" },
  ];

  const supportLinks = [
    { label: t('dashboardFooter.helpCenter'), href: "/help", icon: HelpCircle },
    { label: t('dashboardFooter.documentation'), href: "/docs", icon: FileText },
    { label: t('dashboardFooter.security'), href: "/security", icon: Shield },
  ];

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="px-6 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">CG</span>
              </div>
              <span className="font-semibold">Cryptogen</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {t('dashboardFooter.description')}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>{t('dashboardFooter.sslSecured')}</span>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-medium text-sm mb-4">{t('dashboardFooter.support')}</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link 
                  to="/dashboard/support"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {t('dashboardFooter.myConversations')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium text-sm mb-4">{t('dashboardFooter.legal')}</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Regulatory Notice */}
        <div className="border-t border-border pt-6 mb-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{t('dashboardFooter.disclaimer')}</strong> {t('dashboardFooter.disclaimerText')}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} Cryptogen. {t('dashboardFooter.allRights')}</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t('dashboardFooter.allSystems')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
