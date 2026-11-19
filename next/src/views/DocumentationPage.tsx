import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Book, Code, Zap, Database, Shield, Wallet, ArrowRight, Search, FileText, Video, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const DocumentationPage = () => {
  const { t } = useTranslation('pages');

  const startedKeys = ["quickStart", "wallet", "security"] as const;
  const startedIcons = { quickStart: Zap, wallet: Wallet, security: Shield };

  const categoryKeys = ["guides", "api", "trading", "security"] as const;
  const categoryIcons = { guides: Book, api: Code, trading: Database, security: Shield };
  const categoryColors = {
    guides: "from-violet-500 to-purple-600",
    api: "from-cyan-500 to-blue-600",
    trading: "from-emerald-500 to-green-600",
    security: "from-amber-500 to-orange-600",
  };
  const categoryArticleCounts = { guides: 24, api: 42, trading: 18, security: 15 };

  const popularArticles = t('docs.popular', { returnObjects: true }) as { title: string; views: string }[];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-violet-500/10 via-background to-cyan-500/10">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="container relative py-20 lg:py-28">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t('docs.backToHome')}
          </Link>
          
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 text-sm backdrop-blur-sm">
              <Book className="h-4 w-4 text-primary" />
              <span>{t('docs.badge')}</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              {t('docs.title')}{" "}
              <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
                {t('docs.titleHighlight')}
              </span>
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground">{t('docs.subtitle')}</p>
            
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" placeholder={t('docs.searchPlaceholder')} className="h-14 pl-12 pr-4 text-base shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="container py-16">
        <h2 className="mb-8 text-2xl font-bold">{t('docs.gettingStarted')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {startedKeys.map((key) => {
            const Icon = startedIcons[key];
            return (
              <a key={key} href="#" className="group flex items-start gap-4 rounded-xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold group-hover:text-primary">{t(`docs.started.${key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`docs.started.${key}.description`)}</p>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="border-y bg-muted/30">
        <div className="container py-16">
          <h2 className="mb-8 text-2xl font-bold">{t('docs.browseByCategory')}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {categoryKeys.map((key) => {
              const Icon = categoryIcons[key];
              return (
                <div key={key} className="group cursor-pointer rounded-xl border bg-card p-6 transition-all hover:shadow-xl">
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${categoryColors[key]} text-white shadow-lg`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{t(`docs.categories.${key}.title`)}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{t(`docs.categories.${key}.description`)}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{categoryArticleCounts[key]} {t('docs.articles')}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Articles & Resources */}
      <section className="container py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-2xl font-bold">{t('docs.popularArticles')}</h2>
            <div className="space-y-3">
              {Array.isArray(popularArticles) && popularArticles.map((article, index) => (
                <a key={index} href="#" className="flex items-center justify-between rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{article.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{article.views}</span>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="mb-6 text-2xl font-bold">{t('docs.additionalResources')}</h2>
            <div className="space-y-4">
              <div className="rounded-xl border bg-gradient-to-br from-violet-500/10 to-transparent p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-500">
                  <Video className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{t('docs.videoTutorials')}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{t('docs.videoDesc')}</p>
                <Button variant="outline" size="sm">{t('docs.watchNow')}</Button>
              </div>
              
              <div className="rounded-xl border bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-500">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{t('docs.communityForum')}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{t('docs.communityDesc')}</p>
                <Button variant="outline" size="sm">{t('docs.joinCommunity')}</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-2xl font-bold">{t('docs.cantFind')}</h2>
            <p className="mb-6 text-muted-foreground">{t('docs.cantFindDesc')}</p>
            <Button size="lg" asChild>
              <Link to="/support">{t('docs.contactSupport')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DocumentationPage;
