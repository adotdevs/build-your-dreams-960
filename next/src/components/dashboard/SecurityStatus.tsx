import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Check, AlertCircle, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "@/lib/router-compat";

const SecurityStatus = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const securityItems = [
    { id: 'email', label: t('security.emailVerified'), isComplete: true, priority: 'high' as const },
    { id: 'kyc', label: t('security.identityVerified'), isComplete: true, priority: 'high' as const },
    { id: '2fa', label: t('security.twoFactor'), isComplete: false, priority: 'high' as const },
    { id: 'phone', label: t('security.phoneVerified'), isComplete: true, priority: 'medium' as const },
    { id: 'antiPhishing', label: t('security.antiPhishing'), isComplete: false, priority: 'low' as const },
  ];

  const completedCount = securityItems.filter(item => item.isComplete).length;
  const progress = (completedCount / securityItems.length) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            {t('security.title')}
          </CardTitle>
          <span className="text-sm font-medium">{completedCount}/{securityItems.length}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Progress value={progress} className="h-2 mb-4" />
        
        <div className="space-y-2">
          {securityItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => !item.isComplete && navigate('/dashboard/settings')}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                item.isComplete 
                  ? 'bg-muted/30' 
                  : 'bg-muted/50 hover:bg-muted cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.isComplete ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                  </div>
                )}
                <span className={`text-sm ${item.isComplete ? 'text-muted-foreground' : 'font-medium'}`}>
                  {item.label}
                </span>
              </div>
              {!item.isComplete && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityStatus;
