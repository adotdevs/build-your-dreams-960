import { useTranslation } from 'react-i18next';
import { AlertCircle } from "lucide-react";

interface BlockedFundsCardProps {
  blockedAmount: number;
  currency?: string;
}

const BlockedFundsCard = ({ blockedAmount, currency = "EUR" }: BlockedFundsCardProps) => {
  const { t } = useTranslation('dashboard');

  if (blockedAmount <= 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">
          {t('portfolio.blockedFunds')}
        </span>
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded">
          Pending
        </span>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight">
          €{blockedAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      
      <div className="flex items-start gap-2 mt-4 text-sm text-amber-800 dark:text-amber-300">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Complete the required steps below to unlock these funds.
        </p>
      </div>
    </div>
  );
};

export default BlockedFundsCard;
