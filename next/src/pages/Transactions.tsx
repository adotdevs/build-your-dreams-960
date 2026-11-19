import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, Clock, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  crypto_symbol: string | null;
  description: string | null;
  created_at: string;
}

const Transactions = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type.includes('add') || type === 'deposit') {
      return <ArrowDownLeft className="h-5 w-5" />;
    }
    return <ArrowUpRight className="h-5 w-5" />;
  };

  const getTransactionColor = (type: string) => {
    if (type.includes('add') || type === 'deposit') {
      return 'bg-success/10 text-success';
    }
    return 'bg-destructive/10 text-destructive';
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'available_add': return t('dashboard:transactions.fundsAdded');
      case 'available_remove': return t('dashboard:transactions.fundsWithdrawn');
      case 'blocked_add': return t('dashboard:transactions.blockedFundsAdded');
      case 'blocked_remove': return t('dashboard:transactions.blockedFundsReleased');
      case 'deposit': return t('dashboard:transactions.deposit');
      case 'withdrawal': return t('dashboard:transactions.withdrawal');
      default: return type.replace('_', ' ');
    }
  };

  const formatAmount = (tx: Transaction) => {
    const isPositive = tx.type.includes('add') || tx.type === 'deposit';
    const prefix = isPositive ? '+' : '-';
    
    if (tx.crypto_symbol) {
      return `${prefix}${tx.amount} ${tx.crypto_symbol}`;
    }
    
    const currencySymbol = tx.currency === 'EUR' ? '€' : tx.currency === 'USD' ? '$' : tx.currency;
    return `${prefix}${currencySymbol}${parseFloat(tx.amount.toString()).toLocaleString()}`;
  };

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
          <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">{t('common:nav.transactions')}</h1>
              <p className="text-muted-foreground">
                {t('dashboard:transactions.title')}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 me-2" />
              {t('common:buttons.filter')}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard:transactions.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-sm">{t('dashboard:transactions.noTransactions')}</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 transition-colors hover:bg-secondary/30"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${getTransactionColor(tx.type)}`}
                      >
                        {getTransactionIcon(tx.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getTransactionLabel(tx.type)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-success/10 text-success"
                          >
                            {t('common:status.completed')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(tx.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {tx.description}
                          </p>
                        )}
                      </div>

                      <div className="text-end">
                        <div
                          className={`font-semibold ${
                            tx.type.includes('add') || tx.type === 'deposit'
                              ? 'text-success'
                              : 'text-destructive'
                          }`}
                        >
                          {formatAmount(tx)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Transactions;
