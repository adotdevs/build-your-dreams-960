import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTION_TEMPLATES, ActionTemplate } from "@/data/actionTemplates";
import { 
  RefreshCw, 
  Receipt, 
  Shield, 
  Scale, 
  Landmark, 
  History, 
  Pencil,
  ArrowLeft,
  Loader2,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: { [key: string]: React.ElementType } = {
  RefreshCw,
  Receipt,
  Shield,
  Scale,
  Landmark,
  History,
  Pencil,
};

const cryptoOptions = [
  { name: "Bitcoin", symbol: "BTC" },
  { name: "Ethereum", symbol: "ETH" },
  { name: "Solana", symbol: "SOL" },
  { name: "Binance Coin", symbol: "BNB" },
  { name: "Tether", symbol: "USDT" },
  { name: "USD Coin", symbol: "USDC" },
  { name: "Ripple", symbol: "XRP" },
  { name: "Cardano", symbol: "ADA" },
];

interface ActionTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (actionData: {
    template_id: string;
    title: string;
    description: string;
    amount: number | null;
    currency: string;
    crypto_symbol: string | null;
    status: string;
    due_date: string | null;
    legal_title: string | null;
    legal_description: string | null;
    why_required: string[] | null;
    legal_basis: string | null;
    consequences: string | null;
    how_to_proceed: string[] | null;
    documents: string[] | null;
    contact_info: string | null;
  }) => Promise<void>;
  isSaving: boolean;
  existingActionsCount: number;
}

export const ActionTemplateSelector = ({
  open,
  onOpenChange,
  onSubmit,
  isSaving,
  existingActionsCount,
}: ActionTemplateSelectorProps) => {
  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedTemplate, setSelectedTemplate] = useState<ActionTemplate | null>(null);
  
  // Configuration state
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [cryptoSymbol, setCryptoSymbol] = useState("ETH");
  const [status, setStatus] = useState("pending");
  const [dueDate, setDueDate] = useState("");
  
  // Custom action fields
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  const resetForm = () => {
    setStep("select");
    setSelectedTemplate(null);
    setAmount("");
    setCurrency("EUR");
    setCryptoSymbol("ETH");
    setStatus("pending");
    setDueDate("");
    setCustomTitle("");
    setCustomDescription("");
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleSelectTemplate = (template: ActionTemplate) => {
    setSelectedTemplate(template);
    setCurrency(template.defaultCurrency || "EUR");
    setCryptoSymbol(template.defaultCryptoSymbol || "ETH");
    setStatus(template.defaultStatus || "pending");
    setStep("configure");
  };

  const handleBack = () => {
    setStep("select");
  };

  const handleSubmit = async () => {
    if (!selectedTemplate) return;
    
    const isCustom = selectedTemplate.id === "custom";
    
    await onSubmit({
      template_id: selectedTemplate.id,
      title: isCustom ? customTitle : selectedTemplate.title,
      description: isCustom ? customDescription : selectedTemplate.shortDescription,
      amount: amount ? parseFloat(amount) : null,
      currency: currency,
      crypto_symbol: currency === "CRYPTO" ? cryptoSymbol : null,
      status: status,
      due_date: dueDate || null,
      legal_title: isCustom ? null : selectedTemplate.legalTitle,
      legal_description: isCustom ? null : selectedTemplate.legalDescription,
      why_required: isCustom ? null : selectedTemplate.whyRequired,
      legal_basis: isCustom ? null : selectedTemplate.legalBasis,
      consequences: isCustom ? null : selectedTemplate.consequences,
      how_to_proceed: isCustom ? null : selectedTemplate.howToProceed,
      documents: isCustom ? null : selectedTemplate.documents || null,
      contact_info: isCustom ? null : selectedTemplate.contactInfo,
    });

    handleClose();
  };

  const Icon = selectedTemplate ? iconMap[selectedTemplate.icon] || Pencil : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else onOpenChange(true);
    }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {step === "select" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add Required Action</DialogTitle>
              <DialogDescription>
                Select an action template to assign to this client
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-3 py-4 overflow-y-auto flex-1">
              {ACTION_TEMPLATES.map((template) => {
                const TemplateIcon = iconMap[template.icon] || Pencil;
                const isCustom = template.id === "custom";
                
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border text-left transition-all hover:border-primary/50 hover:bg-primary/5",
                      isCustom && "border-dashed"
                    )}
                  >
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                      isCustom ? "bg-muted" : "bg-primary/10"
                    )}>
                      <TemplateIcon className={cn(
                        "h-6 w-6",
                        isCustom ? "text-muted-foreground" : "text-primary"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{template.title}</span>
                        {template.id === "account_synchronization" && (
                          <Badge variant="secondary" className="text-xs">Default First Step</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.shortDescription}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3 flex-1">
                  {Icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <DialogTitle>
                      {selectedTemplate?.id === "custom" ? "Custom Action" : selectedTemplate?.title}
                    </DialogTitle>
                    <DialogDescription>
                      Configure amount and currency for this client
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              {selectedTemplate?.id === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="Enter action title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Enter action description..."
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
              
              {selectedTemplate?.id !== "custom" && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate?.shortDescription}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount {selectedTemplate?.requiresAmount && "*"}</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {currency === "CRYPTO" && (
                <div className="space-y-2">
                  <Label>Cryptocurrency</Label>
                  <Select value={cryptoSymbol} onValueChange={setCryptoSymbol}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoOptions.map((crypto) => (
                        <SelectItem key={crypto.symbol} value={crypto.symbol}>
                          {crypto.name} ({crypto.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date (optional)</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSaving || (selectedTemplate?.id === "custom" && !customTitle)}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Add Action
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActionTemplateSelector;
