import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const defaultWalletAddresses = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    address: "",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    address: "",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    name: "Solana",
    symbol: "SOL",
    address: "",
    gradient: "from-purple-500 to-purple-600",
  },
];

interface WalletAddressesProps {
  wallets?: typeof defaultWalletAddresses;
}

const WalletAddresses = ({ wallets = defaultWalletAddresses }: WalletAddressesProps) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async (address: string, name: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({
      title: t('common:buttons.copied'),
      description: `${name}`,
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const activeWallets = wallets.filter(w => w.address);

  if (activeWallets.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">{t('dashboard:walletAddresses.title')}</h2>
        <p className="text-xs text-muted-foreground">Deposit addresses</p>
      </div>
      
      <div className="divide-y divide-border">
        {activeWallets.map((wallet) => (
          <div
            key={wallet.symbol}
            className="flex items-center gap-3 p-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {wallet.symbol}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{wallet.name}</div>
              <div className="truncate text-xs text-muted-foreground font-mono">
                {wallet.address}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleCopy(wallet.address, wallet.name)}
            >
              {copiedAddress === wallet.address ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletAddresses;
