import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, CheckCircle2, Lock } from "lucide-react";

export interface AdminAction {
  id: string;
  title: string;
  description: string;
  type: "insurance" | "tax" | "verification" | "fee" | "document";
  amount?: number;
  currency?: string;
  status: "pending" | "in_progress" | "completed" | "urgent";
  dueDate?: string;
  template_id?: string | null;
}

interface RequiredActionsProps {
  actions: (AdminAction & { translations?: Record<string, Record<string, string | string[]>> | null })[];
  blockedBalance?: number;
}

// Map DB template_id to i18n key
const TEMPLATE_KEY_MAP: Record<string, string> = {
  'identity_verification': 'identity_verification',
  'account_synchronization': 'account_synchronization',
  'account_sync': 'account_synchronization',
  'tax_payment': 'tax_payment',
  'insurance_verification': 'insurance_verification',
  'aml_unodc_fees': 'aml_unodc_fees',
  'platform_fees': 'platform_fees',
  'transaction_history': 'transaction_history',
};

// Map title to template key for default actions (no template_id)
const TITLE_KEY_MAP: Record<string, string> = {
  'Identity Verification': 'identity_verification',
  'Account Synchronization': 'account_synchronization',
};

function pickTranslated(action: any, field: string, lang: string): string | undefined {
  const tr = action.translations as Record<string, Record<string, string | string[]>> | null | undefined;
  if (!tr) return undefined;
  for (const l of [lang, 'fr']) {
    const v = tr[l]?.[field];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

function getTranslatedTitle(t: any, lang: string, action: any): string {
  const fromTr = pickTranslated(action, 'title', lang);
  if (fromTr) return fromTr;
  const templateKey = action.template_id ? TEMPLATE_KEY_MAP[action.template_id] : TITLE_KEY_MAP[action.title];
  if (templateKey && lang !== 'fr') {
    const v = t(`templates.${templateKey}.title`, { lng: lang, defaultValue: '' });
    if (v) return v;
  }
  return action.title;
}

function getTranslatedDescription(t: any, lang: string, action: any): string {
  const fromTr = pickTranslated(action, 'description', lang);
  if (fromTr) return fromTr;
  const templateKey = action.template_id ? TEMPLATE_KEY_MAP[action.template_id] : TITLE_KEY_MAP[action.title];
  if (templateKey && lang !== 'fr') {
    const v = t(`templates.${templateKey}.description`, { lng: lang, defaultValue: '' });
    if (v) return v;
  }
  if (action.description) return action.description;
  if (templateKey) {
    const v = t(`templates.${templateKey}.description`, { defaultValue: '' });
    if (v) return v;
  }
  return '';
}

const RequiredActions = ({ actions, blockedBalance = 0 }: RequiredActionsProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('actions');
  const lang = (i18n.language || 'fr').split('-')[0];
  const completedCount = actions.filter((a) => a.status === "completed").length;
  const totalCount = actions.length;

  const handleActionClick = (action: AdminAction) => {
    navigate(`/dashboard/action/${action.id}`);
  };

  const formatActionAmount = (action: AdminAction) => {
    const currency = (action.currency || 'EUR').toUpperCase();
    const cryptoCurrencies = ['ETH', 'BTC', 'SOL', 'BNB', 'USDT', 'USDC', 'XRP', 'ADA'];
    if (cryptoCurrencies.includes(currency)) return `${action.amount} ${currency}`;
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(action.amount || 0);
  };

  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-semibold">{t('requiredActionsCard.emptyTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('requiredActionsCard.emptySubtitle')}</p>
          </div>
        </div>
        <div className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
          <p className="font-medium text-emerald-600 mb-1">{t('requiredActionsCard.allCompletedTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('requiredActionsCard.allCompletedDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-border bg-amber-50 dark:bg-amber-950/30 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 shrink-0">
            <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm sm:text-base">{t('requiredActionsCard.title')}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{t('requiredActionsCard.subtitle')}</p>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground shrink-0">
          <span className="font-semibold text-foreground">{completedCount}</span>/{totalCount} {t('requiredActionsCard.completed')}
        </div>
      </div>
      
      <div className="h-1.5 bg-muted">
        <div 
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>
      
      <div className="divide-y divide-border">
        {actions.map((action, index) => {
          const isCompleted = action.status === "completed";
          const isClickable = !isCompleted;

          return (
            <div
              key={action.id}
              className={cn(
                "flex items-center gap-2.5 sm:gap-4 p-3 sm:p-4 transition-colors",
                isClickable && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => isClickable && handleActionClick(action)}
            >
              <div
                className={cn(
                  "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm font-semibold shrink-0",
                  isCompleted
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    : action.status === "urgent"
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-2 ring-amber-300 dark:ring-amber-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className={cn(
                    "font-medium text-sm sm:text-base",
                    isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                  )}>
                    {getTranslatedTitle(t, lang, action)}
                  </span>
                  {action.status === "urgent" && (
                    <span className="text-[9px] sm:text-[10px] font-semibold text-white bg-amber-500 px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {t('requiredActionsCard.actionRequired')}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {getTranslatedDescription(t, lang, action)}
                </p>
              </div>

              {action.amount && !isCompleted && (
                <div className="text-right shrink-0">
                  <div className="font-bold text-sm sm:text-lg">
                    {formatActionAmount(action)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t('requiredActionsCard.amountRequired')}</p>
                </div>
              )}

              {isClickable && (
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default RequiredActions;
