import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import WalletAddresses from "@/components/dashboard/WalletAddresses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCryptoPriceEur } from "@/lib/crypto-prices";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowDownLeft, ArrowUpRight, QrCode, ShieldAlert, ArrowRight, Lock, Loader2 } from "lucide-react";

interface WalletAddress {
  id: string;
  crypto_name: string;
  crypto_symbol: string;
  address: string;
}

interface RequiredAction {
  id: string;
  status: string | null;
}

const Wallet = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const { prices, isLoading: pricesLoading } = useCryptoPrices();
  const { user, isLoading: authLoading } = useAuth();
  
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [wallets, setWallets] = useState<WalletAddress[]>([]);
  const [pendingActions, setPendingActions] = useState<RequiredAction[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      // Fetch profile for balance
      const { data: profileData } = await supabase
        .from('profiles')
        .select('available_balance')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setAvailableBalance(parseFloat(profileData.available_balance?.toString() || '0'));
      }

      // Fetch wallet addresses
      const { data: walletsData } = await supabase
        .from('wallet_addresses')
        .select('*')
        .eq('user_id', user.id);

      setWallets(walletsData || []);

      // Fetch pending actions
      const { data: actionsData } = await supabase
        .from('required_actions')
        .select('id, status')
        .eq('user_id', user.id)
        .neq('status', 'completed');

      setPendingActions(actionsData || []);

      // Fetch transactions to compute crypto holdings
      const { data: txData } = await supabase
        .from('transactions')
        .select('type, amount, crypto_symbol, crypto_amount')
        .eq('user_id', user.id);

      // Compute holdings from transactions
      const holdingsMap: Record<string, number> = {};
      for (const tx of (txData || [])) {
        if (!tx.crypto_symbol || !tx.crypto_amount) continue;
        const sym = tx.crypto_symbol.toUpperCase();
        
        // Map symbol to CoinGecko id for lookup
        if (tx.type === 'available_add' || tx.type === 'deposit' || tx.type === 'blocked_add') {
          holdingsMap[sym] = (holdingsMap[sym] || 0) + Number(tx.crypto_amount);
        } else if (tx.type === 'available_remove' || tx.type === 'withdrawal' || tx.type === 'blocked_remove') {
          holdingsMap[sym] = (holdingsMap[sym] || 0) - Number(tx.crypto_amount);
        }
      }
      // Remove zero/negative
      Object.keys(holdingsMap).forEach(k => {
        if (holdingsMap[k] <= 0) delete holdingsMap[k];
      });
      setHoldings(holdingsMap);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPendingLegalActions = pendingActions.length > 0;

  // Map symbol to CoinGecko id
  const symbolToId: Record<string, string> = {
    BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
    USDT: 'tether', USDC: 'usd-coin', XRP: 'ripple', ADA: 'cardano',
    DOGE: 'dogecoin', DOT: 'polkadot', AVAX: 'avalanche-2', MATIC: 'matic-network',
  };

  // Build holdings keyed by CoinGecko id
  const holdingsByGeckoId: Record<string, { amount: number; symbol: string }> = {};
  Object.entries(holdings).forEach(([sym, amount]) => {
    const geckoId = symbolToId[sym] || sym.toLowerCase();
    holdingsByGeckoId[geckoId] = { amount, symbol: sym };
  });

  const handleSendClick = (cryptoName: string) => {
    if (hasPendingLegalActions) {
      setSelectedCrypto(cryptoName);
      setShowBlockedModal(true);
    }
  };

  // Transform wallets for WalletAddresses component
  const walletData = wallets.map(w => ({
    name: w.crypto_name,
    symbol: w.crypto_symbol,
    address: w.address,
    gradient: w.crypto_symbol === 'BTC' ? 'from-orange-500 to-orange-600' :
              w.crypto_symbol === 'ETH' ? 'from-blue-500 to-blue-600' :
              w.crypto_symbol === 'SOL' ? 'from-purple-500 to-purple-600' :
              w.crypto_symbol === 'BNB' ? 'from-yellow-500 to-yellow-600' :
              'from-green-500 to-green-600',
  }));

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <MobileNav />
        <main className="p-3 sm:p-4 lg:p-8 max-w-full overflow-hidden">
          <div className="mb-4 sm:mb-8">
            <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">{t('common:nav.wallet')}</h1>
            <p className="text-muted-foreground">
              {t('dashboard:walletAddresses.description')}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Assets Overview */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard:assets.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricesLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))
                ) : prices.filter((crypto) => holdingsByGeckoId[crypto.id]?.amount > 0).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">{t('dashboard:assets.noAssets')}</div>
                  </div>
                ) : (
                  prices
                    .filter((crypto) => holdingsByGeckoId[crypto.id]?.amount > 0)
                    .map((crypto) => {
                      const holding = holdingsByGeckoId[crypto.id];
                      const amount = holding?.amount || 0;
                      const value = amount * getCryptoPriceEur(crypto);

                      return (
                        <div
                          key={crypto.id}
                          className="flex items-center gap-4 rounded-lg border p-4"
                        >
                          <img
                            src={crypto.image}
                            alt={crypto.name}
                            className="h-12 w-12 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">{crypto.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: amount < 1 ? 8 : amount < 100 ? 6 : 4 })} {holding?.symbol || crypto.symbol.toUpperCase()}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="font-semibold">
                              {value.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs"
                                onClick={() => handleSendClick(crypto.name)}
                              >
                                <ArrowUpRight className="h-3 w-3 me-1" />
                                {t('common:buttons.send')}
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <ArrowDownLeft className="h-3 w-3 me-1" />
                                {t('common:buttons.receive')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </CardContent>
            </Card>

            {/* Wallet Addresses */}
            <div className="space-y-6">
              <WalletAddresses wallets={walletData} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    {t('dashboard:quickActions.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <ArrowDownLeft className="h-4 w-4 me-2" />
                    {t('common:buttons.deposit')}
                  </Button>
                  <Button className="w-full" variant="outline">
                    <ArrowUpRight className="h-4 w-4 me-2" />
                    {t('common:buttons.withdraw')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Blocked Transaction Modal */}
      <Dialog open={showBlockedModal} onOpenChange={setShowBlockedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">{t('dashboard:blockedModal.title')}</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center text-center py-4">
            {/* Icon */}
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldAlert className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -bottom-1 -end-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Lock className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('dashboard:blockedModal.title')}
            </h3>

            {/* Crypto name */}
            {selectedCrypto && (
              <p className="text-sm text-muted-foreground mb-4">
                {selectedCrypto}
              </p>
            )}

            {/* Message */}
            <div className="bg-muted/50 rounded-xl p-4 mb-6 text-start">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('dashboard:blockedModal.pendingActions')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full">
              <Button 
                className="w-full group"
                onClick={() => {
                  setShowBlockedModal(false);
                  if (pendingActions.length > 0) {
                    navigate(`/dashboard/action/${pendingActions[0].id}`);
                  }
                }}
              >
                {t('dashboard:blockedModal.resolveAction')}
                <ArrowRight className="h-4 w-4 ms-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => setShowBlockedModal(false)}
              >
                {t('dashboard:blockedModal.close')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
