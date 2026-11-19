import { useTranslation } from 'react-i18next';

interface PortfolioCardProps {
  totalValue: number;
  change24h: number;
}

const PortfolioCard = ({ totalValue, change24h }: PortfolioCardProps) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">
          {t('portfolio.availableBalance', 'Available Balance')}
        </span>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded">
          Available
        </span>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight">
          €{totalValue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Ready for withdrawal
      </p>
    </div>
  );
};

export default PortfolioCard;
