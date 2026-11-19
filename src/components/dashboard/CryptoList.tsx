import { useTranslation } from 'react-i18next';
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { CryptoPrice } from "@/hooks/useCryptoPrices";
import { getCryptoPriceUsd } from "@/lib/crypto-prices";

interface CryptoListProps {
  prices: CryptoPrice[];
  isLoading: boolean;
  holdings?: { [key: string]: number };
}

const CryptoList = ({ prices, isLoading, holdings = {} }: CryptoListProps) => {
  const { t } = useTranslation('dashboard');
  
  const defaultHoldings: { [key: string]: number } = {
    bitcoin: 0.15,
    ethereum: 2.5,
    solana: 10,
    binancecoin: 1.2,
    tether: 500,
  };

  const userHoldings = Object.keys(holdings).length > 0 ? holdings : defaultHoldings;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">{t('assets.myPortfolio', 'Portfolio')}</h2>
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredPrices = prices.filter((crypto) => userHoldings[crypto.id]);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold">{t('assets.myPortfolio', 'Portfolio')}</h2>
      </div>
      
      <div className="divide-y divide-border">
        {filteredPrices.map((crypto) => {
          const amount = userHoldings[crypto.id] || 0;
          const value = amount * getCryptoPriceUsd(crypto);
          const isPositive = crypto.price_change_percentage_24h >= 0;

          return (
            <div
              key={crypto.id}
              className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
            >
              <img
                src={crypto.image}
                alt={crypto.name}
                className="h-10 w-10 rounded-full"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{crypto.name}</span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {crypto.symbol}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {amount} {crypto.symbol.toUpperCase()}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-medium text-sm">
                  ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

export default CryptoList;
