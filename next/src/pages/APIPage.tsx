import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { 
  Code, Zap, Lock, Clock, 
  ArrowRight, Terminal, FileCode
} from "lucide-react";
import apiDeveloper from "@/assets/illustrations/api-developer.png";

const APIPage = () => {
  const { t } = useTranslation('pages');

  const featureKeys = ["fast", "secure", "rest", "uptime"] as const;
  const featureIcons = { fast: Zap, secure: Lock, rest: Code, uptime: Clock };

  const endpointKeys = ["account", "wallets", "transactions", "transfers", "prices", "portfolio"] as const;
  const endpointPaths: Record<string, { method: string; path: string }> = {
    account: { method: "GET", path: "/v1/account" },
    wallets: { method: "GET", path: "/v1/wallets" },
    transactions: { method: "GET", path: "/v1/transactions" },
    transfers: { method: "POST", path: "/v1/transfers" },
    prices: { method: "GET", path: "/v1/prices" },
    portfolio: { method: "GET", path: "/v1/portfolio" },
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 gradient-hero">
          <div className="absolute -start-32 -top-32 h-96 w-96 rounded-full orb-violet blur-3xl animate-pulse" />
          <div className="absolute -end-32 bottom-0 h-96 w-96 rounded-full orb-primary blur-3xl" />
          
          <div className="container relative">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="text-center lg:text-start">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-600 border border-violet-500/20">
                  <Terminal className="h-4 w-4" />
                  <span>{t('api.badge')}</span>
                </div>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  {t('api.title')}
                </h1>
                <p className="mb-10 text-lg text-muted-foreground md:text-xl">
                  {t('api.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="shadow-lg" asChild>
                    <Link to="/register">
                      {t('api.getApiKeys')}
                      <ArrowRight className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="#documentation">{t('api.viewDocs')}</a>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-violet-500/20">
                  <img src={typeof apiDeveloper === "string" ? apiDeveloper : apiDeveloper.src} alt="API Developer" className="w-full h-auto" />
                </div>
                <div className="absolute -bottom-6 -right-6 rounded-xl border bg-background/90 backdrop-blur-sm px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                      <Zap className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">&lt;50ms {t('api.response')}</p>
                      <p className="text-xs text-muted-foreground">99.99% {t('api.uptime')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 md:py-32">
          <div className="container">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featureKeys.map((key) => {
                const Icon = featureIcons[key];
                return (
                  <div key={key} className="rounded-2xl border bg-background p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                      <Icon className="h-6 w-6 text-violet-600" />
                    </div>
                    <h3 className="mb-2 font-semibold">{t(`api.features.${key}.title`)}</h3>
                    <p className="text-sm text-muted-foreground">{t(`api.features.${key}.description`)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section id="documentation" className="py-20 md:py-32 gradient-section-cool">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('api.quickStart')}</h2>
                <p className="text-lg text-muted-foreground">{t('api.quickStartDesc')}</p>
              </div>
              
              <div className="rounded-2xl border bg-zinc-950 p-6 overflow-x-auto">
                <div className="flex items-center gap-2 mb-4 text-zinc-400 text-sm">
                  <FileCode className="h-4 w-4" />
                  <span>{t('api.exampleRequest')}</span>
                </div>
                <pre className="text-sm text-zinc-300 font-mono">
{`curl -X GET "https://api.coinly.com/v1/portfolio" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

// Response
{
  "success": true,
  "data": {
    "total_value_eur": 127384.52,
    "change_24h": 12.4,
    "assets": [
      { "symbol": "BTC", "balance": 1.5, "value_eur": 95420.50 },
      { "symbol": "ETH", "balance": 10.2, "value_eur": 31964.02 }
    ]
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="py-20 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <div className="text-center mb-12">
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('api.endpoints')}</h2>
                <p className="text-lg text-muted-foreground">{t('api.endpointsDesc')}</p>
              </div>
              
              <div className="space-y-3">
                {endpointKeys.map((key) => {
                  const ep = endpointPaths[key];
                  return (
                    <div key={key} className="flex items-center gap-4 rounded-xl border bg-background p-4">
                      <span className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${
                        ep.method === 'GET' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                      }`}>
                        {ep.method}
                      </span>
                      <code className="font-mono text-sm">{ep.path}</code>
                      <span className="ml-auto text-sm text-muted-foreground hidden sm:inline">{t(`api.ep.${key}`)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 border-t">
          <div className="container">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold">{t('api.readyTitle')}</h2>
              <p className="mb-8 text-muted-foreground">{t('api.readyDesc')}</p>
              <Button size="lg" asChild>
                <Link to="/register">
                  {t('api.createDev')}
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

export default APIPage;
