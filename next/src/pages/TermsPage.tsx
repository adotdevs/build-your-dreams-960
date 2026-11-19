import { useTranslation } from "react-i18next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { FileText } from "lucide-react";
import legalDocuments from "@/assets/illustrations/legal-documents.png";

const TermsPage = () => {
  const { t } = useTranslation('pages');

  const listSections = ["s2", "s3", "s4", "s6", "s7"] as const;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12">
              <div className="relative rounded-2xl overflow-hidden mb-8">
                <img src={typeof legalDocuments === "string" ? legalDocuments : legalDocuments.src} alt="Legal Documents" className="w-full h-48 md:h-64 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-primary border border-primary/20">
                    <FileText className="h-4 w-4" />
                    <span>{t('terms.badge')}</span>
                  </div>
                  <h1 className="text-4xl font-bold">{t('terms.title')}</h1>
                  <p className="text-muted-foreground mt-2">{t('terms.lastUpdated')}</p>
                </div>
              </div>
            </div>

            <div className="prose prose-gray max-w-none dark:prose-invert">
              {/* Section 1 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('terms.s1.title')}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.s1.p1')}</p>
                <p className="text-muted-foreground leading-relaxed">{t('terms.s1.p2')}</p>
              </section>

              {/* Sections with lists */}
              {listSections.map((key) => {
                const items = t(`terms.${key}.items`, { returnObjects: true }) as string[];
                return (
                  <section key={key} className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">{t(`terms.${key}.title`)}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">{t(`terms.${key}.intro`)}</p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      {Array.isArray(items) && items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                    {key === "s4" && <p className="text-muted-foreground leading-relaxed mt-4">{t('terms.s4.note')}</p>}
                    {key === "s6" && <p className="text-muted-foreground leading-relaxed mt-4 font-medium">{t('terms.s6.warning')}</p>}
                  </section>
                );
              })}

              {/* Section 5 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('terms.s5.title')}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.s5.p1')}</p>
                <p className="text-muted-foreground leading-relaxed">{t('terms.s5.p2')}</p>
              </section>

              {/* Section 8 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('terms.s8.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('terms.s8.content')}</p>
              </section>

              {/* Section 9 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('terms.s9.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('terms.s9.content')}</p>
              </section>

              {/* Section 10 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('terms.s10.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('terms.s10.intro')}</p>
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

export default TermsPage;
