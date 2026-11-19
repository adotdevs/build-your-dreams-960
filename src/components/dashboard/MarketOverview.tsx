import { useTranslation } from 'react-i18next';
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { CryptoPrice } from "@/hooks/useCryptoPrices";
import { getCryptoPriceUsd } from "@/lib/crypto-prices";

interface MarketOverviewProps {
  prices: CryptoPrice[];
  isLoading: boolean;
}

const MarketOverview = ({ prices, isLoading }: MarketOverviewProps) => {
  const { t } = useTranslation('dashboard');

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm">{t('market.title')}</h2>
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">{t('market.topCryptos')}</h2>
        <p className="text-xs text-muted-foreground">Live prices</p>
      </div>
      
      <div className="divide-y divide-border">
        {prices.slice(0, 5).map((crypto) => {
          const isPositive = crypto.price_change_percentage_24h >= 0;

          return (
            <div
              key={crypto.id}
              className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
            >
              <img
                src={crypto.image}
                alt={crypto.name}
                className="h-8 w-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{crypto.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  ${getCryptoPriceUsd(crypto).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div
                  className={`flex items-center justify-end gap-0.5 text-xs ${
                    isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}
                    {crypto.price_change_percentage_24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketOverview;
