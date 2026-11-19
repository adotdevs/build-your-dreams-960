import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { 
  Shield, Lock, Key, Server, 
  Eye, FileCheck, CheckCircle2,
  ArrowRight, ShieldCheck, Fingerprint, Database
} from "lucide-react";
import securityShield from "@/assets/illustrations/security-shield.png";

const SecurityPage = () => {
  const { t } = useTranslation('pages');

  const securityFeatures = [
    { icon: Lock, key: "ssl" },
    { icon: Server, key: "cold" },
    { icon: Fingerprint, key: "twofa" },
    { icon: Key, key: "multisig" },
    { icon: Eye, key: "monitor" },
    { icon: Database, key: "encrypted" },
  ];

  const certKeys = ["iso", "soc", "gdpr", "pci"] as const;

  const tips = t('security.tips', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 gradient-hero">
          <div className="absolute -start-32 -top-32 h-96 w-96 rounded-full orb-emerald blur-3xl animate-pulse" />
          <div className="absolute -end-32 bottom-0 h-96 w-96 rounded-full orb-primary blur-3xl" />
          
          <div className="container relative">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="text-center lg:text-start">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-sm font-medium text-success border border-success/20">
                  <Shield className="h-4 w-4" />
                  <span>{t('security.badge')}</span>
                </div>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  {t('security.title')}
                </h1>
                <p className="mb-10 text-lg text-muted-foreground md:text-xl">
                  {t('security.subtitle')}
                </p>
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-success">256-bit</p>
                    <p className="text-sm text-muted-foreground">{t('security.sslEncryption')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-success">95%</p>
                    <p className="text-sm text-muted-foreground">{t('security.coldStorage')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-success">24/7</p>
                    <p className="text-sm text-muted-foreground">{t('security.monitoring')}</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img src={securityShield} alt="Security Shield" className="w-full h-auto" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-20 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('security.multiLayer')}</h2>
              <p className="text-lg text-muted-foreground">{t('security.multiLayerDesc')}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {securityFeatures.map((feature) => (
                <div key={feature.key} className="group rounded-2xl border bg-background p-8 transition-all hover:shadow-xl hover:border-success/30">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-success/10 to-emerald-500/10 transition-colors group-hover:from-success/20 group-hover:to-emerald-500/20">
                    <feature.icon className="h-7 w-7 text-success" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{t(`security.features.${feature.key}.title`)}</h3>
                  <p className="text-muted-foreground">{t(`security.features.${feature.key}.description`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-20 md:py-32 gradient-section-vibrant">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('security.certTitle')}</h2>
              <p className="text-lg text-muted-foreground">{t('security.certDesc')}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {certKeys.map((key) => (
                <div key={key} className="rounded-2xl border bg-background/80 backdrop-blur-sm p-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                    <ShieldCheck className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="mb-1 text-lg font-bold">{t(`security.certs.${key}.name`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`security.certs.${key}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Insurance */}
        <section className="py-20 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-4xl rounded-3xl border bg-gradient-to-br from-success/5 to-emerald-500/5 p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-2 items-center">
                <div>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                    <FileCheck className="h-7 w-7 text-success" />
                  </div>
                  <h2 className="mb-4 text-2xl font-bold md:text-3xl">{t('security.insurance')}</h2>
                  <p className="text-muted-foreground mb-6">{t('security.insuranceDesc')}</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-success" /><span>{t('security.comprehensiveCoverage')}</span></li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-success" /><span>{t('security.leadingInsurers')}</span></li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-success" /><span>{t('security.regularAudits')}</span></li>
                  </ul>
                </div>
                <div className="rounded-2xl border bg-background p-8 text-center">
                  <p className="text-5xl font-bold text-success mb-2">£100M</p>
                  <p className="text-muted-foreground">{t('security.insuranceCoverage')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Tips */}
        <section className="py-20 md:py-32 border-t">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('security.bestPractices')}</h2>
                <p className="text-lg text-muted-foreground">{t('security.bestPracticesDesc')}</p>
              </div>
              <div className="space-y-4">
                {Array.isArray(tips) && tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-4 rounded-xl border bg-background p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <p className="pt-1">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold">{t('security.questionsTitle')}</h2>
              <p className="mb-8 text-muted-foreground">{t('security.questionsDesc')}</p>
              <Button size="lg" asChild>
                <Link to="/dashboard/support">
                  {t('security.contactSupport')}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SecurityPage;
