import { useEffect, useState } from "react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { getCryptoPriceUsd } from "@/lib/crypto-prices";
import { TrendingUp, TrendingDown } from "lucide-react";

const PriceTicker = () => {
  const { prices, isLoading } = useCryptoPrices();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev - 1);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !prices.length) return null;

  // Duplicate prices for seamless loop
  const duplicatedPrices = [...prices, ...prices, ...prices];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 4 : 2
    }).format(price);
  };

  const formatChange = (change: number | null) => {
    if (change === null || change === undefined) return '0.00%';
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  return (
    <div className="w-full bg-card border-b border-border overflow-hidden">
      <div 
        className="flex items-center gap-8 py-2 whitespace-nowrap"
        style={{ 
          transform: `translateX(${offset}px)`,
          width: 'fit-content'
        }}
      >
        {duplicatedPrices.map((crypto, index) => (
          <div 
            key={`${crypto.id}-${index}`}
            className="flex items-center gap-2 px-3"
          >
            <img 
              src={crypto.image} 
              alt={crypto.name}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-sm font-medium">{crypto.symbol.toUpperCase()}</span>
            <span className="text-sm text-muted-foreground">
              {formatPrice(getCryptoPriceUsd(crypto))}
            </span>
            <span className={`text-xs flex items-center gap-0.5 ${
              (crypto.price_change_percentage_24h ?? 0) >= 0 
                ? 'text-emerald-500' 
                : 'text-red-500'
            }`}>
              {(crypto.price_change_percentage_24h ?? 0) >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatChange(crypto.price_change_percentage_24h)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceTicker;
