import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck } from "lucide-react";

interface ClientHeaderProps {
  firstName: string;
  lastName: string;
  email: string;
  isVerified?: boolean;
  selfieUrl?: string | null;
}

const ClientHeader = ({ firstName, lastName, email, isVerified = true, selfieUrl }: ClientHeaderProps) => {
  const { t } = useTranslation('common');
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`;

  return (
    <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
      <Avatar className="h-11 w-11 sm:h-14 sm:w-14 border-2 border-border shrink-0">
        {selfieUrl && (
          <AvatarImage 
            src={selfieUrl} 
            alt={fullName}
            className="object-cover"
          />
        )}
        <AvatarFallback className="bg-muted text-sm sm:text-base font-medium text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{fullName}</h1>
          {isVerified && (
            <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{email}</p>
      </div>
    </div>
  );
};

export default ClientHeader;
