import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings2, Lock, Globe, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface OnboardingDialogProps {
  open: boolean;
  companyId: string;
  onComplete: () => void;
}

const OnboardingDialog = ({ open, companyId, onComplete }: OnboardingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [cryptoIdCode, setCryptoIdCode] = useState("");

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (!newPassword) {
      toast({ title: "Error", description: "Please enter a password", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password changed" });
      setStep(1);
    }
    setIsLoading(false);
  };

  const handleSaveSettings = async () => {
    if (!cryptoIdCode.trim()) {
      toast({ title: "Error", description: "Crypto Identification Number is required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from('companies')
      .update({
        default_currency: currency,
        crypto_id_code: cryptoIdCode.toUpperCase().trim(),
        is_onboarded: true,
      })
      .eq('id', companyId);

    if (error) {
      toast({
        title: "Error",
        description: error.message.includes('unique') ? "This Crypto ID is already in use" : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Setup complete", description: "Your workspace is ready!" });
      onComplete();
    }
    setIsLoading(false);
  };

  const handleSkipPassword = () => {
    setStep(1);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Settings2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {step === 0 ? "Secure Your Account" : "Configure Your Workspace"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 0
              ? "We recommend changing your initial password."
              : "Set up the basic parameters for your platform."}
          </DialogDescription>
        </DialogHeader>

        {step === 0 ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="h-4 w-4" /> New Password
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleSkipPassword}>
                Skip
              </Button>
              <Button className="flex-1" onClick={handleChangePassword} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> Default Currency
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="USD">USD — Dollar</SelectItem>
                  <SelectItem value="GBP">GBP — British Pound</SelectItem>
                  <SelectItem value="CHF">CHF — Swiss Franc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4" /> Crypto Identification Number (CIN)
              </Label>
              <Input
                value={cryptoIdCode}
                onChange={(e) => setCryptoIdCode(e.target.value)}
                placeholder="EX: ACME-2024-001"
                className="font-mono uppercase tracking-wider"
              />
              <p className="text-xs text-muted-foreground">
                This code will be required for your clients to register.
              </p>
            </div>
            <Button className="w-full" onClick={handleSaveSettings} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
            </Button>
          </div>
        )}

        <div className="flex justify-center gap-2 pt-2">
          <div className={`h-1.5 w-8 rounded-full ${step === 0 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1.5 w-8 rounded-full ${step === 1 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
