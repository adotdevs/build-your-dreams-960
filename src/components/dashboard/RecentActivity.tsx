import { useTranslation } from 'react-i18next';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowUpRight, ArrowDownLeft, RefreshCw, Shield, FileCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { de } from "date-fns/locale";
import { es } from "date-fns/locale";
import { pt } from "date-fns/locale";
import { it } from "date-fns/locale";
import { ar } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { formatNumber } from "@/lib/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  type: 'deposit' | 'withdrawal' | 'exchange' | 'security' | 'verification' | 'transfer';
  title: string;
  description: string;
  timestamp: Date;
  source: 'transaction' | 'activity_log';
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'deposit': return <ArrowDownLeft className="h-4 w-4 text-emerald-600" />;
    case 'withdrawal': return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    case 'exchange': return <RefreshCw className="h-4 w-4 text-blue-600" />;
    case 'security': return <Shield className="h-4 w-4 text-amber-600" />;
    case 'verification': return <FileCheck className="h-4 w-4 text-primary" />;
    default: return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

const localeMap: Record<string, any> = { fr, de, es, pt, it, ar, en: enUS };

const mapTransactionType = (type: string): ActivityItem['type'] => {
  switch (type) {
    case 'deposit': return 'deposit';
    case 'withdrawal': return 'withdrawal';
    case 'exchange': case 'conversion': return 'exchange';
    case 'transfer': return 'transfer';
    default: return 'deposit';
  }
};

const mapActivityLogType = (type: string): ActivityItem['type'] => {
  switch (type) {
    case 'login': case 'password_change': case '2fa_enabled': case '2fa_disabled': return 'security';
    case 'kyc_approved': case 'kyc_rejected': case 'profile_update': return 'verification';
    default: return 'security';
  }
};

const RecentActivity = () => {
  const { t, i18n } = useTranslation('dashboard');
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentLocale = localeMap[i18n.language] || enUS;

  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: currentLocale });
  };

  const getTransactionTitle = (type: string): string => {
    switch (type) {
      case 'deposit': return t('activity.depositReceived');
      case 'withdrawal': return t('activity.withdrawalMade');
      case 'exchange': case 'conversion': return t('activity.conversionMade');
      case 'transfer': return t('activity.transfer');
      default: return t('activity.transaction');
    }
  };

  const formatTransactionDescription = (type: string, amount: number, currency: string, cryptoSymbol: string | null): string => {
    const formattedAmount = formatNumber(amount, i18n.language, { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (cryptoSymbol) return `${type === 'withdrawal' ? '-' : '+'}${formattedAmount} ${cryptoSymbol.toUpperCase()}`;
    return `${type === 'withdrawal' ? '-' : '+'}${formattedAmount} ${currency}`;
  };

  useEffect(() => {
    if (user) fetchActivities();
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;
    try {
      const { data: transactions } = await supabase.from('transactions').select('id, type, amount, currency, crypto_symbol, description, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      const { data: activityLogs } = await supabase.from('activity_logs').select('id, type, title, description, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);

      const transactionActivities: ActivityItem[] = (transactions || []).map(t => ({
        id: t.id, type: mapTransactionType(t.type), title: getTransactionTitle(t.type),
        description: formatTransactionDescription(t.type, t.amount, t.currency, t.crypto_symbol),
        timestamp: new Date(t.created_at), source: 'transaction' as const
      }));

      const logActivities: ActivityItem[] = (activityLogs || []).map(a => ({
        id: a.id, type: mapActivityLogType(a.type), title: a.title,
        description: a.description || '', timestamp: new Date(a.created_at), source: 'activity_log' as const
      }));

      setActivities([...transactionActivities, ...logActivities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            {t('activity.title')}
          </CardTitle>
          {activities.length > 0 && (
            <span className="text-xs text-primary cursor-pointer hover:underline">{t('activity.viewAll')}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1"><Skeleton className="h-4 w-3/4 mb-1" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('activity.noActivity')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={`${activity.source}-${activity.id}`} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{activity.title}</span>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
