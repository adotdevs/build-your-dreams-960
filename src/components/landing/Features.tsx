import { useTranslation } from "react-i18next";
import { ShieldCheck, Eye, Clock, LayoutDashboard, ArrowUpRight } from "lucide-react";

const Features = () => {
  const { t } = useTranslation('landing');

  const features = [
    {
      icon: ShieldCheck,
      titleKey: "features.kyc.title",
      descriptionKey: "features.kyc.description",
    },
    {
      icon: Eye,
      titleKey: "features.wallet.title",
      descriptionKey: "features.wallet.description",
    },
    {
      icon: Clock,
      titleKey: "features.tracking.title",
      descriptionKey: "features.tracking.description",
    },
    {
      icon: LayoutDashboard,
      titleKey: "features.access.title",
      descriptionKey: "features.access.description",
    },
  ];

  return (
    <section id="features" className="gradient-section-vibrant py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 to-violet-500/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20">
            <span>{t('features.badge')}</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <div 
              key={feature.titleKey} 
              className="group relative overflow-hidden rounded-2xl border bg-background/80 backdrop-blur-sm p-8 transition-all hover:shadow-xl hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background decoration */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-violet-500/10 transition-transform group-hover:scale-150" />
              
              <div className="relative">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 transition-all group-hover:from-primary/20 group-hover:to-violet-500/20 group-hover:shadow-lg group-hover:shadow-primary/20">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 transition-all group-hover:text-primary group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">{t(feature.titleKey)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t(feature.descriptionKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
