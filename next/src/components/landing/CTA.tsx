import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Shield, Zap, HeadphonesIcon } from "lucide-react";

const CTA = () => {
  const { t } = useTranslation('landing');

  return (
    <section className="relative overflow-hidden py-20 md:py-32" id="security">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-violet-500/5 to-emerald-500/10" />
      <div className="absolute -start-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full orb-primary blur-3xl animate-pulse" />
      <div className="absolute -end-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full orb-emerald blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute left-1/2 bottom-0 h-64 w-64 -translate-x-1/2 rounded-full orb-violet blur-3xl" />

      <div className="container relative">
        <div className="mx-auto max-w-4xl rounded-3xl border border-primary/20 bg-background/80 p-8 shadow-2xl backdrop-blur-sm md:p-12 relative overflow-hidden">
          {/* Inner decorative gradient */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 blur-2xl" />
          <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-2xl" />
          
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
              {t('cta.title', 'Ready to Start Your Crypto Journey?')}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              {t('cta.subtitle', 'Join thousands of users who trust Cryptogen for secure cryptocurrency management.')}
            </p>

            <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="w-full shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-violet-600 hover:from-primary hover:to-violet-500 sm:w-auto" asChild>
                <Link to="/register">
                  {t('cta.createAccount', 'Create Free Account')}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/30 hover:bg-primary/5 hover:border-primary/50" asChild>
                <Link to="/login">{t('cta.signIn', 'Sign In')}</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" />
                <span>{t('cta.trust1', 'Bank-level security')}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-warning" />
                <span>{t('cta.trust2', 'Instant verification')}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <HeadphonesIcon className="h-5 w-5 text-primary" />
                <span>{t('cta.trust3', '24/7 support')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;