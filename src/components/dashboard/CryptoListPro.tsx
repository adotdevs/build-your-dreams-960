import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCryptoPriceUsd } from "@/lib/crypto-prices";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price_usd?: number;
  current_price_eur?: number;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  sparkline_in_7d?: { price: number[] };
}

interface CryptoListProProps {
  prices: CryptoPrice[];
  isLoading: boolean;
  holdings?: { [key: string]: number };
}

// Generate mock sparkline data
const generateSparkline = (trend: number) => {
  const data = [];
  let value = 100;
  for (let i = 0; i < 24; i++) {
    const change = (Math.random() - 0.5) * 5 + (trend > 0 ? 0.5 : -0.5);
    value = Math.max(50, Math.min(150, value + change));
    data.push({ value });
  }
  return data;
};

const CryptoListPro = ({ prices, isLoading, holdings = {} }: CryptoListProProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2
    }).format(price);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Marchés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Marchés</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {prices.length} actifs
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-6 py-2 border-b border-border text-xs text-muted-foreground font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Actif</div>
          <div className="col-span-2 text-right">Prix</div>
          <div className="col-span-2 text-right">24h %</div>
          <div className="col-span-2 text-right hidden sm:block">Cap. marché</div>
          <div className="col-span-2 text-right hidden md:block">7j</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {prices.slice(0, 10).map((crypto, index) => {
            const priceChange = crypto.price_change_percentage_24h ?? 0;
            const isPositive = priceChange >= 0;
            const sparklineData = generateSparkline(priceChange);
            const chartColor = isPositive ? '#10b981' : '#ef4444';

            return (
              <div 
                key={crypto.id}
                className="grid grid-cols-12 gap-2 px-6 py-3 hover:bg-muted/50 transition-colors cursor-pointer items-center"
              >
                {/* Rank */}
                <div className="col-span-1 text-sm text-muted-foreground font-medium">
                  {index + 1}
                </div>

                {/* Asset Info */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={crypto.image} 
                      alt={crypto.name}
                      className="w-8 h-8 rounded-full"
                    />
                    {index < 3 && (
                      <Star className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{crypto.name}</p>
                    <p className="text-xs text-muted-foreground uppercase">{crypto.symbol}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-2 text-right">
                  <p className="font-semibold text-sm">{formatPrice(getCryptoPriceUsd(crypto))}</p>
                </div>

                {/* 24h Change */}
                <div className="col-span-2 text-right">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-md",
                    isPositive 
                      ? "text-emerald-600 bg-emerald-500/10" 
                      : "text-red-600 bg-red-500/10"
                  )}>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>

                {/* Market Cap */}
                <div className="col-span-2 text-right hidden sm:block">
                  <p className="text-sm text-muted-foreground">
                    {formatMarketCap(crypto.market_cap)}
                  </p>
                </div>

                {/* Sparkline */}
                <div className="col-span-2 hidden md:block">
                  <div className="h-8 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineData}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={chartColor}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All */}
        <div className="px-6 py-3 border-t border-border">
          <button className="text-sm text-primary hover:underline font-medium">
            Voir tous les marchés →
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptoListPro;
