import { useTranslation } from "react-i18next";
import { UserPlus, ShieldCheck, Wallet, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-compat";

const HowItWorks = () => {
  const { t } = useTranslation('landing');

  const steps = [
    {
      icon: UserPlus,
      step: "01",
      title: t('howItWorks.step1.title', 'Create Account'),
      description: t('howItWorks.step1.desc', 'Sign up in less than 2 minutes with just your email address.'),
    },
    {
      icon: ShieldCheck,
      step: "02",
      title: t('howItWorks.step2.title', 'Verify Identity'),
      description: t('howItWorks.step2.desc', 'Complete our quick KYC process with instant verification.'),
    },
    {
      icon: Wallet,
      step: "03",
      title: t('howItWorks.step3.title', 'Fund Your Wallet'),
      description: t('howItWorks.step3.desc', 'Deposit funds securely via bank transfer or card payment.'),
    },
    {
      icon: TrendingUp,
      step: "04",
      title: t('howItWorks.step4.title', 'Start Managing'),
      description: t('howItWorks.step4.desc', 'Track, manage, and grow your crypto portfolio with ease.'),
    },
  ];

  return (
    <section className="gradient-section-cool py-20 md:py-32 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute -left-32 top-1/4 h-64 w-64 rounded-full orb-violet blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full orb-emerald blur-3xl" />
      
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-primary/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20">
            <span>{t('howItWorks.badge')}</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            {t('howItWorks.title', 'Get Started in 4 Easy Steps')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('howItWorks.subtitle', 'From signup to managing your portfolio, we make it simple and secure.')}
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className="group relative animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-primary/50 via-violet-500/30 to-transparent lg:block" />
              )}
              
              <div className="relative rounded-2xl border bg-background/80 backdrop-blur-sm p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                {/* Step number */}
                <div className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-primary to-violet-600 px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30">
                  {t('howItWorks.step')} {step.step}
                </div>
                
                <div className="mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 transition-colors group-hover:from-primary/20 group-hover:to-emerald-500/20">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" className="shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-violet-600 transition-all" asChild>
            <Link to="/register">
              {t('howItWorks.cta', 'Get Started Now')}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;