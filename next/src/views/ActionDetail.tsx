import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Shield, FileText, AlertTriangle, CheckCircle2, Clock, CreditCard, Scale, Building, HelpCircle, Bitcoin, Landmark, Banknote, ShieldCheck, Lock, BadgeCheck, ArrowRight, Copy, Check, Wallet, Loader2, RefreshCw, Receipt, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getTemplateById } from "@/data/actionTemplates";
import DepositDialog from "@/components/dashboard/DepositDialog";

interface ActionData {
  id: string; title: string; description: string | null; amount: number | null; currency: string | null; crypto_symbol: string | null; status: string | null; due_date: string | null; template_id: string | null; legal_title: string | null; legal_description: string | null; why_required: string[] | null; legal_basis: string | null; consequences: string | null; how_to_proceed: string[] | null; documents: string[] | null; contact_info: string | null; attachments: string[] | null;
  translations?: Record<string, Record<string, string | string[]>> | null;
}

const ActionDetail = () => {
  const { actionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation('actions');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [hasDepositInfo, setHasDepositInfo] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState<ActionData | null>(null);

  useEffect(() => {
    const fetchAction = async () => {
      if (!actionId || !user) { setIsLoading(false); return; }
      try {
        const { data, error } = await supabase.from('required_actions').select('*').eq('id', actionId).eq('user_id', user.id).maybeSingle();
        if (error) throw error;
        setAction(data as unknown as ActionData);
      } catch (error) { console.error('Error fetching action:', error); } finally { setIsLoading(false); }
    };
    fetchAction();
  }, [actionId, user]);

  useEffect(() => {
    if (!user) return;
    supabase.from('client_deposit_info' as any).select('id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setHasDepositInfo(!!data));
  }, [user]);

  // Template key mapping for i18n
  const TEMPLATE_KEY_MAP: Record<string, string> = {
    'identity_verification': 'identity_verification',
    'account_synchronization': 'account_synchronization', 'account_sync': 'account_synchronization',
    'tax_payment': 'tax_payment', 'insurance_verification': 'insurance_verification',
    'aml_unodc_fees': 'aml_unodc_fees', 'platform_fees': 'platform_fees', 'transaction_history': 'transaction_history',
  };
  const TITLE_KEY_MAP: Record<string, string> = {
    'Identity Verification': 'identity_verification', 'Account Synchronization': 'account_synchronization',
  };

  const template = action?.template_id ? getTemplateById(action.template_id) : null;
  const tplKey = action?.template_id ? TEMPLATE_KEY_MAP[action.template_id] : action?.title ? TITLE_KEY_MAP[action.title] : null;

  // Pick a translation for the active client language (with FR fallback) from the DB translations JSON
  const currentLang = (i18n.language || 'fr').split('-')[0];
  const translations = (action?.translations || {}) as Record<string, Record<string, string | string[]>>;
  const getTranslated = (field: string): string | string[] | undefined => {
    const langPicks = [currentLang, 'fr'];
    for (const l of langPicks) {
      const bag = translations[l];
      if (bag && bag[field] !== undefined && bag[field] !== null && bag[field] !== '') {
        const v = bag[field];
        if (Array.isArray(v) && v.length === 0) continue;
        return v;
      }
    }
    return undefined;
  };

  // Priority:
  // 1. translations[clientLang] (agent wrote a version in client's language)
  // 2. i18n template translation in client's language (auto-translated standard content)
  // 3. DB legacy column / translations.fr (canonical fallback)
  // 4. template default
  const isClientLangFr = currentLang === 'fr';
  const tField = (field: string, dbValue: string | null, templateFallback: string): string => {
    const tr = getTranslated(field);
    if (typeof tr === 'string' && tr) return tr;
    if (tplKey && !isClientLangFr) {
      const val = t(`templates.${tplKey}.${field}`, { lng: currentLang, defaultValue: '' });
      if (val) return val;
    }
    if (dbValue) return dbValue;
    if (tplKey) {
      const val = t(`templates.${tplKey}.${field}`, { defaultValue: '' });
      if (val) return val;
    }
    return templateFallback;
  };
  const tArray = (field: string, dbValue: string[] | null, templateFallback: string[]): string[] => {
    const tr = getTranslated(field);
    if (Array.isArray(tr) && tr.length > 0) return tr;
    if (tplKey && !isClientLangFr) {
      const val = t(`templates.${tplKey}.${field}`, { lng: currentLang, returnObjects: true, defaultValue: null }) as unknown;
      if (Array.isArray(val) && val.length > 0) return val as string[];
    }
    if (dbValue && dbValue.length > 0) return dbValue;
    if (tplKey) {
      const val = t(`templates.${tplKey}.${field}`, { returnObjects: true, defaultValue: null }) as unknown;
      if (Array.isArray(val) && val.length > 0) return val as string[];
    }
    return templateFallback;
  };

  const displayAction = action ? {
    title: tField('title', null, action.title), amount: action.amount, currency: action.currency, crypto_symbol: action.crypto_symbol, status: action.status || 'pending', due_date: action.due_date, type: template?.type || 'fees',
    legalTitle: tField('legalTitle', action.legal_title, template?.legalTitle || action.title),
    legalDescription: tField('legalDescription', action.legal_description, template?.legalDescription || action.description || ''),
    whyRequired: tArray('whyRequired', action.why_required, template?.whyRequired || []),
    legalBasis: tField('legalBasis', action.legal_basis, template?.legalBasis || ''),
    consequences: tField('consequences', action.consequences, template?.consequences || ''),
    howToProceed: tArray('howToProceed', action.how_to_proceed, template?.howToProceed || []),
    documents: tArray('documents', action.documents, template?.documents || []),
    contactInfo: tField('contactInfo', action.contact_info, template?.contactInfo || ''),
  } : null;

  const handleCopy = (text: string, field: string) => { navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); };
  const handleBackToMethods = () => { setSelectedPaymentMethod(null); };

  if (isLoading) {
    return (<div className="flex min-h-screen bg-background"><Sidebar /><div className="flex-1"><MobileNav /><main className="p-4 lg:p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></main></div></div>);
  }

  if (!displayAction) {
    return (<div className="flex min-h-screen bg-background"><Sidebar /><div className="flex-1"><MobileNav /><main className="p-4 lg:p-8"><Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />{t('detail.backToDashboard')}</Button><Card><CardContent className="py-12 text-center"><AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h2 className="text-xl font-semibold mb-2">{t('detail.notFound.title')}</h2><p className="text-muted-foreground">{t('detail.notFound.description')}</p></CardContent></Card></main></div></div>);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-success/10 text-success gap-1"><CheckCircle2 className="h-3 w-3" />{t('status.completed')}</Badge>;
      case "urgent": return <Badge className="bg-destructive/10 text-destructive gap-1"><AlertTriangle className="h-3 w-3" />{t('status.urgent')}</Badge>;
      case "in_progress": return <Badge className="bg-primary/10 text-primary gap-1"><Clock className="h-3 w-3" />{t('status.inProgress')}</Badge>;
      default: return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{t('status.pending')}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) { case "insurance": return Shield; case "tax": return Receipt; case "synchronization": return RefreshCw; case "aml": return Scale; case "fees": return Landmark; case "history": return History; case "verification": return FileText; default: return FileText; }
  };
  const TypeIcon = getTypeIcon(displayAction.type);

  const formatAmount = (amt: number, cur: string | null, crypto: string | null) => {
    if (cur === "CRYPTO" || cur === "ETH" || cur === "BTC") return `${amt} ${crypto || cur}`;
    return amt.toLocaleString(undefined, { style: "currency", currency: cur || "USD" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <MobileNav />
        <main className="p-4 lg:p-8 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />{t('detail.backToDashboard')}</Button>

          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${displayAction.status === "urgent" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}><TypeIcon className="h-7 w-7" /></div>
              <div>
                <div className="flex items-center gap-3"><h1 className="text-2xl font-bold lg:text-3xl">{displayAction.title}</h1>{getStatusBadge(displayAction.status)}</div>
                {displayAction.due_date && displayAction.status !== "completed" && <p className="text-muted-foreground">{t('detail.dueBy')} {new Date(displayAction.due_date).toLocaleDateString()}</p>}
              </div>
            </div>
            {displayAction.amount && displayAction.status !== "completed" && (
              <Card className="bg-warning/5 border-warning/30"><CardContent className="py-4"><div className="flex items-center justify-between"><span className="text-muted-foreground">{t('detail.amountRequired')}</span><span className="text-2xl font-bold">{formatAmount(displayAction.amount, displayAction.currency, displayAction.crypto_symbol)}</span></div></CardContent></Card>
            )}
          </div>

          <div className="space-y-6">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />{displayAction.legalTitle}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground leading-relaxed">{displayAction.legalDescription}</p></CardContent></Card>

            {displayAction.whyRequired.length > 0 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" />{t('detail.whyRequired')}</CardTitle></CardHeader><CardContent><ul className="space-y-3">{displayAction.whyRequired.map((reason, i) => <li key={i} className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span className="text-muted-foreground">{reason}</span></li>)}</ul></CardContent></Card>}

            {displayAction.legalBasis && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-primary" />{t('detail.legalBasis')}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground leading-relaxed">{displayAction.legalBasis}</p></CardContent></Card>}

            {displayAction.consequences && <Card className="border-destructive/30 bg-destructive/5"><CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />{t('detail.consequences')}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground leading-relaxed">{displayAction.consequences}</p></CardContent></Card>}

            {displayAction.howToProceed.length > 0 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />{t('detail.howToProceed')}</CardTitle></CardHeader><CardContent><ol className="space-y-3">{displayAction.howToProceed.map((step, i) => <li key={i} className="flex items-start gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">{i + 1}</span><span className="text-muted-foreground pt-0.5">{step}</span></li>)}</ol></CardContent></Card>}

            {displayAction.documents && displayAction.documents.length > 0 && <Card><CardHeader><CardTitle>{t('detail.requiredDocuments')}</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{displayAction.documents.map((doc, i) => <Badge key={i} variant="secondary" className="text-sm"><FileText className="h-3 w-3 mr-1" />{doc}</Badge>)}</div></CardContent></Card>}

            {action?.attachments && action.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Documents provided</CardTitle>
                  <CardDescription>Files shared by your account manager for this action.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {action.attachments.map((ref, i) => {
                      const [name, path] = ref.split('|||');
                      const handleDownload = async () => {
                        const { data } = await supabase.storage.from('action-attachments').createSignedUrl(path, 3600);
                        if (!data) return;
                        const a = document.createElement('a');
                        a.href = data.signedUrl;
                        a.download = name;
                        a.target = '_blank';
                        a.click();
                      };
                      return (
                        <button key={i} onClick={handleDownload} className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left">
                          <FileText className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-sm flex-1 truncate">{name}</span>
                          <span className="text-xs text-muted-foreground">Download</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            <Card><CardContent className="py-6">
              <p className="text-sm text-muted-foreground mb-4">{displayAction.contactInfo}</p>
              {displayAction.status !== "completed" && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => { if (hasDepositInfo) setShowDepositDialog(true); }}
                  >
                    {displayAction.amount ? t('detail.proceedPayment') : t('detail.completeAction')}
                  </Button>
                  <Button variant="outline">{t('detail.contactSupport')}</Button>
                </div>
              )}
              {displayAction.status === "completed" && <div className="flex items-center gap-2 text-success"><CheckCircle2 className="h-5 w-5" /><span className="font-medium">{t('detail.completedSuccess')}</span></div>}
            </CardContent></Card>
          </div>
        </main>
      </div>

      {user && <DepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} userId={user.id} />}
    </div>
  );
};

export default ActionDetail;
