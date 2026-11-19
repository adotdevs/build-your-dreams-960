import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "./AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { getCryptoPriceEur } from "@/lib/crypto-prices";
import OnboardingDialog from "@/components/admin/OnboardingDialog";
import { 
  Users, Clock, CheckCircle, ListChecks, Euro, RefreshCw, Loader2, Lock, MessageSquare, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RequiredActionData {
  amount: number | null;
  currency: string | null;
  crypto_symbol: string | null;
  status: string | null;
  user_id: string;
}

const cryptoIdMap: { [key: string]: string } = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  USDT: 'tether', USDC: 'usd-coin', XRP: 'ripple', ADA: 'cardano',
};

const AdminDashboard = () => {
  const { t } = useTranslation('admin');
  const { prices, isLoading: pricesLoading } = useCryptoPrices();
  const { user, isCompanyAdmin, companyId } = useAuth();
  const [agentName, setAgentName] = useState<string>("");
  const [stats, setStats] = useState({
    totalClients: 0, pendingKyc: 0, verifiedClients: 0, clientsWithPendingActions: 0,
    totalActionsAmount: 0, totalBlockedFunds: 0, openTickets: 0, recentRegistrations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionsData, setActionsData] = useState<RequiredActionData[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isCompanyAdmin && companyId) {
      supabase.from('companies').select('is_onboarded').eq('id', companyId).maybeSingle()
        .then(({ data }) => { if (data && !data.is_onboarded) setShowOnboarding(true); });
    }
  }, [isCompanyAdmin, companyId]);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('first_name, last_name').eq('id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.first_name || data?.last_name) setAgentName(`${data.first_name || ''} ${data.last_name || ''}`.trim());
          else setAgentName(user.email || '');
        });
    }
  }, [user]);

  useEffect(() => { fetchStats(); }, []);

  // Live updates: refresh stats immediately when profiles change (e.g. KYC submissions)
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { fetchStats(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  useEffect(() => {
    if (!pricesLoading && prices.length > 0 && actionsData.length > 0) recalculateActionAmounts();
  }, [prices, pricesLoading, actionsData]);

  const getCryptoPrice = (symbol: string): number => {
    const cryptoId = cryptoIdMap[symbol];
    const crypto = prices.find(p => p.id === cryptoId);
    return getCryptoPriceEur(crypto);
  };

  const getUsdToEurRate = (): number => prices.find(p => typeof p.usd_to_eur === 'number')?.usd_to_eur || 0.87673;

  const convertToEur = (amount: number | null, currency: string | null, cryptoSymbol: string | null): number => {
    if (!amount) return 0;
    if (currency === 'EUR') return amount;
    if (currency === 'USD') return amount * getUsdToEurRate();
    const cryptoTicker = cryptoSymbol || (currency && currency !== 'EUR' && currency !== 'USD' ? currency : null);
    if (cryptoTicker && cryptoIdMap[cryptoTicker]) return amount * getCryptoPrice(cryptoTicker);
    if (currency === 'CRYPTO' && cryptoSymbol) return amount * getCryptoPrice(cryptoSymbol);
    return amount;
  };

  const recalculateActionAmounts = () => {
    let totalActionsAmount = 0;
    actionsData.forEach(action => { if (action.status !== 'completed') totalActionsAmount += convertToEur(action.amount, action.currency, action.crypto_symbol); });
    setStats(prev => ({ ...prev, totalActionsAmount }));
  };

  const fetchStats = async () => {
    try {
      const { data: adminRoles } = await supabase.from('user_roles').select('user_id').in('role', ['admin', 'super_admin']);
      const adminIds = new Set((adminRoles || []).map(r => r.user_id));
      const { data: allProfiles } = await supabase.from('profiles_secure').select('id, kyc_status, blocked_balance, created_at');
      const clientProfiles = (allProfiles || []).filter(p => !adminIds.has(p.id));
      const totalClients = clientProfiles.length;
      const pendingKyc = clientProfiles.filter(p => p.kyc_status === 'pending' || !p.kyc_status).length;
      const verifiedClients = clientProfiles.filter(p => p.kyc_status === 'verified').length;
      const totalBlockedFunds = clientProfiles.reduce((sum, p) => sum + parseFloat(p.blocked_balance?.toString() || '0'), 0);
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentRegistrations = clientProfiles.filter(p => new Date(p.created_at) >= sevenDaysAgo).length;
      const clientIds = clientProfiles.map(p => p.id);
      let actions: RequiredActionData[] = [];
      if (clientIds.length > 0) {
        const { data: actionsData } = await supabase.from('required_actions').select('amount, currency, crypto_symbol, status, user_id').in('user_id', clientIds);
        actions = actionsData || [];
      }
      setActionsData(actions);
      const clientsWithPendingSet = new Set<string>();
      let totalActionsAmount = 0;
      actions.forEach(action => { if (action.status !== 'completed') { clientsWithPendingSet.add(action.user_id); totalActionsAmount += convertToEur(action.amount, action.currency, action.crypto_symbol); } });
      let openTickets = 0;
      if (clientIds.length > 0) {
        const { count } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('user_id', clientIds).eq('status', 'open');
        openTickets = count || 0;
      }
      setStats({ totalClients, pendingKyc, verifiedClients, clientsWithPendingActions: clientsWithPendingSet.size, totalActionsAmount, totalBlockedFunds, openTickets, recentRegistrations });
    } catch (error) { console.error('Error fetching stats:', error); } finally { setIsLoading(false); setIsRefreshing(false); }
  };

  const handleRefresh = async () => { setIsRefreshing(true); await fetchStats(); };

  const statCards = [
    { title: t('dashboard.totalClients'), value: stats.totalClients, icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10", description: stats.totalClients === 0 ? t('dashboard.noClientsYet') : undefined },
    { title: t('dashboard.pendingKyc'), value: stats.pendingKyc, icon: Clock, color: "text-orange-500", bgColor: "bg-orange-500/10", description: stats.totalClients === 0 ? "—" : t('dashboard.ofClients', { percent: stats.totalClients > 0 ? ((stats.pendingKyc / stats.totalClients) * 100).toFixed(0) : 0 }) },
    { title: t('dashboard.verifiedClients'), value: stats.verifiedClients, icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10", description: stats.totalClients === 0 ? "—" : t('dashboard.ofClients', { percent: stats.totalClients > 0 ? ((stats.verifiedClients / stats.totalClients) * 100).toFixed(0) : 0 }) },
    { title: t('dashboard.clientsWithSteps'), value: stats.clientsWithPendingActions, icon: ListChecks, color: "text-amber-500", bgColor: "bg-amber-500/10", description: t('dashboard.clientsWithPendingActions') },
  ];

  const secondaryCards = [
    { title: t('dashboard.totalBlockedFunds'), value: `€${stats.totalBlockedFunds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Lock, color: "text-red-500", bgColor: "bg-red-500/10", description: stats.totalClients === 0 ? t('dashboard.noClientsYet') : t('dashboard.acrossClients', { count: stats.totalClients }) },
    { title: t('dashboard.openTickets'), value: stats.openTickets, icon: MessageSquare, color: "text-purple-500", bgColor: "bg-purple-500/10", description: stats.openTickets === 0 ? t('dashboard.noPendingTickets') : t('dashboard.awaitingResponse') },
    { title: t('dashboard.newClients7d'), value: stats.recentRegistrations, icon: UserPlus, color: "text-cyan-500", bgColor: "bg-cyan-500/10", description: t('dashboard.registeredLast7Days') },
  ];

  return (
    <AdminLayout>
      {showOnboarding && companyId && <OnboardingDialog open={showOnboarding} companyId={companyId} onComplete={() => setShowOnboarding(false)} />}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest">
                {t('layout.admin')}
              </span>
            </div>
            <h1 className="text-3xl font-bold">
              {agentName ? t('dashboard.titleWithName', { name: agentName }) : t('dashboard.title')}
            </h1>
            <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {t('dashboard.refresh')}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{isLoading ? "..." : stat.value}</p>
                {stat.description && <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {secondaryCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{isLoading ? "..." : stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-muted-foreground">{t('dashboard.liveCryptoPrices')}</span>
          </div>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="rounded-xl p-3 bg-emerald-500/10"><Euro className="h-6 w-6 text-emerald-500" /></div>
            <div><CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.totalPendingActionsAmount')}</CardTitle></div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {isLoading || pricesLoading ? (
                <span className="flex items-center gap-2"><Loader2 className="h-6 w-6 animate-spin" />{t('dashboard.loading')}</span>
              ) : stats.totalClients === 0 ? (
                <span className="text-muted-foreground text-2xl">{t('dashboard.noClientsYet')}</span>
              ) : (
                `€${stats.totalActionsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.totalClients === 0 ? t('dashboard.statsWillAppear') : t('dashboard.eurSumPendingActions')}
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
