import { Link } from "@/lib/router-compat";
import { Lock } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

interface SimpleHeaderProps {
  secureLabel?: string;
}

const SimpleHeader = ({ secureLabel }: SimpleHeaderProps) => {
  const { t } = useTranslation('common');
  const label = secureLabel || t('nav.secureConnection', { defaultValue: 'Secure connection' });

  return (
    <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between px-4">
        <Logo size="md" linkTo="/" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleHeader;
