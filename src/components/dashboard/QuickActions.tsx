import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  FileText, 
  Shield, 
  HelpCircle,
  CreditCard,
  Building2
} from "lucide-react";
import { useNavigate } from "@/lib/router-compat";

interface QuickActionsProps {
  onDepositClick?: () => void;
}

const QuickActions = ({ onDepositClick }: QuickActionsProps = {}) => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const actions = [
    { id: 'deposit', label: t('quickActions.deposit'), description: t('quickActions.depositDesc'), icon: ArrowDownLeft, href: '', onClick: onDepositClick },
    { id: 'withdraw', label: t('quickActions.withdraw'), description: t('quickActions.withdrawDesc'), icon: ArrowUpRight, href: '/dashboard/wallet' },
    { id: 'exchange', label: t('quickActions.exchange'), description: t('quickActions.exchangeDesc'), icon: RefreshCw, href: '/dashboard/wallet' },
    { id: 'bank', label: t('quickActions.transfer'), description: t('quickActions.transferDesc'), icon: Building2, href: '/dashboard/settings' },
    { id: 'documents', label: t('quickActions.documents'), description: t('quickActions.documentsDesc'), icon: FileText, href: '/dashboard/transactions' },
    { id: 'security', label: t('quickActions.securityAction'), description: t('quickActions.securityDesc'), icon: Shield, href: '/dashboard/settings' },
    { id: 'card', label: t('quickActions.card'), description: t('quickActions.cardDesc'), icon: CreditCard, href: '/dashboard/wallet' },
    { id: 'support', label: t('quickActions.support'), description: t('quickActions.supportDesc'), icon: HelpCircle, href: '/dashboard/support' }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          {t('quickActions.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {actions.map((action: any) => (
            <button
              key={action.id}
              onClick={() => {
                if (action.onClick) action.onClick();
                else if (action.href) navigate(action.href);
              }}
              className="flex flex-col items-center p-2 sm:p-3 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/20 transition-all group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center mb-1 sm:mb-2 group-hover:bg-primary/10 transition-colors">
                <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{action.label}</span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center mt-0.5 hidden sm:block">
                {action.description}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
