import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Wallet, Play, CheckCircle2, Zap, Lock } from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { getCryptoPriceEur, formatFiat } from "@/lib/crypto-prices";

const Hero = () => {
  const { t } = useTranslation(['landing', 'common']);
  const { prices } = useCryptoPrices();

  const topCryptos = prices.slice(0, 4);

  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Decorative elements */}
      <div className="absolute -start-32 -top-32 h-96 w-96 rounded-full orb-primary blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -end-32 h-96 w-96 rounded-full orb-emerald blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full orb-violet blur-3xl" />
      <div className="absolute right-1/4 top-3/4 h-48 w-48 rounded-full orb-amber blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="container relative">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left column - Content */}
          <div className="text-center lg:text-start">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-2 text-sm animate-fade-in">
              <div className="flex h-2 w-2 items-center justify-center">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
              </div>
              <span className="font-medium text-success">{t('landing:hero.badge')}</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {t('landing:hero.title')}
            </h1>

            <p className="mb-8 text-lg text-muted-foreground md:text-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {t('landing:hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button size="lg" className="w-full shadow-lg shadow-primary/25 sm:w-auto" asChild>
                <Link to="/register">
                  {t('landing:hero.cta.createAccount')}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="group w-full sm:w-auto" asChild>
                <Link to="/login" className="gap-2">
                  <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
                  {t('landing:hero.cta.signIn')}
                </Link>
              </Button>
            </div>

            {/* Trust badges inline */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground lg:justify-start animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>{t('landing:hero.trust.noFees')}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                <span>{t('landing:hero.trust.instantVerification')}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>{t('landing:hero.trust.bankSecurity')}</span>
              </div>
            </div>
          </div>

          {/* Right column - Dashboard preview */}
          <div className="relative animate-fade-in hidden sm:block" style={{ animationDelay: '0.5s' }}>
            {/* Main dashboard card */}
            <div className="relative rounded-2xl border bg-background/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
              {/* Header */}
              <div className="mb-4 sm:mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('landing:hero.preview.totalPortfolio')}</p>
                  <p className="text-2xl sm:text-3xl font-bold">€127,384.52</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                  <TrendingUp className="h-4 w-4" />
                  +12.4%
                </div>
              </div>

              {/* Live crypto prices */}
              <div className="space-y-2 sm:space-y-3">
                {topCryptos.map((crypto, index) => (
                  <div
                    key={crypto.symbol}
                    className="flex items-center justify-between rounded-xl bg-muted/50 p-2.5 sm:p-3 transition-colors hover:bg-muted"
                    style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-background overflow-hidden">
                        <img 
                          src={crypto.image} 
                          alt={crypto.name} 
                          className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">{crypto.symbol}</p>
                        <p className="text-xs text-muted-foreground">{crypto.name}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="font-medium text-sm sm:text-base">{formatFiat(getCryptoPriceEur(crypto), 'EUR')}</p>
                      <p className={`text-xs ${crypto.price_change_percentage_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {crypto.price_change_percentage_24h >= 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating badge */}
              <div className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 rounded-xl border bg-background px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                  <span className="font-medium">{t('landing:hero.preview.livePrices')}</span>
                </div>
              </div>
            </div>

            {/* Floating stats card */}
            <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 rounded-xl border bg-background p-3 sm:p-4 shadow-xl hidden md:flex">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                   <p className="text-sm font-medium">256-bit SSL</p>
                   <p className="text-xs text-muted-foreground">{t('landing:hero.preview.encryption')}</p>
                </div>
              </div>
            </div>

            {/* Floating users card */}
            <div className="absolute -right-4 md:-right-6 bottom-1/4 rounded-xl border bg-background p-3 sm:p-4 shadow-xl hidden md:flex">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-primary to-primary/60" />
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-success to-success/60" />
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-warning to-warning/60" />
                </div>
                <div>
                   <p className="text-sm font-medium">50,000+</p>
                   <p className="text-xs text-muted-foreground">{t('landing:hero.preview.activeUsers')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
