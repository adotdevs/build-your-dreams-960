import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Building2, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

interface DepositInfo {
  bank_name: string;
  account_holder: string;
  iban: string;
  bic: string | null;
  reference: string | null;
  currency: string;
  min_amount: number | null;
  max_amount: number | null;
  instructions: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const DepositDialog = ({ open, onOpenChange, userId }: Props) => {
  const { t } = useTranslation('dashboard');
  const [info, setInfo] = useState<DepositInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('client_deposit_info' as any)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setInfo(data as any);
        setLoading(false);
      });
  }, [open, userId]);

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success(t('deposit.copied', { defaultValue: 'Copied' }));
    setTimeout(() => setCopied(null), 1500);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: info?.currency || 'EUR', maximumFractionDigits: 0 }).format(n);

  const Row = ({ label, value, copyKey }: { label: string; value: string; copyKey: string }) => (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium font-mono truncate">{value}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copy(value, copyKey)}>
        {copied === copyKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t('deposit.title', { defaultValue: 'Bank Deposit Details' })}
          </DialogTitle>
          <DialogDescription>
            {t('deposit.subtitle', { defaultValue: 'Use these bank details to fund your account.' })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !info ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t('deposit.empty', { defaultValue: 'No deposit information is available at the moment. Please contact support.' })}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border bg-card px-4">
              <Row label={t('deposit.bankName', { defaultValue: 'Bank' })} value={info.bank_name} copyKey="bank" />
              <Row label={t('deposit.accountHolder', { defaultValue: 'Account Holder' })} value={info.account_holder} copyKey="holder" />
              <Row label="IBAN" value={info.iban} copyKey="iban" />
              {info.bic && <Row label="BIC / SWIFT" value={info.bic} copyKey="bic" />}
              {info.reference && <Row label={t('deposit.reference', { defaultValue: 'Reference' })} value={info.reference} copyKey="ref" />}
            </div>

            <div className="rounded-lg bg-muted/50 p-3 flex gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {(info.min_amount || info.max_amount) && (
                  <p>
                    {t('deposit.limits', { defaultValue: 'Limits' })}:{' '}
                    {info.min_amount ? `min ${fmt(Number(info.min_amount))}` : ''}
                    {info.min_amount && info.max_amount ? ' — ' : ''}
                    {info.max_amount ? `max ${fmt(Number(info.max_amount))}` : ''}
                  </p>
                )}
                {info.instructions && <p className="whitespace-pre-line">{info.instructions}</p>}
                {!info.instructions && (
                  <p>
                    {t('deposit.defaultNote', {
                      defaultValue: 'Always include the reference above so we can credit your account. Funds usually arrive within 1-3 business days.',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepositDialog;
