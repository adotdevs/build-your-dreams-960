import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";

const Footer = () => {
  const {
    t
  } = useTranslation(['landing', 'common']);
  return <footer className="border-t bg-muted/50">
      {/* Newsletter section */}
      <div className="border-b">
        <div className="container py-12">
          <div className="mx-auto max-w-2xl text-center">
             <h3 className="mb-2 text-xl font-semibold">{t('landing:footer.newsletter.title')}</h3>
             <p className="mb-6 text-muted-foreground">{t('landing:footer.newsletter.subtitle')}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center px-4 sm:px-0">
                <Input type="email" placeholder={t('landing:footer.newsletter.placeholder')} className="w-full sm:max-w-xs bg-background" />
               <Button>{t('landing:footer.newsletter.subscribe')}</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container">
        <div className="grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Logo size="lg" />
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {t('landing:footer.description')}
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">CRYPTOGEN PTE. LTD.</p>
              <p>UEN: 202213565G</p>
              <p>151 Chin Swee Road, #02-24</p>
              <p>Manhattan House, Singapore 169876</p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 font-semibold">{t('landing:footer.product')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/features" className="transition-colors hover:text-foreground">{t('common:nav.features')}</Link></li>
              <li><Link to="/security" className="transition-colors hover:text-foreground">{t('common:nav.security')}</Link></li>
              
              <li><Link to="/api" className="transition-colors hover:text-foreground">{t('landing:footer.apiReference')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold">{t('landing:footer.legal')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/terms" className="transition-colors hover:text-foreground">{t('landing:footer.terms')}</Link></li>
              <li><Link to="/privacy" className="transition-colors hover:text-foreground">{t('landing:footer.privacy')}</Link></li>
              <li><Link to="/legal" className="transition-colors hover:text-foreground">{t('landing:footer.legalNotice')}</Link></li>
              <li><Link to="/cookies" className="transition-colors hover:text-foreground">{t('landing:footer.cookies')}</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t py-6 text-sm text-muted-foreground md:flex-row">
          <p>{t('landing:footer.copyright', {
            year: new Date().getFullYear()
          })}</p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>{t('landing:footer.allSystems')}</span>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;