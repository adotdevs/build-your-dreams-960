import { useTranslation } from "react-i18next";
import { Users, Wallet, Globe, Shield } from "lucide-react";

const Stats = () => {
  const { t } = useTranslation('landing');

  const stats = [
    {
      icon: Users,
      value: "50,000+",
      label: t('stats.users', 'Active Users'),
      description: t('stats.usersDesc', 'Trust our platform daily'),
    },
    {
      icon: Wallet,
      value: "€2.5B+",
      label: t('stats.volume', 'Assets Managed'),
      description: t('stats.volumeDesc', 'Securely stored'),
    },
    {
      icon: Globe,
      value: "45+",
      label: t('stats.countries', 'Countries'),
      description: t('stats.countriesDesc', 'Worldwide coverage'),
    },
    {
      icon: Shield,
      value: "99.9%",
      label: t('stats.uptime', 'Uptime'),
      description: t('stats.uptimeDesc', 'Always available'),
    },
  ];

  return (
    <section className="border-y bg-gradient-to-r from-background via-primary/5 to-background py-16 relative overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent" />
      
      <div className="container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="group text-center animate-fade-in relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 transition-all group-hover:from-primary/20 group-hover:to-violet-500/20 group-hover:shadow-lg group-hover:shadow-primary/20">
                <stat.icon className="h-7 w-7 text-primary" />
              </div>
              <p className="text-2xl font-bold sm:text-3xl md:text-4xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{stat.value}</p>
              <p className="mt-1 font-medium">{stat.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;