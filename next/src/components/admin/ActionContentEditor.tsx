import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Scale,
  Building,
  HelpCircle,
  Landmark,
  Receipt,
  RefreshCw,
  History,
  Loader2,
  Save,
  Eye,
  Pencil,
  Plus,
  X,
  Paperclip,
  Upload,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

type LangCode = 'fr' | 'en' | 'de';

const LANGS: { code: LangCode; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

interface LocalizedFields {
  title: string;
  description: string;
  legal_title: string;
  legal_description: string;
  why_required: string[];
  legal_basis: string;
  consequences: string;
  how_to_proceed: string[];
  documents: string[];
  contact_info: string;
}

const EMPTY_LOCALIZED: LocalizedFields = {
  title: '',
  description: '',
  legal_title: '',
  legal_description: '',
  why_required: [],
  legal_basis: '',
  consequences: '',
  how_to_proceed: [],
  documents: [],
  contact_info: '',
};

interface ActionData {
  id: string;
  user_id?: string;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string | null;
  crypto_symbol: string | null;
  status: string | null;
  due_date: string | null;
  template_id: string | null;
  legal_title: string | null;
  legal_description: string | null;
  why_required: string[] | null;
  legal_basis: string | null;
  consequences: string | null;
  how_to_proceed: string[] | null;
  documents: string[] | null;
  contact_info: string | null;
  attachments?: string[] | null;
  translations?: Record<string, Partial<LocalizedFields>> | null;
}

interface ActionContentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ActionData | null;
  onSave: (data: Partial<ActionData>) => Promise<void>;
  isSaving: boolean;
}

const getTypeIcon = (templateId: string | null) => {
  switch (templateId) {
    case "insurance_verification": return Shield;
    case "tax_payment": return Receipt;
    case "account_synchronization": case "account_sync": return RefreshCw;
    case "aml_unodc_fees": return Scale;
    case "platform_fees": return Landmark;
    case "transaction_history": return History;
    default: return FileText;
  }
};

export const ActionContentEditor = ({
  open,
  onOpenChange,
  action,
  onSave,
  isSaving,
}: ActionContentEditorProps) => {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [lang, setLang] = useState<LangCode>('fr');

  // Non-localized fields (shared across all languages)
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [cryptoSymbol, setCryptoSymbol] = useState("");
  const [status, setStatus] = useState("pending");
  const [dueDate, setDueDate] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Localized fields per language
  const [translationsMap, setTranslationsMap] = useState<Record<LangCode, LocalizedFields>>({
    fr: { ...EMPTY_LOCALIZED },
    en: { ...EMPTY_LOCALIZED },
    de: { ...EMPTY_LOCALIZED },
  });

  // Derived current-language fields + setters (compat with existing JSX)
  const current = translationsMap[lang];
  const updateField = <K extends keyof LocalizedFields>(field: K, value: LocalizedFields[K]) => {
    setTranslationsMap((prev) => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };
  const title = current.title;
  const setTitle = (v: string) => updateField('title', v);
  const description = current.description;
  const setDescription = (v: string) => updateField('description', v);
  const legalTitle = current.legal_title;
  const setLegalTitle = (v: string) => updateField('legal_title', v);
  const legalDescription = current.legal_description;
  const setLegalDescription = (v: string) => updateField('legal_description', v);
  const whyRequired = current.why_required;
  const setWhyRequired: React.Dispatch<React.SetStateAction<string[]>> = (v) =>
    updateField('why_required', typeof v === 'function' ? (v as any)(current.why_required) : v);
  const legalBasis = current.legal_basis;
  const setLegalBasis = (v: string) => updateField('legal_basis', v);
  const consequences = current.consequences;
  const setConsequences = (v: string) => updateField('consequences', v);
  const howToProceed = current.how_to_proceed;
  const setHowToProceed: React.Dispatch<React.SetStateAction<string[]>> = (v) =>
    updateField('how_to_proceed', typeof v === 'function' ? (v as any)(current.how_to_proceed) : v);
  const documents = current.documents;
  const setDocuments: React.Dispatch<React.SetStateAction<string[]>> = (v) =>
    updateField('documents', typeof v === 'function' ? (v as any)(current.documents) : v);
  const contactInfo = current.contact_info;
  const setContactInfo = (v: string) => updateField('contact_info', v);

  useEffect(() => {
    if (action) {
      setAmount(action.amount?.toString() || "");
      setCurrency(action.currency || "EUR");
      setCryptoSymbol(action.crypto_symbol || "");
      setStatus(action.status || "pending");
      setDueDate(action.due_date || "");
      setAttachments(action.attachments || []);
      setMode("edit");
      setLang('fr');

      // FR = base columns (canonical version)
      const frFields: LocalizedFields = {
        title: action.title || "",
        description: action.description || "",
        legal_title: action.legal_title || "",
        legal_description: action.legal_description || "",
        why_required: action.why_required || [],
        legal_basis: action.legal_basis || "",
        consequences: action.consequences || "",
        how_to_proceed: action.how_to_proceed || [],
        documents: action.documents || [],
        contact_info: action.contact_info || "",
      };
      const t = action.translations || {};
      const merge = (code: LangCode, base: LocalizedFields): LocalizedFields => {
        const stored = (t[code] || {}) as Partial<LocalizedFields>;
        return {
          title: stored.title ?? (code === 'fr' ? base.title : ''),
          description: stored.description ?? (code === 'fr' ? base.description : ''),
          legal_title: stored.legal_title ?? (code === 'fr' ? base.legal_title : ''),
          legal_description: stored.legal_description ?? (code === 'fr' ? base.legal_description : ''),
          why_required: stored.why_required ?? (code === 'fr' ? base.why_required : []),
          legal_basis: stored.legal_basis ?? (code === 'fr' ? base.legal_basis : ''),
          consequences: stored.consequences ?? (code === 'fr' ? base.consequences : ''),
          how_to_proceed: stored.how_to_proceed ?? (code === 'fr' ? base.how_to_proceed : []),
          documents: stored.documents ?? (code === 'fr' ? base.documents : []),
          contact_info: stored.contact_info ?? (code === 'fr' ? base.contact_info : ''),
        };
      };
      setTranslationsMap({
        fr: merge('fr', frFields),
        en: merge('en', frFields),
        de: merge('de', frFields),
      });
    }
  }, [action]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !action?.user_id) return;
    setUploading(true);
    try {
      const newRefs: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10MB`);
          continue;
        }
        const ext = file.name.split('.').pop();
        const path = `${action.user_id}/${action.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from('action-attachments').upload(path, file);
        if (error) throw error;
        newRefs.push(`${file.name}|||${path}`);
      }
      const updated = [...attachments, ...newRefs];
      setAttachments(updated);
      await supabase.from('required_actions').update({ attachments: updated }).eq('id', action.id);
      toast.success('Files uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownloadAttachment = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from('action-attachments').createSignedUrl(path, 3600);
    if (error || !data) { toast.error('Cannot download'); return; }
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = name;
    a.target = '_blank';
    a.click();
  };

  const handleRemoveAttachment = async (index: number) => {
    if (!action) return;
    const ref = attachments[index];
    const path = ref.split('|||')[1];
    await supabase.storage.from('action-attachments').remove([path]);
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
    await supabase.from('required_actions').update({ attachments: updated }).eq('id', action.id);
    toast.success('File removed');
  };

  const handleSave = async () => {
    const fr = translationsMap.fr;
    // Build translations payload: only keep non-empty fields per language
    const clean = (f: LocalizedFields): Partial<LocalizedFields> => {
      const out: any = {};
      (Object.keys(f) as (keyof LocalizedFields)[]).forEach((k) => {
        const v = f[k];
        if (Array.isArray(v)) {
          if (v.length > 0 && v.some((x) => x && x.trim() !== '')) out[k] = v;
        } else if (typeof v === 'string' && v.trim() !== '') {
          out[k] = v;
        }
      });
      return out;
    };
    const translationsPayload = {
      fr: clean(translationsMap.fr),
      en: clean(translationsMap.en),
      de: clean(translationsMap.de),
    };
    await onSave({
      // Canonical FR copy stays in top-level columns (back-compat)
      title: fr.title,
      description: fr.description || null,
      amount: amount ? parseFloat(amount) : null,
      currency,
      crypto_symbol: currency === "CRYPTO" ? cryptoSymbol : null,
      status,
      due_date: dueDate || null,
      legal_title: fr.legal_title || null,
      legal_description: fr.legal_description || null,
      why_required: fr.why_required.length > 0 ? fr.why_required : null,
      legal_basis: fr.legal_basis || null,
      consequences: fr.consequences || null,
      how_to_proceed: fr.how_to_proceed.length > 0 ? fr.how_to_proceed : null,
      documents: fr.documents.length > 0 ? fr.documents : null,
      contact_info: fr.contact_info || null,
      translations: translationsPayload,
    } as any);
  };


  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""]);
  };

  const updateArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const removeArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const TypeIcon = getTypeIcon(action?.template_id);

  const formatAmount = (amt: number, cur: string | null, crypto: string | null) => {
    if (cur === "CRYPTO" || cur === "ETH" || cur === "BTC") return `${amt} ${crypto || cur}`;
    return amt.toLocaleString(undefined, { style: "currency", currency: cur || "EUR" });
  };

  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Action Content</DialogTitle>
            <div className="flex gap-1">
              <Button
                variant={mode === "edit" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("edit")}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
              <Button
                variant={mode === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("preview")}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Client Preview
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {mode === "edit" ? (
            <div className="space-y-6">
              {/* Language Tabs */}
              <div className="sticky top-0 z-10 -mx-1 px-1 pb-2 pt-1 bg-background/95 backdrop-blur border-b">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                  Content language
                </Label>
                <div className="flex gap-1">
                  {LANGS.map((l) => {
                    const hasContent = Object.values(translationsMap[l.code]).some((v) =>
                      Array.isArray(v) ? v.some((x) => x && x.trim()) : (v as string).trim()
                    );
                    return (
                      <Button
                        key={l.code}
                        type="button"
                        variant={lang === l.code ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLang(l.code)}
                        className="gap-2"
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                        {hasContent && lang !== l.code && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The client sees the content in their own language. French is the default fallback.
                </p>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  General
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Short Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {cryptoOptions.map((c) => (
                          <SelectItem key={c.symbol} value={c.symbol}>
                            {c.name} ({c.symbol})
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Legal Content */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Page Content (visible to client)
                </h3>
                <div className="space-y-2">
                  <Label>Legal Title</Label>
                  <Input value={legalTitle} onChange={(e) => setLegalTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Legal Description</Label>
                  <Textarea
                    value={legalDescription}
                    onChange={(e) => setLegalDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <Separator />

              {/* Why Required */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Why is this required?</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(setWhyRequired)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                {whyRequired.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateArrayItem(setWhyRequired, i, e.target.value)}
                      placeholder={`Reason ${i + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem(setWhyRequired, i)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Legal Basis */}
              <div className="space-y-2">
                <Label>Legal Basis</Label>
                <Textarea
                  value={legalBasis}
                  onChange={(e) => setLegalBasis(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Consequences */}
              <div className="space-y-2">
                <Label>Consequences of Non-Compliance</Label>
                <Textarea
                  value={consequences}
                  onChange={(e) => setConsequences(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              {/* How to Proceed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>How to Proceed (Steps)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(setHowToProceed)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Step
                  </Button>
                </div>
                {howToProceed.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0 mt-1">
                      {i + 1}
                    </span>
                    <Input
                      value={item}
                      onChange={(e) => updateArrayItem(setHowToProceed, i, e.target.value)}
                      placeholder={`Step ${i + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem(setHowToProceed, i)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Documents */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Required Documents</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(setDocuments)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                {documents.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateArrayItem(setDocuments, i, e.target.value)}
                      placeholder={`Document ${i + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem(setDocuments, i)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Attachments uploaded by admin/agent */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" /> Attached Documents
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload supporting files for the client (tax notice, sync proof, invoices...). Max 10MB each.
                    </p>
                  </div>
                  <div>
                    <input
                      id="action-attach-input"
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileUpload}
                      disabled={uploading || !action?.user_id}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading || !action?.user_id}
                      onClick={() => document.getElementById('action-attach-input')?.click()}
                    >
                      {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                      Upload
                    </Button>
                  </div>
                </div>
                {attachments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No files attached yet.</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((ref, i) => {
                      const [name, path] = ref.split('|||');
                      return (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm flex-1 truncate">{name}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleDownloadAttachment(path, name)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAttachment(i)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-2">
                <Label>Contact Information</Label>
                <Textarea
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          ) : (
            /* ===== CLIENT PREVIEW MODE ===== */
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-2 text-center text-xs text-primary font-medium">
                👁️ This is exactly how the client will see this action page
              </div>

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full",
                      status === "urgent"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    <TypeIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold">{title}</h1>
                      {status === "completed" ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </Badge>
                      ) : status === "urgent" ? (
                        <Badge className="bg-destructive/10 text-destructive gap-1">
                          <AlertTriangle className="h-3 w-3" /> Urgent
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </div>
                    {dueDate && status !== "completed" && (
                      <p className="text-muted-foreground">
                        Due by {new Date(dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {amount && status !== "completed" && (
                  <Card className="bg-amber-500/5 border-amber-500/30">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Amount required</span>
                        <span className="text-2xl font-bold">
                          {formatAmount(
                            parseFloat(amount),
                            currency,
                            cryptoSymbol
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Legal Title & Description */}
              {(legalTitle || legalDescription) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-primary" />
                      {legalTitle || title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {legalDescription}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Why Required */}
              {whyRequired.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Why is this required?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {whyRequired.filter(Boolean).map((reason, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Legal Basis */}
              {legalBasis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      Legal Basis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{legalBasis}</p>
                  </CardContent>
                </Card>
              )}

              {/* Consequences */}
              {consequences && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Consequences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{consequences}</p>
                  </CardContent>
                </Card>
              )}

              {/* How to Proceed */}
              {howToProceed.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      How to Proceed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {howToProceed.filter(Boolean).map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-muted-foreground pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Required Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {documents.filter(Boolean).map((doc, i) => (
                        <Badge key={i} variant="secondary" className="text-sm">
                          <FileText className="h-3 w-3 mr-1" />
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Contact */}
              {contactInfo && (
                <Card>
                  <CardContent className="py-6">
                    <p className="text-sm text-muted-foreground">{contactInfo}</p>
                    {status !== "completed" && (
                      <div className="flex gap-3 mt-4">
                        <Button className="flex-1" disabled>
                          {amount ? "Proceed to Payment" : "Complete Action"}
                        </Button>
                        <Button variant="outline" disabled>
                          Contact Support
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActionContentEditor;
