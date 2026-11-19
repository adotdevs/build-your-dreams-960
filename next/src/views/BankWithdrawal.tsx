import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import PriceTicker from "@/components/dashboard/PriceTicker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Landmark, AlertCircle, CheckCircle2, Save, Send, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { BANK_COUNTRIES, BANKS_BY_COUNTRY, ONLINE_BANKS } from "@/data/banksByCountry";

const MAX_DAILY_WITHDRAWAL = 1_000_000;

const BankWithdrawal = () => {
  const { t } = useTranslation('dashboard');
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [availableBalance, setAvailableBalance] = useState(0);
  const [blockedBalance, setBlockedBalance] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [bankCountry, setBankCountry] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [bankInfoSaved, setBankInfoSaved] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => { if (!authLoading && !user) navigate("/login"); }, [user, authLoading, navigate]);
  useEffect(() => { if (user) { fetchBalance(); fetchBankAccount(); } }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('profiles').select('available_balance, blocked_balance').eq('id', user.id).maybeSingle();
      if (data) {
        setAvailableBalance(parseFloat(data.available_balance?.toString() || '0'));
        setBlockedBalance(parseFloat(data.blocked_balance?.toString() || '0'));
      }
    } catch (err) { console.error(err); } finally { setIsLoadingProfile(false); }
  };

  const fetchBankAccount = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('bank_accounts' as any).select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        const d = data as any;
        setBankCountry(d.bank_country); setBankName(d.bank_name); setAccountHolder(d.account_holder);
        setIban(d.iban); setBic(d.bic); setBankInfoSaved(true);
      }
    } catch (err) { console.error(err); }
  };

  const bankList = bankCountry === "__online__" ? ONLINE_BANKS : BANKS_BY_COUNTRY[bankCountry] || [];
  const canSaveBank = bankCountry !== "" && bankName !== "" && accountHolder.trim().length > 0 && iban.trim().length >= 15 && bic.trim().length >= 8;

  const handleSaveBank = async () => {
    if (!canSaveBank || !user) return;
    setIsSavingBank(true);
    try {
      const { data: existing } = await supabase.from('bank_accounts' as any).select('id').eq('user_id', user.id).maybeSingle();
      const bankData = { user_id: user.id, account_holder: accountHolder.trim(), bank_name: bankName, bank_country: bankCountry, iban: iban.trim(), bic: bic.trim() };
      if (existing) { await supabase.from('bank_accounts' as any).update(bankData).eq('id', (existing as any).id); }
      else { await supabase.from('bank_accounts' as any).insert(bankData); }
      setBankInfoSaved(true);
      toast.success(t('bankWithdrawal.bankSaveSuccess'));
    } catch (err) { console.error(err); toast.error(t('bankWithdrawal.bankSaveError')); } finally { setIsSavingBank(false); }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const canSubmit = bankInfoSaved && parsedAmount > 0 && parsedAmount <= availableBalance && parsedAmount <= MAX_DAILY_WITHDRAWAL && availableBalance > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;
    setIsSubmitting(true);
    try {
      const description = `Retrait bancaire - ${bankName} (${bankCountry}) - IBAN: ${iban.slice(-4).padStart(iban.length, '*')}`;
      const { error } = await supabase.rpc('process_withdrawal_request', { p_amount: parsedAmount, p_description: description });
      if (error) throw error;
      setSubmitted(true);
      toast.success(t('bankWithdrawal.withdrawalSuccess'));
    } catch (err) { console.error(err); toast.error(t('bankWithdrawal.withdrawalError')); } finally { setIsSubmitting(false); }
  };

  if (authLoading || isLoadingProfile) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <PriceTicker />
        <MobileNav />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-full overflow-hidden">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Landmark className="h-6 w-6 text-primary" />
                {t('bankWithdrawal.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('bankWithdrawal.subtitle', { limit: MAX_DAILY_WITHDRAWAL.toLocaleString() + ' €' })}
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bankWithdrawal.availableBalance')}</p>
                    <p className="text-2xl font-bold text-foreground">{availableBalance.toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                  {blockedBalance > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t('bankWithdrawal.blockedFunds')}</p>
                      <p className="text-lg font-semibold text-destructive">{blockedBalance.toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}</p>
                    </div>
                  )}
                </div>
                {availableBalance === 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{t('bankWithdrawal.noFunds')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {submitted ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <h2 className="text-xl font-semibold text-foreground">{t('bankWithdrawal.requestSent')}</h2>
                    <p className="text-muted-foreground max-w-md" dangerouslySetInnerHTML={{ __html: t('bankWithdrawal.requestSentDesc', { amount: parsedAmount.toLocaleString(undefined, { style: 'currency', currency: 'EUR' }), bank: bankName }) }} />
                    <Button onClick={() => navigate('/dashboard')} className="mt-4">{t('bankWithdrawal.backToDashboard')}</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <Card className={bankInfoSaved ? "border-green-500/40 bg-green-50/50 dark:bg-green-950/20" : ""}>
                    {bankInfoSaved ? (
                      <>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400"><BadgeCheck className="h-5 w-5" />{t('bankWithdrawal.bankSaved')}</CardTitle>
                          <CardDescription className="text-green-600/80 dark:text-green-400/70">{t('bankWithdrawal.bankSavedDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="rounded-md border border-green-200 dark:border-green-800 bg-white/60 dark:bg-background/40 p-4 space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('bankWithdrawal.holder')}</span><span className="font-medium text-foreground">{accountHolder}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('bankWithdrawal.bank')}</span><span className="font-medium text-foreground">{bankName}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('bankWithdrawal.country')}</span><span className="font-medium text-foreground">{bankCountry === "__online__" ? t('bankWithdrawal.onlineBank') : BANK_COUNTRIES.find(c => c.code === bankCountry)?.label || bankCountry}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">IBAN</span><span className="font-medium font-mono text-foreground text-xs">{iban.slice(0, 4)}{"••••"}{iban.slice(-4)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">BIC / SWIFT</span><span className="font-medium font-mono text-foreground text-xs">{bic}</span></div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-100/60 dark:bg-green-900/30 rounded-md p-2.5">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>{t('bankWithdrawal.confirmation')}</span>
                          </div>
                          <Button variant="outline" className="w-full border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40" onClick={() => setBankInfoSaved(false)}>{t('bankWithdrawal.editBankInfo')}</Button>
                        </CardContent>
                      </>
                    ) : (
                      <>
                        <CardHeader>
                          <CardTitle className="text-lg">{t('bankWithdrawal.bankInfo')}</CardTitle>
                          <CardDescription>{t('bankWithdrawal.bankInfoDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>{t('bankWithdrawal.bankCountry')}</Label>
                            <Select value={bankCountry} onValueChange={(v) => { setBankCountry(v); setBankName(""); }}>
                              <SelectTrigger><SelectValue placeholder={t('bankWithdrawal.selectCountry')} /></SelectTrigger>
                              <SelectContent>
                                {BANK_COUNTRIES.map((c) => (<SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>))}
                                <SelectItem value="__online__">{t('bankWithdrawal.onlineBankFintech')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {bankCountry && (
                            <div className="space-y-2">
                              <Label>{t('bankWithdrawal.selectBank')}</Label>
                              <Select value={bankName} onValueChange={setBankName}>
                                <SelectTrigger><SelectValue placeholder={t('bankWithdrawal.selectBankPlaceholder')} /></SelectTrigger>
                                <SelectContent>{bankList.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="accountHolder">{t('bankWithdrawal.accountHolder')}</Label>
                            <Input id="accountHolder" placeholder={t('bankWithdrawal.accountHolderPlaceholder')} value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} required maxLength={100} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="iban">{t('bankWithdrawal.ibanLabel')}</Label>
                            <Input id="iban" placeholder="FR76 3000 1007 9412 3456 7890 185" value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} required maxLength={34} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bic">{t('bankWithdrawal.bicLabel')}</Label>
                            <Input id="bic" placeholder="BNPAFRPP" value={bic} onChange={(e) => setBic(e.target.value.toUpperCase())} required maxLength={11} />
                          </div>
                          <Button className="w-full" onClick={handleSaveBank} disabled={!canSaveBank || isSavingBank}>
                            {isSavingBank ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('bankWithdrawal.saving')}</>) : (<><Save className="h-4 w-4 mr-2" />{t('bankWithdrawal.saveBankInfo')}</>)}
                          </Button>
                        </CardContent>
                      </>
                    )}
                  </Card>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <form onSubmit={handleSubmit}>
                    <Card className={!bankInfoSaved ? "opacity-60 pointer-events-none" : ""}>
                      <CardHeader>
                        <CardTitle className="text-lg">{t('bankWithdrawal.withdrawalAmount')}</CardTitle>
                        <CardDescription>{t('bankWithdrawal.maximum', { amount: Math.min(availableBalance, MAX_DAILY_WITHDRAWAL).toLocaleString(undefined, { style: 'currency', currency: 'EUR' }) })}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">{t('bankWithdrawal.amountLabel')}</Label>
                          <Input id="amount" type="number" placeholder="0.00" min="0" max={Math.min(availableBalance, MAX_DAILY_WITHDRAWAL)} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required disabled={availableBalance === 0} />
                          {parsedAmount > availableBalance && availableBalance > 0 && <p className="text-sm text-destructive">{t('bankWithdrawal.exceedsBalance')}</p>}
                          {parsedAmount > MAX_DAILY_WITHDRAWAL && <p className="text-sm text-destructive">{t('bankWithdrawal.exceedsLimit', { limit: MAX_DAILY_WITHDRAWAL.toLocaleString() + ' €' })}</p>}
                        </div>
                        {!bankInfoSaved && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                            <AlertCircle className="h-4 w-4 shrink-0" /><span>{t('bankWithdrawal.saveBankFirst')}</span>
                          </div>
                        )}
                        {bankInfoSaved && (
                          <div className="rounded-md border border-border p-3 space-y-1 text-sm">
                            <p className="font-medium text-foreground">{t('bankWithdrawal.destinationAccount')}</p>
                            <p className="text-muted-foreground">{accountHolder}</p>
                            <p className="text-muted-foreground">{bankName}</p>
                            <p className="text-muted-foreground font-mono text-xs">IBAN: {iban.slice(0, 4)}****{iban.slice(-4)}</p>
                          </div>
                        )}
                        <Button type="submit" className="w-full" size="lg" disabled={!canSubmit || isSubmitting}>
                          {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('bankWithdrawal.submitting')}</>) : (<><Send className="h-4 w-4 mr-2" />{t('bankWithdrawal.requestWithdrawal')}</>)}
                        </Button>
                      </CardContent>
                    </Card>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
};

export default BankWithdrawal;
