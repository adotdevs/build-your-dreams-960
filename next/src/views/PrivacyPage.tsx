import { useTranslation } from "react-i18next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Shield } from "lucide-react";
import legalDocuments from "@/assets/illustrations/legal-documents.png";

const PrivacyPage = () => {
  const { t } = useTranslation('pages');

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12">
              <div className="relative rounded-2xl overflow-hidden mb-8">
                <img src={typeof legalDocuments === "string" ? legalDocuments : legalDocuments.src} alt="Privacy Protection" className="w-full h-48 md:h-64 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-success/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-success border border-success/20">
                    <Shield className="h-4 w-4" />
                    <span>{t('privacy.badge')}</span>
                  </div>
                  <h1 className="text-4xl font-bold">{t('privacy.title')}</h1>
                  <p className="text-muted-foreground mt-2">{t('privacy.lastUpdated')}</p>
                </div>
              </div>
            </div>

            <div className="prose prose-gray max-w-none dark:prose-invert">
              {/* S1 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('privacy.s1.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('privacy.s1.content')}</p>
              </section>

              {/* S2 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('privacy.s2.title')}</h2>
                <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.s2.personal')}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{t('privacy.s2.personalIntro')}</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {(t('privacy.s2.personalItems', { returnObjects: true }) as string[]).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
                <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.s2.auto')}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{t('privacy.s2.autoIntro')}</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {(t('privacy.s2.autoItems', { returnObjects: true }) as string[]).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>

              {/* S3-S5 with lists */}
              {(["s3", "s4", "s5"] as const).map((key) => {
                const items = t(`privacy.${key}.items`, { returnObjects: true }) as string[];
                return (
                  <section key={key} className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">{t(`privacy.${key}.title`)}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">{t(`privacy.${key}.intro`)}</p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      {Array.isArray(items) && items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                    {key === "s5" && <p className="text-muted-foreground leading-relaxed mt-4">{t('privacy.s5.note')}</p>}
                  </section>
                );
              })}

              {/* S6, S7 simple content */}
              {(["s6", "s7"] as const).map((key) => (
                <section key={key} className="mb-10">
                  <h2 className="text-2xl font-bold mb-4">{t(`privacy.${key}.title`)}</h2>
                  <p className="text-muted-foreground leading-relaxed">{t(`privacy.${key}.content`)}</p>
                </section>
              ))}

              {/* S8 with list */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('privacy.s8.title')}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t('privacy.s8.intro')}</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {(t('privacy.s8.items', { returnObjects: true }) as string[]).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">{t('privacy.s8.note')}</p>
              </section>

              {/* S9 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('privacy.s9.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('privacy.s9.content')}</p>
              </section>

              {/* S10 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('privacy.s10.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('privacy.s10.intro')}</p>
                <div className="mt-4 p-4 rounded-xl bg-muted/50">
                  <p className="font-medium">{t('privacy.s10.role')}</p>
                  <p className="text-muted-foreground">COINLY PTE. LTD.</p>
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

export default PrivacyPage;
