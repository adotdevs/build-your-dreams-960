import { useTranslation } from 'react-i18next';
import { Info } from "lucide-react";

interface LegalNoticeProps {
  notice?: string;
}

const LegalNotice = ({ notice }: LegalNoticeProps) => {
  const { t } = useTranslation('dashboard');
  
  if (!notice) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium mb-1">{t('legalNotice.title')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {notice}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalNotice;
