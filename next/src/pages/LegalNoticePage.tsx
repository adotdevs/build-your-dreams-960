import { useTranslation } from "react-i18next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Building2 } from "lucide-react";
import legalDocuments from "@/assets/illustrations/legal-documents.png";

const LegalNoticePage = () => {
  const { t } = useTranslation('pages');

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
                    <Building2 className="h-4 w-4" />
                    <span>{t('legal.badge')}</span>
                  </div>
                  <h1 className="text-4xl font-bold">{t('legal.title')}</h1>
                  <p className="text-muted-foreground mt-2">{t('legal.subtitle')}</p>
                </div>
              </div>
            </div>

            <div className="prose prose-gray max-w-none dark:prose-invert">
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('legal.companyInfo')}</h2>
                <div className="rounded-xl border bg-background p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><p className="text-sm text-muted-foreground">{t('legal.companyName')}</p><p className="font-semibold">COINLY PTE. LTD.</p></div>
                    <div><p className="text-sm text-muted-foreground">UEN</p><p className="font-semibold">202213565G</p></div>
                    <div><p className="text-sm text-muted-foreground">{t('legal.companyType')}</p><p className="font-semibold">Local Company</p></div>
                    <div><p className="text-sm text-muted-foreground">{t('legal.jurisdiction')}</p><p className="font-semibold">Singapore</p></div>
                    <div><p className="text-sm text-muted-foreground">UEN Issue Date</p><p className="font-semibold">2022-04-19</p></div>
                    <div><p className="text-sm text-muted-foreground">Issuance Agency</p><p className="font-semibold">ACRA</p></div>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('legal.registeredOffice')}</h2>
                <div className="rounded-xl border bg-background p-6">
                  <p className="font-semibold">COINLY PTE. LTD.</p>
                  <p className="text-muted-foreground">151 Chin Swee Road, #02-24</p>
                  <p className="text-muted-foreground">Manhattan House</p>
                  <p className="text-muted-foreground">Singapore 169876</p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('legal.regulatoryStatus')}</h2>
                <div className="space-y-4">
                  <div className="rounded-xl border bg-background p-6">
                    <h3 className="font-semibold mb-2">Monetary Authority of Singapore (MAS)</h3>
                    <p className="text-muted-foreground mb-2">COINLY PTE. LTD. operates under the regulatory framework of the Monetary Authority of Singapore.</p>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('legal.disclaimer')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('legal.disclaimerContent')}</p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('legal.disclaimer')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('legal.disclaimerContent')}</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalNoticePage;
