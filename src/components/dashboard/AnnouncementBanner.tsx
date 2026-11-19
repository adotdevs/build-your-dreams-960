import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const AnnouncementBanner = () => {
  const { t } = useTranslation('dashboard');
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4 mb-6">
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-1 hover:bg-muted rounded transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex w-12 h-12 rounded-lg bg-primary/10 items-center justify-center flex-shrink-0">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-medium text-sm mb-1">
            {t('announcement.title')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('announcement.description')}
          </p>
          <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-xs">
            {t('announcement.learnMore')}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
