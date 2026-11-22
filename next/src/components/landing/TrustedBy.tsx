import { Shield, Building2, Landmark, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";

// SVG logos for trusted publications
const BloombergLogo = () => (
  <svg viewBox="0 0 500 100" className="h-6 w-auto" fill="currentColor">
    <text x="0" y="70" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="72" letterSpacing="-2">Bloomberg</text>
  </svg>
);

const ForbesLogo = () => (
  <svg viewBox="0 0 200 50" className="h-5 w-auto" fill="currentColor">
    <text x="0" y="40" fontFamily="Georgia, serif" fontWeight="700" fontSize="46" fontStyle="italic">Forbes</text>
  </svg>
);

const ReutersLogo = () => (
  <svg viewBox="0 0 200 40" className="h-5 w-auto" fill="currentColor">
    <text x="0" y="32" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="36" letterSpacing="1">REUTERS</text>
  </svg>
);

const TechCrunchLogo = () => (
  <svg viewBox="0 0 250 40" className="h-5 w-auto" fill="currentColor">
    <text x="0" y="32" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="32">TechCrunch</text>
  </svg>
);

const CoinDeskLogo = () => (
  <svg viewBox="0 0 200 40" className="h-5 w-auto" fill="currentColor">
    <text x="0" y="30" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="28">COINDESK</text>
  </svg>
);

const CoinTelegraphLogo = () => (
  <svg viewBox="0 0 280 40" className="h-5 w-auto" fill="currentColor">
    <text x="0" y="30" fontFamily="Arial, sans-serif" fontWeight="600" fontSize="26">Cointelegraph</text>
  </svg>
);

const TrustedBy = () => {
  const { t } = useTranslation('landing');
  const partners = [
    { name: "Bloomberg", Logo: BloombergLogo },
    { name: "CoinDesk", Logo: CoinDeskLogo },
    { name: "Reuters", Logo: ReutersLogo },
    { name: "Forbes", Logo: ForbesLogo },
    { name: "TechCrunch", Logo: TechCrunchLogo },
    { name: "Cointelegraph", Logo: CoinTelegraphLogo },
  ];

  const frenchInstitutions = [
    { 
      name: "AMF", 
      fullName: "Autorité des Marchés Financiers",
      Icon: Scale,
    },
    { 
      name: "ACPR", 
      fullName: "Banque de France",
      Icon: Landmark,
    },
    { 
      name: "CNIL", 
      fullName: "Protection des données",
      Icon: Shield,
    },
    { 
      name: "PSAN", 
      fullName: "Prestataire enregistré",
      Icon: Building2,
    },
  ];

  return (
    <section className="py-12 md:py-16 border-b bg-gradient-to-b from-background to-muted/20">
      <div className="container">
        {/* Featured in publications */}
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {t('trustedBy.featuredIn')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 md:gap-12">
          {partners.map((partner, index) => (
            <div
              key={partner.name}
              className="flex items-center text-muted-foreground/50 transition-all duration-300 hover:text-foreground hover:scale-105 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <partner.Logo />
            </div>
          ))}
        </div>

        {/* Regulatory compliance - key selling point */}
        <div className="mt-16 pt-12 border-t border-primary/10">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 mb-4">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('trustedBy.regulations')}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Votre sécurité, notre priorité absolue
            </h3>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              CRYPTOGEN PTE. LTD. opère en conformité totale avec les cadres réglementaires les plus exigeants.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {frenchInstitutions.map((institution, index) => (
              <div
                key={institution.name}
                className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 p-5 md:p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${0.3 + index * 0.08}s` }}
              >
                {/* Subtle corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-emerald-500/15 mb-4 transition-all duration-300 group-hover:scale-110 group-hover:from-primary/25 group-hover:to-emerald-500/25">
                    <institution.Icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-foreground mb-1">{institution.name}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{institution.fullName}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Trust reinforcement */}
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Enregistrement vérifié • UEN 202213565G</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;