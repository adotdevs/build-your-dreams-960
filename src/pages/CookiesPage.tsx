import { useTranslation } from "react-i18next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Cookie } from "lucide-react";
import legalDocuments from "@/assets/illustrations/legal-documents.png";

const CookiesPage = () => {
  const { t } = useTranslation('pages');

  const cookieKeys = ["essential", "performance", "functional", "marketing"] as const;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12">
              <div className="relative rounded-2xl overflow-hidden mb-8">
                <img src={legalDocuments} alt="Cookie Policy" className="w-full h-48 md:h-64 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-warning/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-warning border border-warning/20">
                    <Cookie className="h-4 w-4" />
                    <span>{t('cookies.badge')}</span>
                  </div>
                  <h1 className="text-4xl font-bold">{t('cookies.title')}</h1>
                  <p className="text-muted-foreground mt-2">{t('cookies.lastUpdated')}</p>
                </div>
              </div>
            </div>

            <div className="prose prose-gray max-w-none dark:prose-invert">
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('cookies.whatAre')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('cookies.whatAreDesc')}</p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('cookies.howWeUse')}</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">{t('cookies.howWeUseDesc')}</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {(t('cookies.howWeUseItems', { returnObjects: true }) as string[]).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('cookies.types')}</h2>
                <div className="space-y-4">
                  {cookieKeys.map((key) => {
                    const examples = t(`cookies.${key}.examples`, { returnObjects: true }) as string[];
                    return (
                      <div key={key} className="rounded-xl border bg-background p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold">{t(`cookies.${key}.name`)}</h3>
                          {key === "essential" && (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {t('cookies.essential.required')}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-3">{t(`cookies.${key}.description`)}</p>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(examples) && examples.map((ex) => (
                            <span key={ex} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{ex}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('cookies.thirdParty')}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t('cookies.thirdPartyDesc')}</p>
                <div className="rounded-xl border bg-background p-6">
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center"><span className="font-medium">Google Analytics</span><span className="text-sm text-muted-foreground">{t('cookies.performanceAnalytics')}</span></li>
                    <li className="flex justify-between items-center"><span className="font-medium">Cloudflare</span><span className="text-sm text-muted-foreground">{t('cookies.securityPerformance')}</span></li>
                    <li className="flex justify-between items-center"><span className="font-medium">Intercom</span><span className="text-sm text-muted-foreground">{t('cookies.customerSupportLabel')}</span></li>
                    <li className="flex justify-between items-center"><span className="font-medium">Stripe</span><span className="text-sm text-muted-foreground">{t('cookies.paymentProcessing')}</span></li>
                  </ul>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('cookies.managing')}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t('cookies.managingDesc')}</p>
                <div className="space-y-4">
                  <div className="rounded-xl border bg-background p-6">
                    <h3 className="font-semibold mb-2">{t('cookies.browserSettings')}</h3>
                    <p className="text-muted-foreground text-sm">{t('cookies.browserSettingsDesc')}</p>
                  </div>
                  <div className="rounded-xl border bg-background p-6">
                    <h3 className="font-semibold mb-2">{t('cookies.cookieConsent')}</h3>
                    <p className="text-muted-foreground text-sm">{t('cookies.cookieConsentDesc')}</p>
                  </div>
                  <div className="rounded-xl border bg-background p-6">
                    <h3 className="font-semibold mb-2">{t('cookies.optOutLinks')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('cookies.optOutLinksDesc')}{' '}
                      <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary ml-1">tools.google.com/dlpage/gaoptout</a>
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('cookies.retention')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('cookies.retentionDesc')}</p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('cookies.updates')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('cookies.updatesDesc')}</p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('cookies.contactUs')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('cookies.contactUsDesc')}</p>
                <div className="mt-4 p-4 rounded-xl bg-muted/50">
                  <p className="font-medium">COINLY PTE. LTD.</p>
                  <p className="text-muted-foreground">UEN: 202213565G</p>
                  <p className="text-muted-foreground">151 Chin Swee Road, #02-24, Manhattan House</p>
                  <p className="text-muted-foreground">Singapore 169876</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiesPage;
