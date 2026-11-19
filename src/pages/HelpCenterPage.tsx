import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, Clock, ChevronRight, Search, Headphones, FileQuestion, CreditCard, Lock, Smartphone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const HelpCenterPage = () => {
  const { t } = useTranslation('pages');

  const categoryKeys = ["deposits", "security", "trading", "mobile", "kyc", "technical"] as const;
  const categoryIcons = { deposits: CreditCard, security: Lock, trading: FileQuestion, mobile: Smartphone, kyc: Globe, technical: Headphones };
  const categoryArticles = { deposits: 12, security: 18, trading: 15, mobile: 8, kyc: 10, technical: 14 };

  const faqItems = t('help.faq', { returnObjects: true }) as { q: string; a: string }[];

  const contactKeys = ["liveChat", "email", "phone"] as const;
  const contactIcons = { liveChat: MessageCircle, email: Mail, phone: Phone };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-emerald-500/10 via-background to-cyan-500/10">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="container relative py-20 lg:py-28">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t('help.backToHome')}
          </Link>
          
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 text-sm backdrop-blur-sm">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>{t('help.badge')}</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              {t('help.title')}{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                {t('help.titleHighlight')}
              </span>
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground">{t('help.subtitle')}</p>
            
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" placeholder={t('help.searchPlaceholder')} className="h-14 pl-12 pr-4 text-base shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <h2 className="mb-8 text-2xl font-bold">{t('help.browseByTopic')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryKeys.map((key) => {
            const Icon = categoryIcons[key];
            return (
              <a key={key} href="#" className="group flex items-start gap-4 rounded-xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-semibold group-hover:text-primary">{t(`help.categories.${key}.title`)}</h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">{t(`help.categories.${key}.description`)}</p>
                  <span className="text-xs text-muted-foreground">{categoryArticles[key]} {t('help.articles')}</span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y bg-muted/30">
        <div className="container py-16">
          <h2 className="mb-8 text-2xl font-bold">{t('help.faqTitle')}</h2>
          <div className="mx-auto max-w-3xl space-y-4">
            {Array.isArray(faqItems) && faqItems.map((item, index) => (
              <div key={index} className="rounded-xl border bg-card p-6">
                <h3 className="mb-3 font-semibold">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/features">{t('help.viewAllFaqs')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="container py-16">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">{t('help.stillNeedHelp')}</h2>
          <p className="text-muted-foreground">{t('help.choosePreferred')}</p>
        </div>
        
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {contactKeys.map((key, index) => {
            const Icon = contactIcons[key];
            const isPrimary = index === 0;
            return (
              <div key={key} className={`rounded-xl border p-6 text-center ${isPrimary ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isPrimary ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{t(`help.contact.${key}.title`)}</h3>
                <p className="mb-3 text-sm text-muted-foreground">{t(`help.contact.${key}.description`)}</p>
                <div className="mb-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{t(`help.contact.${key}.availability`)}</span>
                </div>
                <Button variant={isPrimary ? "default" : "outline"} className="w-full">
                  {t(`help.contact.${key}.action`)}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Status Banner */}
      <section className="border-t bg-muted/30">
        <div className="container py-8">
          <div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-card p-6 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                <div className="h-3 w-3 animate-pulse rounded-full bg-success" />
              </div>
              <div>
                <p className="font-semibold">{t('help.allSystemsOp')}</p>
                <p className="text-sm text-muted-foreground">{t('help.lastUpdated')}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{t('help.viewStatus')}</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenterPage;
