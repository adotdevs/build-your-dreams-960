import { useState } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Briefcase, ArrowRight, Lock, CheckCircle2, Loader2, Building2, Wallet, Users, GraduationCap } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const OCCUPATION_KEYS = [
  { value: "employed", icon: Briefcase },
  { value: "self_employed", icon: Building2 },
  { value: "business_owner", icon: Building2 },
  { value: "executive", icon: Briefcase },
  { value: "liberal_profession", icon: Briefcase },
  { value: "civil_servant", icon: Users },
  { value: "retired", icon: Users },
  { value: "student", icon: GraduationCap },
  { value: "unemployed", icon: Users },
  { value: "investor", icon: Wallet },
  { value: "other", icon: Users },
];

const INCOME_RANGE_KEYS = ["0-15000", "15000-30000", "30000-50000", "50000-75000", "75000-100000", "100000-150000", "150000-250000", "250000+"];
const WEALTH_RANGE_KEYS = ["0-50000", "50000-150000", "150000-300000", "300000-500000", "500000-1000000", "1000000+"];
const INVESTMENT_EXP_KEYS = ["none", "beginner", "intermediate", "experienced", "expert"];
const CRYPTO_EXP_KEYS = ["never", "occasional", "regular", "professional"];
const FUND_SOURCE_KEYS = ["salary", "savings", "inheritance", "real_estate", "investments", "business", "other"];

const FiscalProfile = () => {
  const { t } = useTranslation('auth');
  const [formData, setFormData] = useState({
    occupation: "",
    employer: "",
    incomeRange: "",
    wealthRange: "",
    investmentExperience: "",
    cryptoExperience: "",
    fundSource: "",
    taxResidence: "",
    hasForeignAccounts: "",
    isPoliticallyExposed: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.occupation || !formData.incomeRange) {
      toast({
        title: t('fiscal.submit.requiredTitle'),
        description: t('fiscal.submit.requiredDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            occupation: formData.occupation,
            employer: formData.employer || null,
            income_range: formData.incomeRange,
            wealth_range: formData.wealthRange || null,
            fund_source: formData.fundSource || null,
            investment_experience: formData.investmentExperience || null,
            crypto_experience: formData.cryptoExperience || null,
            tax_residence: formData.taxResidence || null,
            has_foreign_accounts: formData.hasForeignAccounts === 'yes',
            is_politically_exposed: formData.isPoliticallyExposed === 'yes',
          })
          .eq('id', user.id);

        if (error) {
          console.error('Profile update error:', error);
          throw error;
        }
      }

      toast({
        title: t('fiscal.submit.successTitle'),
        description: t('fiscal.submit.successDesc'),
      });
      
      navigate("/kyc");
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: t('fiscal.submit.errorTitle'),
        description: t('fiscal.submit.errorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.occupation && formData.incomeRange;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <SimpleHeader secureLabel={t('fiscal.secureLabel')} />

      {/* Progress */}
      <div className="border-b bg-background">
        <div className="container py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{t('fiscal.stepOf', { current: 1, total: 2 })}</span>
            <span>{t('fiscal.stepName')}</span>
          </div>
          <Progress value={25} className="h-1.5" />
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 text-xl font-bold sm:text-2xl lg:text-3xl">{t('fiscal.title')}</h1>
            <p className="text-muted-foreground">
              {t('fiscal.subtitle')}
            </p>
          </div>

          {/* Info Card */}
          <div className="mb-8 rounded-xl border bg-primary/5 p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-medium text-foreground">{t('fiscal.whyTitle')}</p>
                <p className="text-muted-foreground mt-1">
                  {t('fiscal.whyDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Professional Situation */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <h2 className="mb-4 font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Briefcase className="h-5 w-5 text-primary" />
                {t('fiscal.professional.title')}
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('fiscal.professional.occupation')}</Label>
                  <Select
                    value={formData.occupation}
                    onValueChange={(value) => setFormData({ ...formData, occupation: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('fiscal.professional.occupationPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCUPATION_KEYS.map((occ) => (
                        <SelectItem key={occ.value} value={occ.value}>
                          {t(`fiscal.professional.occupations.${occ.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(formData.occupation === "employed" || formData.occupation === "executive" || formData.occupation === "civil_servant") && (
                  <div className="space-y-2">
                    <Label htmlFor="employer">{t('fiscal.professional.employer')}</Label>
                    <Input
                      id="employer"
                      placeholder={t('fiscal.professional.employerPlaceholder')}
                      value={formData.employer}
                      onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                      className="h-11"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Financial Situation */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                {t('fiscal.financial.title')}
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('fiscal.financial.income')}</Label>
                  <Select
                    value={formData.incomeRange}
                    onValueChange={(value) => setFormData({ ...formData, incomeRange: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('fiscal.financial.incomePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_RANGE_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`fiscal.financial.incomeRanges.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('fiscal.financial.wealth')}</Label>
                  <Select
                    value={formData.wealthRange}
                    onValueChange={(value) => setFormData({ ...formData, wealthRange: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('fiscal.financial.wealthPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {WEALTH_RANGE_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`fiscal.financial.wealthRanges.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('fiscal.financial.fundSource')}</Label>
                  <Select
                    value={formData.fundSource}
                    onValueChange={(value) => setFormData({ ...formData, fundSource: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('fiscal.financial.fundSourcePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {FUND_SOURCE_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`fiscal.financial.fundSources.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Investment Experience */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {t('fiscal.investment.title')}
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('fiscal.investment.experience')}</Label>
                  <Select
                    value={formData.investmentExperience}
                    onValueChange={(value) => setFormData({ ...formData, investmentExperience: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('fiscal.investment.experiencePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_EXP_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`fiscal.investment.levels.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('fiscal.investment.cryptoExperience')}</Label>
                  <Select
                    value={formData.cryptoExperience}
                    onValueChange={(value) => setFormData({ ...formData, cryptoExperience: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('fiscal.investment.cryptoPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CRYPTO_EXP_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`fiscal.investment.cryptoLevels.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tax Compliance */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t('fiscal.tax.title')}
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taxResidence">{t('fiscal.tax.taxResidence')}</Label>
                  <Input
                    id="taxResidence"
                    placeholder={t('fiscal.tax.taxResidencePlaceholder')}
                    value={formData.taxResidence}
                    onChange={(e) => setFormData({ ...formData, taxResidence: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('fiscal.tax.foreignAccounts')}</Label>
                  <Select
                    value={formData.hasForeignAccounts}
                    onValueChange={(value) => setFormData({ ...formData, hasForeignAccounts: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('fiscal.tax.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">{t('fiscal.tax.no')}</SelectItem>
                      <SelectItem value="yes">{t('fiscal.tax.yes')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('fiscal.tax.pep')}</Label>
                  <Select
                    value={formData.isPoliticallyExposed}
                    onValueChange={(value) => setFormData({ ...formData, isPoliticallyExposed: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('fiscal.tax.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">{t('fiscal.tax.no')}</SelectItem>
                      <SelectItem value="yes">{t('fiscal.tax.yes')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('fiscal.tax.pepDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button 
              type="submit" 
              className="h-12 w-full text-base font-semibold"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('fiscal.submit.loading')}
                </>
              ) : (
                <>
                  {t('fiscal.submit.continue')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {t('fiscal.submit.gdpr')}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FiscalProfile;
