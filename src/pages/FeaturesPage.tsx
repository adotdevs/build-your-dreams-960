import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, Wallet, TrendingUp, Clock, 
  Smartphone, Globe, Lock, Zap, 
  BarChart3, Bell, CreditCard, Users,
  ArrowRight, CheckCircle2
} from "lucide-react";
import featuresDashboard from "@/assets/illustrations/features-dashboard.png";

const FeaturesPage = () => {
  const { t } = useTranslation(['pages', 'common']);

  const mainFeatures = [
    {
      icon: ShieldCheck,
      titleKey: "features.main.kyc.title",
      descKey: "features.main.kyc.description",
      highlights: ["features.main.kyc.h1", "features.main.kyc.h2", "features.main.kyc.h3"]
    },
    {
      icon: Wallet,
      titleKey: "features.main.wallet.title",
      descKey: "features.main.wallet.description",
      highlights: ["features.main.wallet.h1", "features.main.wallet.h2", "features.main.wallet.h3"]
    },
    {
      icon: TrendingUp,
      titleKey: "features.main.tracking.title",
      descKey: "features.main.tracking.description",
      highlights: ["features.main.tracking.h1", "features.main.tracking.h2", "features.main.tracking.h3"]
    },
    {
      icon: Clock,
      titleKey: "features.main.access.title",
      descKey: "features.main.access.description",
      highlights: ["features.main.access.h1", "features.main.access.h2", "features.main.access.h3"]
    },
  ];

  const additionalFeatures = [
    { icon: Smartphone, titleKey: "features.additional.mobile.title", descKey: "features.additional.mobile.description" },
    { icon: Globe, titleKey: "features.additional.lang.title", descKey: "features.additional.lang.description" },
    { icon: Lock, titleKey: "features.additional.twofa.title", descKey: "features.additional.twofa.description" },
    { icon: Zap, titleKey: "features.additional.instant.title", descKey: "features.additional.instant.description" },
    { icon: BarChart3, titleKey: "features.additional.charts.title", descKey: "features.additional.charts.description" },
    { icon: Bell, titleKey: "features.additional.alerts.title", descKey: "features.additional.alerts.description" },
    { icon: CreditCard, titleKey: "features.additional.bank.title", descKey: "features.additional.bank.description" },
    { icon: Users, titleKey: "features.additional.referral.title", descKey: "features.additional.referral.description" },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 gradient-hero">
          <div className="absolute -start-32 -top-32 h-96 w-96 rounded-full orb-primary blur-3xl animate-pulse" />
          <div className="absolute -end-32 bottom-0 h-96 w-96 rounded-full orb-violet blur-3xl" />
          
          <div className="container relative">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="text-center lg:text-start">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20">
                  <Zap className="h-4 w-4" />
                  <span>{t('pages:features.badge')}</span>
                </div>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  {t('pages:features.title')}
                </h1>
                <p className="mb-10 text-lg text-muted-foreground md:text-xl">
                  {t('pages:features.subtitle')}
                </p>
                <Button size="lg" className="shadow-lg shadow-primary/25" asChild>
                  <Link to="/register">
                    {t('pages:features.getStarted')}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={featuresDashboard} alt="Coinly Dashboard" className="w-full h-auto" />
                </div>
                <div className="absolute -bottom-6 -left-6 rounded-xl border bg-background/90 backdrop-blur-sm px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('pages:features.allInOne')}</p>
                      <p className="text-xs text-muted-foreground">{t('pages:features.users')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section className="py-20 md:py-32">
          <div className="container">
            <div className="space-y-24">
              {mainFeatures.map((feature, index) => (
                <div 
                  key={feature.titleKey}
                  className={`grid gap-12 lg:grid-cols-2 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                >
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="mb-4 text-3xl font-bold">{t(`pages:${feature.titleKey}`)}</h2>
                    <p className="mb-6 text-lg text-muted-foreground">{t(`pages:${feature.descKey}`)}</p>
                    <ul className="space-y-3">
                      {feature.highlights.map((hKey) => (
                        <li key={hKey} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                          <span>{t(`pages:${hKey}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`rounded-2xl border bg-gradient-to-br from-muted/50 to-muted p-8 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className="aspect-video rounded-xl bg-background/80 border flex items-center justify-center">
                      <feature.icon className="h-24 w-24 text-muted-foreground/30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Features Grid */}
        <section className="py-20 md:py-32 gradient-section-vibrant">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('pages:features.more')}</h2>
              <p className="text-lg text-muted-foreground">{t('pages:features.moreDesc')}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {additionalFeatures.map((feature) => (
                <div key={feature.titleKey} className="group rounded-2xl border bg-background/80 backdrop-blur-sm p-6 transition-all hover:shadow-lg hover:border-primary/30">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 transition-colors group-hover:from-primary/20 group-hover:to-violet-500/20">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{t(`pages:${feature.titleKey}`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`pages:${feature.descKey}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-3xl rounded-3xl border bg-gradient-to-br from-primary/5 to-violet-500/5 p-8 md:p-12 text-center">
              <h2 className="mb-4 text-3xl font-bold">{t('pages:features.ctaTitle')}</h2>
              <p className="mb-8 text-lg text-muted-foreground">{t('pages:features.ctaDesc')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/register">{t('pages:features.createFree')}</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">{t('common:nav.signIn')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FeaturesPage;
