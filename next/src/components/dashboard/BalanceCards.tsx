import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Lock, ArrowRight, Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/locale";

export interface CryptoBreakdown {
  symbol: string;
  amount: number;
}

interface BalanceCardsProps {
  availableBalance: number;
  blockedBalance: number;
  onUnlockClick?: () => void;
  availableCryptos?: CryptoBreakdown[];
  blockedCryptos?: CryptoBreakdown[];
}

const BalanceCards = ({ availableBalance, blockedBalance, onUnlockClick, availableCryptos = [], blockedCryptos = [] }: BalanceCardsProps) => {
  const { t, i18n } = useTranslation('dashboard');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(value);
  };

  const formatCryptoAmount = (amount: number, symbol: string) => {
    const decimals = amount < 1 ? 8 : amount < 100 ? 6 : 4;
    return `${formatNumber(amount, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: decimals })} ${symbol.toUpperCase()}`;
  };

  const getCryptoColor = (symbol: string) => {
    const s = symbol.toUpperCase();
    if (s === 'BTC') return 'text-orange-500';
    if (s === 'ETH') return 'text-blue-500';
    if (s === 'SOL') return 'text-purple-500';
    if (s === 'BNB') return 'text-yellow-500';
    if (s === 'XRP') return 'text-slate-500';
    if (s === 'USDT' || s === 'USDC') return 'text-emerald-500';
    return 'text-primary';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <Card className="overflow-hidden border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="min-w-0 w-full">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t('balanceCards.availableBalance')}</span>
              </div>
              <p className="text-2xl sm:text-4xl font-bold tracking-tight truncate">{formatCurrency(availableBalance)}</p>
              
              {/* Crypto breakdown */}
              {availableCryptos.length > 0 && (
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  {availableCryptos.map((crypto) => (
                    <span key={crypto.symbol} className={cn("text-xs sm:text-sm font-semibold", getCryptoColor(crypto.symbol))}>
                      {formatCryptoAmount(crypto.amount, crypto.symbol)}
                    </span>
                  ))}
                </div>
              )}
              
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">{t('balanceCards.availableDesc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("overflow-hidden", blockedBalance > 0 && "border-amber-500/50 bg-amber-500/5")}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t('balanceCards.blockedFunds')}</span>
              </div>
              <p className="text-2xl sm:text-4xl font-bold tracking-tight text-amber-600 truncate">{formatCurrency(blockedBalance)}</p>
              
              {/* Crypto breakdown for blocked */}
              {blockedCryptos.length > 0 && (
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  {blockedCryptos.map((crypto) => (
                    <span key={crypto.symbol} className={cn("text-xs sm:text-sm font-semibold", getCryptoColor(crypto.symbol))}>
                      {formatCryptoAmount(crypto.amount, crypto.symbol)}
                    </span>
                  ))}
                </div>
              )}
              
              {blockedBalance > 0 && (
                <p className="text-[10px] sm:text-xs text-amber-600/80 mt-1 sm:mt-2">{t('balanceCards.blockedDesc')}</p>
              )}
            </div>
            {blockedBalance > 0 && onUnlockClick && (
              <Button variant="outline" size="sm" onClick={onUnlockClick} className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 mt-1 sm:mt-2 shrink-0 text-xs sm:text-sm">
                <span className="hidden sm:inline">{t('balanceCards.unlock')}</span>
                <ArrowRight className="h-3 w-3 sm:ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceCards;
