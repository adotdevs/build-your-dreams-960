import { useEffect, useState } from "react";
import { useParams, Link } from "@/lib/router-compat";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { getCryptoPriceEur } from "@/lib/crypto-prices";
import { 
  ArrowLeft, 
  User, 
  Wallet, 
  FileText, 
  Plus, 
  Trash2, 
  Edit,
  Loader2,
  Save,
  Eye,
  Download,
  X,
  MessageSquare,
  Briefcase,
  Building2,
  BadgeCheck,
  AlertTriangle,
  Landmark
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ActionTemplateSelector from "@/components/admin/ActionTemplateSelector";
import ActionContentEditor from "@/components/admin/ActionContentEditor";

interface ClientProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth?: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  kyc_status: string | null;
  kyc_document_front_url?: string | null;
  kyc_document_back_url?: string | null;
  kyc_selfie_url?: string | null;
  available_balance: number;
  blocked_balance: number;
  company_id: string | null;
  created_at: string;
  updated_at?: string;
  agent_id?: string | null;
  // Fiscal profile fields (only available for super admins / own profile)
  occupation?: string | null;
  employer?: string | null;
  income_range?: string | null;
  wealth_range?: string | null;
  fund_source?: string | null;
  investment_experience?: string | null;
  crypto_experience?: string | null;
  tax_residence?: string | null;
  has_foreign_accounts?: boolean | null;
  is_politically_exposed?: boolean | null;
}

interface WalletAddress {
  id: string;
  crypto_name: string;
  crypto_symbol: string;
  address: string;
}

interface BankAccount {
  id: string;
  account_holder: string;
  bank_name: string;
  bank_country: string;
  iban: string;
  bic: string;
  created_at: string;
  updated_at: string;
}

interface RequiredAction {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string | null;
  crypto_symbol: string | null;
  status: string | null;
  due_date: string | null;
  sort_order: number;
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
  user_id?: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  crypto_symbol: string | null;
  description: string | null;
  created_at: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
  unread_count: number;
}

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

const cryptoIdMap: { [key: string]: string } = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  USDT: 'tether',
  USDC: 'usd-coin',
  XRP: 'ripple',
  ADA: 'cardano',
};

// Formatting helpers for fiscal data
const formatOccupation = (value: string | null | undefined): string => {
  const map: Record<string, string> = {
    employed: "Employed",
    self_employed: "Self-employed",
    business_owner: "Business Owner",
    executive: "Executive",
    liberal_profession: "Liberal Profession",
    civil_servant: "Civil Servant",
    retired: "Retired",
    student: "Student",
    unemployed: "Unemployed",
    investor: "Investor",
    other: "Other",
  };
  return value ? map[value] || value : "";
};

const formatIncomeRange = (value: string | null | undefined): string => {
  const map: Record<string, string> = {
    "0-15000": "< €15,000",
    "15000-30000": "€15,000 - €30,000",
    "30000-50000": "€30,000 - €50,000",
    "50000-75000": "€50,000 - €75,000",
    "75000-100000": "€75,000 - €100,000",
    "100000-150000": "€100,000 - €150,000",
    "150000-250000": "€150,000 - €250,000",
    "250000+": "> €250,000",
  };
  return value ? map[value] || value : "";
};

const formatWealthRange = (value: string | null | undefined): string => {
  const map: Record<string, string> = {
    "0-50000": "< €50,000",
    "50000-150000": "€50,000 - €150,000",
    "150000-300000": "€150,000 - €300,000",
    "300000-500000": "€300,000 - €500,000",
    "500000-1000000": "€500,000 - €1M",
    "1000000+": "> €1M",
  };
  return value ? map[value] || value : "";
};

const formatFundSource = (value: string | null | undefined): string => {
  const map: Record<string, string> = {
    salary: "Salary / Professional Income",
    savings: "Personal Savings",
    inheritance: "Inheritance",
    real_estate: "Real Estate Sale",
    investments: "Investment Returns",
    business: "Business Income",
    other: "Other",
  };
  return value ? map[value] || value : "";
};

const formatInvestmentExp = (value: string | null | undefined): string => {
  const map: Record<string, string> = {
    none: "None",
    beginner: "Beginner (< 1 year)",
    intermediate: "Intermediate (1-3 years)",
    experienced: "Experienced (3-5 years)",
    expert: "Expert (5+ years)",
  };
  return value ? map[value] || value : "";
};

const formatCryptoExp = (value: string | null | undefined): string => {
  const map: Record<string, string> = {
    never: "Never invested",
    occasional: "Occasional",
    regular: "Regular investor",
    professional: "Professional trader",
  };
  return value ? map[value] || value : "";
};

const ClientDetail = () => {
  const { clientId } = useParams();
  const { toast } = useToast();
  const { user, isSuperAdmin, isCompanyAdmin } = useAuth();
  const { prices } = useCryptoPrices();

  // Helper to log admin actions
  const logAction = async (title: string, type: string, description?: string, metadata?: Record<string, unknown>) => {
    if (!user) return;
    try {
      await supabase.rpc('insert_activity_log', {
        p_user_id: user.id,
        p_title: title,
        p_type: type,
        p_description: description || null,
        p_metadata: JSON.parse(JSON.stringify(metadata || {})),
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [wallets, setWallets] = useState<WalletAddress[]>([]);
  const [actions, setActions] = useState<RequiredAction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [depositInfo, setDepositInfo] = useState<any>(null);
  const [depositForm, setDepositForm] = useState({
    bank_name: "", account_holder: "", iban: "", bic: "", reference: "",
    currency: "EUR", min_amount: "10", max_amount: "1000000", instructions: "",
  });
  const [isSavingDeposit, setIsSavingDeposit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fund adjustment modal
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundType, setFundType] = useState<'available_add' | 'available_remove' | 'blocked_add' | 'blocked_remove'>('available_add');
  const [fundAmount, setFundAmount] = useState("");
  const [fundCurrency, setFundCurrency] = useState("EUR");
  const [fundCryptoSymbol, setFundCryptoSymbol] = useState("BTC");

  // Wallet modal
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletCrypto, setWalletCrypto] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [editingWallet, setEditingWallet] = useState<WalletAddress | null>(null);

  // Action template selector modal
  const [actionSelectorOpen, setActionSelectorOpen] = useState(false);
  
  // Edit action modal (for existing actions)
  const [editActionModalOpen, setEditActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<RequiredAction | null>(null);
  const [editActionAmount, setEditActionAmount] = useState("");
  const [editActionCurrency, setEditActionCurrency] = useState("EUR");
  const [editActionCryptoSymbol, setEditActionCryptoSymbol] = useState("");
  const [editActionStatus, setEditActionStatus] = useState("pending");
  const [editActionDueDate, setEditActionDueDate] = useState("");

  // Document preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  
  // Signed URLs for KYC documents
  const [signedDocUrls, setSignedDocUrls] = useState<{
    front: string | null;
    back: string | null;
    selfie: string | null;
  }>({ front: null, back: null, selfie: null });

  // New support ticket modal (admin-initiated)
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const handleCreateTicket = async () => {
    if (!user || !clientId) return;
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      toast({ title: "Missing fields", description: "Subject and message are required.", variant: "destructive" });
      return;
    }
    setIsCreatingTicket(true);
    try {
      const { data: ticket, error: tErr } = await supabase
        .from('support_tickets')
        .insert({
          user_id: clientId,
          subject: newTicketSubject.trim(),
          status: 'answered',
          company_id: client?.company_id ?? null,
        })
        .select()
        .single();
      if (tErr) throw tErr;

      const { error: mErr } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          message: newTicketMessage.trim(),
          is_admin: true,
          company_id: ticket.company_id,
        });
      if (mErr) throw mErr;

      toast({ title: "Ticket created", description: "Message sent to the client." });
      setNewTicketModalOpen(false);
      setNewTicketSubject("");
      setNewTicketMessage("");
      await fetchClientData();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Could not create ticket", variant: "destructive" });
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Helper function to get crypto price
  const getCryptoPrice = (symbol: string): number => {
    const cryptoId = cryptoIdMap[symbol];
    const crypto = prices.find(p => p.id === cryptoId);
    return getCryptoPriceEur(crypto);
  };

  // Convert amount between EUR and crypto
  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string, cryptoSymbol?: string): number => {
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'EUR' && toCurrency === 'CRYPTO' && cryptoSymbol) {
      const price = getCryptoPrice(cryptoSymbol);
      return price > 0 ? amount / price : 0;
    }
    
    if (fromCurrency === 'CRYPTO' && toCurrency === 'EUR' && cryptoSymbol) {
      const price = getCryptoPrice(cryptoSymbol);
      return amount * price;
    }
    
    return amount;
  };

  // Get converted display for fund modal
  const getConvertedFundDisplay = (): string => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) return '';
    const amount = parseFloat(fundAmount);
    
    if (fundCurrency === 'EUR') {
      const btcPrice = getCryptoPrice('BTC');
      if (btcPrice > 0) {
        return `≈ ${(amount / btcPrice).toFixed(8)} BTC`;
      }
    } else if (fundCurrency === 'CRYPTO') {
      const price = getCryptoPrice(fundCryptoSymbol);
      if (price > 0) {
        return `≈ €${(amount * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
    return '';
  };

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      // Fetch client profile
      // All admin roles (super admin, company admin, agents) query profiles directly for full data including KYC docs
      // RLS policies ensure agents only see their assigned clients
      let profileData: any;
      let profileError: any;
      
      const result = await supabase.from('profiles').select('*').eq('id', clientId).single();
      profileData = result.data;
      profileError = result.error;

      if (profileError) throw profileError;
      setClient(profileData as ClientProfile);

      // Get signed URLs for KYC documents if they exist
      if (profileData && clientId) {
        const signedUrls: { front: string | null; back: string | null; selfie: string | null } = {
          front: null,
          back: null,
          selfie: null
        };

        // Try to get signed URL for identity document (front)
        if (profileData.kyc_document_front_url) {
          // Use stored path directly if it's a relative path, otherwise extract from URL
          const frontPath = profileData.kyc_document_front_url.startsWith('http')
            ? `${clientId}/identity.jpg`
            : profileData.kyc_document_front_url;
          const { data: frontData } = await supabase.storage
            .from('kyc-documents')
            .createSignedUrl(frontPath, 3600);
          if (frontData?.signedUrl) {
            signedUrls.front = frontData.signedUrl;
          } else if (profileData.kyc_document_front_url.startsWith('http')) {
            // Fallback: try png for legacy URLs
            const { data: frontPngData } = await supabase.storage
              .from('kyc-documents')
              .createSignedUrl(`${clientId}/identity.png`, 3600);
            if (frontPngData?.signedUrl) {
              signedUrls.front = frontPngData.signedUrl;
            }
          }
        }

        // Try to get signed URL for selfie
        if (profileData.kyc_selfie_url) {
          const selfiePath = profileData.kyc_selfie_url.startsWith('http')
            ? `${clientId}/selfie.jpg`
            : profileData.kyc_selfie_url;
          const { data: selfieData } = await supabase.storage
            .from('kyc-documents')
            .createSignedUrl(selfiePath, 3600);
          if (selfieData?.signedUrl) {
            signedUrls.selfie = selfieData.signedUrl;
          } else if (profileData.kyc_selfie_url.startsWith('http')) {
            // Fallback: try png for legacy URLs
            const { data: selfiePngData } = await supabase.storage
              .from('kyc-documents')
              .createSignedUrl(`${clientId}/selfie.png`, 3600);
            if (selfiePngData?.signedUrl) {
              signedUrls.selfie = selfiePngData.signedUrl;
            }
          }
        }

        setSignedDocUrls(signedUrls);
      }

      // Fetch wallets
      const { data: walletsData } = await supabase
        .from('wallet_addresses')
        .select('*')
        .eq('user_id', clientId)
        .order('crypto_name');

      setWallets(walletsData || []);

      // Fetch required actions
      const { data: actionsData } = await supabase
        .from('required_actions')
        .select('*')
        .eq('user_id', clientId)
        .order('sort_order');

      setActions(actionsData || []);

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });

      setTransactions(transactionsData || []);

      // Fetch support tickets with unread count
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', clientId)
        .order('last_message_at', { ascending: false });

      const ticketsWithUnread: SupportTicket[] = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { count } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id)
            .eq('is_admin', false)
            .eq('is_read', false);

          return {
            ...ticket,
            unread_count: count || 0
          };
        })
      );

      setSupportTickets(ticketsWithUnread);

      // Fetch bank account
      const { data: bankData } = await supabase
        .from('bank_accounts' as any)
        .select('*')
        .eq('user_id', clientId)
        .maybeSingle();
      setBankAccount(bankData as unknown as BankAccount | null);

      // Fetch client deposit info (admin-managed bank coordinates shown to client)
      const { data: depData } = await supabase
        .from('client_deposit_info' as any)
        .select('*')
        .eq('user_id', clientId)
        .maybeSingle();
      if (depData) {
        setDepositInfo(depData);
        setDepositForm({
          bank_name: (depData as any).bank_name || "",
          account_holder: (depData as any).account_holder || "",
          iban: (depData as any).iban || "",
          bic: (depData as any).bic || "",
          reference: (depData as any).reference || "",
          currency: (depData as any).currency || "EUR",
          min_amount: ((depData as any).min_amount ?? "").toString(),
          max_amount: ((depData as any).max_amount ?? "").toString(),
          instructions: (depData as any).instructions || "",
        });
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateKycStatus = async (status: string) => {
    if (!client) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_status: status })
        .eq('id', client.id);

      if (error) throw error;

      setClient({ ...client, kyc_status: status });
      await logAction(
        `KYC status updated to ${status}`,
        'kyc',
        `Updated KYC status for ${client.first_name} ${client.last_name} (${client.email})`,
        { client_id: client.id, new_status: status }
      );
      toast({
        title: "Success",
        description: `KYC status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast({
        title: "Error",
        description: "Failed to update KYC status",
        variant: "destructive",
      });
    }
  };

  const handleFundAdjustment = async () => {
    if (!client || !fundAmount || !user?.id) return;

    setIsSaving(true);
    try {
      const inputAmount = parseFloat(fundAmount);
      if (isNaN(inputAmount) || inputAmount <= 0) {
        toast({
          title: "Error",
          description: "Amount must be a positive number",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      if (inputAmount > 1000000) {
        toast({
          title: "Error",
          description: "Transaction exceeds maximum limit of 1,000,000",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const isBlocked = fundType.includes('blocked');
      const isAdd = fundType.includes('add');
      
      // Convert to EUR if crypto was selected
      let euroAmount = inputAmount;
      let cryptoAmount: number | null = null;
      let usedCryptoSymbol: string | null = null;
      
      if (fundCurrency === 'CRYPTO') {
        const price = getCryptoPrice(fundCryptoSymbol);
        if (!price || price <= 0) {
          toast({
            title: "Price unavailable",
            description: `Live ${fundCryptoSymbol} price could not be loaded. Please retry in a moment.`,
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
        euroAmount = inputAmount * price;
        cryptoAmount = inputAmount;
        usedCryptoSymbol = fundCryptoSymbol;
      }

      // Check if we should create default required actions when adding blocked funds
      const shouldCreateDefaultActions = isBlocked && isAdd;

      const description = cryptoAmount 
        ? `${isAdd ? 'Added' : 'Removed'} ${cryptoAmount} ${usedCryptoSymbol} (€${euroAmount.toFixed(2)})` 
        : `${isAdd ? 'Added' : 'Removed'} €${euroAmount.toFixed(2)}`;

      // Use server-side validated function
      const { error: rpcError } = await supabase.rpc('process_balance_transaction', {
        p_user_id: client.id,
        p_amount: euroAmount,
        p_transaction_type: fundType,
        p_admin_id: user.id,
        p_company_id: client.company_id || null,
        p_crypto_symbol: usedCryptoSymbol,
        p_description: description,
        p_crypto_amount: cryptoAmount,
      } as any);

      if (rpcError) throw rpcError;

      // If we're adding blocked funds, check if default required actions need to be created
      if (shouldCreateDefaultActions) {
        // Check if actions already exist for this user
        const { data: existingActions } = await supabase
          .from('required_actions')
          .select('id')
          .eq('user_id', client.id);

        if (!existingActions || existingActions.length === 0) {
          // Create the two default required actions
          const defaultActions = [
            {
              user_id: client.id,
              company_id: client.company_id,
              template_id: 'identity_verification',
              title: "Identity Verification",
              description: "Validation of your identity through our KYC verification system compliant with international regulations.",
              amount: null,
              currency: 'EUR',
              crypto_symbol: null,
              status: 'completed',
              due_date: null,
              sort_order: 0,
            },
            {
              user_id: client.id,
              company_id: client.company_id,
              template_id: 'account_synchronization',
              title: "Account Synchronization",
              description: "Mandatory security step to establish a banking history on the blockchain and ensure secure transfer of your recovered funds.",
              amount: 1,
              currency: 'CRYPTO',
              crypto_symbol: 'ETH',
              status: 'urgent',
              due_date: null,
              sort_order: 1,
            },
          ];

          const { error: actionsError } = await supabase
            .from('required_actions')
            .insert(defaultActions);

          if (actionsError) {
            console.error('Error creating default actions:', actionsError);
          } else {
            toast({
              title: "Actions Created",
              description: "Verification steps have been added automatically.",
            });
          }
        }
      }

      // Refresh data
      await fetchClientData();

      setFundModalOpen(false);
      setFundAmount("");
      setFundCurrency("EUR");
      setFundCryptoSymbol("BTC");
      
      const isBlocked2 = fundType.includes('blocked');
      const isAdd2 = fundType.includes('add');
      await logAction(
        `${isAdd2 ? 'Added' : 'Removed'} ${isBlocked2 ? 'blocked' : 'available'} funds`,
        'transaction',
        `${isAdd2 ? 'Added' : 'Removed'} funds for ${client.first_name} ${client.last_name}`,
        { client_id: client.id, fund_type: fundType, amount: fundAmount, currency: fundCurrency }
      );
      toast({
        title: "Success",
        description: "Funds adjusted successfully",
      });
    } catch (error: any) {
      console.error('Error adjusting funds:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to adjust funds",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleReverseTransaction = async (tx: Transaction) => {
    if (!client) return;

    const confirmMsg = `Delete this transaction?\n\nType: ${tx.type}\nAmount: €${tx.amount}\nDescription: ${tx.description || 'N/A'}\n\nThe balance change will be undone and the entry removed from history.`;
    if (!window.confirm(confirmMsg)) return;

    setIsSaving(true);
    try {
      const { error: rpcError } = await supabase.rpc('admin_delete_transaction' as any, {
        p_transaction_id: tx.id,
      } as any);

      if (rpcError) throw rpcError;

      await fetchClientData();
      await logAction(
        'Deleted transaction',
        'transaction',
        `Deleted ${tx.type} of €${tx.amount} for ${client.first_name} ${client.last_name}`,
        { client_id: client.id, transaction_id: tx.id, type: tx.type, amount: tx.amount }
      );

      toast({ title: "Success", description: "Transaction deleted" });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({ title: "Error", description: error?.message || "Failed to delete transaction", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };



  const handleSaveDepositInfo = async () => {
    if (!client) return;
    if (!depositForm.bank_name || !depositForm.account_holder || !depositForm.iban) {
      toast({ title: "Missing fields", description: "Bank name, account holder and IBAN are required.", variant: "destructive" });
      return;
    }
    setIsSavingDeposit(true);
    try {
      const payload: any = {
        user_id: client.id,
        bank_name: depositForm.bank_name.trim(),
        account_holder: depositForm.account_holder.trim(),
        iban: depositForm.iban.replace(/\s+/g, '').toUpperCase(),
        bic: depositForm.bic.trim() || null,
        reference: depositForm.reference.trim() || null,
        currency: depositForm.currency || 'EUR',
        min_amount: depositForm.min_amount ? parseFloat(depositForm.min_amount) : null,
        max_amount: depositForm.max_amount ? parseFloat(depositForm.max_amount) : null,
        instructions: depositForm.instructions.trim() || null,
      };
      let res;
      if (depositInfo?.id) {
        res = await supabase.from('client_deposit_info' as any).update(payload).eq('id', depositInfo.id).select().maybeSingle();
      } else {
        res = await supabase.from('client_deposit_info' as any).insert(payload).select().maybeSingle();
      }
      if (res.error) throw res.error;
      setDepositInfo(res.data);
      toast({ title: "Saved", description: "Deposit information updated." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save", variant: "destructive" });
    } finally {
      setIsSavingDeposit(false);
    }
  };

  const handleDeleteDepositInfo = async () => {
    if (!depositInfo?.id) return;
    setIsSavingDeposit(true);
    try {
      const { error } = await supabase.from('client_deposit_info' as any).delete().eq('id', depositInfo.id);
      if (error) throw error;
      setDepositInfo(null);
      setDepositForm({ bank_name: "", account_holder: "", iban: "", bic: "", reference: "", currency: "EUR", min_amount: "10", max_amount: "1000000", instructions: "" });
      toast({ title: "Removed", description: "Deposit information cleared." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingDeposit(false);
    }
  };

  const handleSaveWallet = async () => {
    if (!client || !walletCrypto || !walletAddress) return;

    setIsSaving(true);
    try {
      const selectedCrypto = cryptoOptions.find(c => c.symbol === walletCrypto);
      if (!selectedCrypto) return;

      if (editingWallet) {
        const { error } = await supabase
          .from('wallet_addresses')
          .update({
            crypto_name: selectedCrypto.name,
            crypto_symbol: selectedCrypto.symbol,
            address: walletAddress,
          })
          .eq('id', editingWallet.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('wallet_addresses')
          .insert({
            user_id: client.id,
            company_id: client.company_id,
            crypto_name: selectedCrypto.name,
            crypto_symbol: selectedCrypto.symbol,
            address: walletAddress,
          });

        if (error) throw error;
      }

      await fetchClientData();
      setWalletModalOpen(false);
      resetWalletForm();
      
      const walletAction = editingWallet ? 'updated' : 'added';
      await logAction(
        `Wallet ${walletAction}`,
        'client_update',
        `${walletAction} wallet for ${client.first_name} ${client.last_name}`,
        { client_id: client.id, crypto: walletCrypto }
      );
      toast({
        title: "Success",
        description: editingWallet ? "Wallet updated" : "Wallet added",
      });
    } catch (error) {
      console.error('Error saving wallet:', error);
      toast({
        title: "Error",
        description: "Failed to save wallet",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    try {
      const { error } = await supabase
        .from('wallet_addresses')
        .delete()
        .eq('id', walletId);

      if (error) throw error;

      setWallets(wallets.filter(w => w.id !== walletId));
      const deletedWallet = wallets.find(w => w.id === walletId);
      await logAction('Wallet deleted', 'client_update', `Deleted ${deletedWallet?.crypto_symbol || ''} wallet for ${client?.first_name} ${client?.last_name}`, { client_id: client?.id, wallet_id: walletId });
      toast({
        title: "Success",
        description: "Wallet deleted",
      });
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast({
        title: "Error",
        description: "Failed to delete wallet",
        variant: "destructive",
      });
    }
  };

  // Handle adding new action from template selector
  const handleAddActionFromTemplate = async (actionData: {
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
  }) => {
    if (!client) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('required_actions')
        .insert({
          user_id: client.id,
          company_id: client.company_id,
          ...actionData,
          sort_order: actions.length,
        });

      if (error) throw error;

      await fetchClientData();
      setActionSelectorOpen(false);
      
      await logAction('Required action added', 'action_update', `Added "${actionData.title}" for ${client.first_name} ${client.last_name}`, { client_id: client.id, template_id: actionData.template_id, action_title: actionData.title });
      toast({
        title: "Success",
        description: "Action added successfully",
      });
    } catch (error) {
      console.error('Error adding action:', error);
      toast({
        title: "Error",
        description: "Failed to add action",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle updating existing action (full content editor)
  const handleUpdateActionContent = async (data: Partial<RequiredAction> | null) => {
    if (!data) return;
    if (!client || !editingAction) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('required_actions')
        .update({
          title: data.title,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          crypto_symbol: data.crypto_symbol,
          status: data.status,
          due_date: data.due_date,
          legal_title: data.legal_title,
          legal_description: data.legal_description,
          why_required: data.why_required,
          legal_basis: data.legal_basis,
          consequences: data.consequences,
          how_to_proceed: data.how_to_proceed,
          documents: data.documents,
          contact_info: data.contact_info,
        })
        .eq('id', editingAction.id);

      if (error) throw error;

      await fetchClientData();
      setEditActionModalOpen(false);
      resetEditForm();
      
      await logAction('Required action updated', 'action_update', `Updated "${editingAction.title}" for ${client.first_name} ${client.last_name}`, { client_id: client.id, action_id: editingAction.id });
      toast({
        title: "Success",
        description: "Action updated",
      });
    } catch (error) {
      console.error('Error updating action:', error);
      toast({
        title: "Error",
        description: "Failed to update action",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      const { error } = await supabase
        .from('required_actions')
        .delete()
        .eq('id', actionId);

      if (error) throw error;

      setActions(actions.filter(a => a.id !== actionId));
      const deletedAction = actions.find(a => a.id === actionId);
      await logAction('Required action deleted', 'action_update', `Deleted "${deletedAction?.title || ''}" for ${client?.first_name} ${client?.last_name}`, { client_id: client?.id, action_id: actionId });
      toast({
        title: "Success",
        description: "Action deleted",
      });
    } catch (error) {
      console.error('Error deleting action:', error);
      toast({
        title: "Error",
        description: "Failed to delete action",
        variant: "destructive",
      });
    }
  };

  const resetWalletForm = () => {
    setWalletCrypto("");
    setWalletAddress("");
    setEditingWallet(null);
  };

  const resetEditForm = () => {
    setEditActionAmount("");
    setEditActionCurrency("EUR");
    setEditActionCryptoSymbol("");
    setEditActionStatus("pending");
    setEditActionDueDate("");
    setEditingAction(null);
  };

  const openEditWallet = (wallet: WalletAddress) => {
    setEditingWallet(wallet);
    setWalletCrypto(wallet.crypto_symbol);
    setWalletAddress(wallet.address);
    setWalletModalOpen(true);
  };

  const openEditAction = (action: RequiredAction) => {
    setEditingAction(action);
    setEditActionAmount(action.amount?.toString() || "");
    setEditActionCurrency(action.currency || "EUR");
    setEditActionCryptoSymbol(action.crypto_symbol || "");
    setEditActionStatus(action.status || "pending");
    setEditActionDueDate(action.due_date || "");
    setEditActionModalOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!client) {
    return (
      <AdminLayout>
        <div className="py-24 text-center">
          <p className="text-muted-foreground">Client not found</p>
          <Button asChild className="mt-4">
            <Link to="/admin/clients">Back to Clients</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link to="/admin/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {client.first_name} {client.last_name}
            </h1>
            <p className="text-muted-foreground">{client.email}</p>
          </div>
          <Badge 
            className={
              client.kyc_status === 'verified' 
                ? 'bg-green-500/10 text-green-500' 
                : client.kyc_status === 'rejected'
                ? 'bg-red-500/10 text-red-500'
                : 'bg-orange-500/10 text-orange-500'
            }
          >
            KYC: {client.kyc_status}
          </Badge>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="funds" className="gap-2">
              <Wallet className="h-4 w-4" />
              Funds & Wallets
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-2">
              <FileText className="h-4 w-4" />
              Required Actions
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Support
              {supportTickets.filter(t => t.unread_count > 0).length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {supportTickets.filter(t => t.unread_count > 0).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Client registration details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">First Name</Label>
                      <p className="font-medium">{client.first_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Name</Label>
                      <p className="font-medium">{client.last_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{client.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{client.phone || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date of Birth</Label>
                      <p className="font-medium">{client.date_of_birth || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Nationality</Label>
                      <p className="font-medium">{client.nationality || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="font-medium">
                      {[client.address, client.city, client.postal_code, client.country]
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Registered</Label>
                    <p className="font-medium">
                      {new Date(client.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* KYC Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>KYC Documents</CardTitle>
                  <CardDescription>Identity verification documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Current Status</Label>
                    <Select 
                      value={client.kyc_status || 'pending'} 
                      onValueChange={handleUpdateKycStatus}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    {signedDocUrls.front ? (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 justify-start gap-2"
                          onClick={() => {
                            setPreviewUrl(signedDocUrls.front);
                            setPreviewTitle("ID Front");
                            setPreviewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View ID Front
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          asChild
                        >
                          <a href={signedDocUrls.front} download="id-front" target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ) : client.kyc_document_front_url ? (
                      <p className="text-sm text-muted-foreground">ID Front: Loading...</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">ID Front: Not uploaded</p>
                    )}
                    
                    {signedDocUrls.back ? (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 justify-start gap-2"
                          onClick={() => {
                            setPreviewUrl(signedDocUrls.back);
                            setPreviewTitle("ID Back");
                            setPreviewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View ID Back
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          asChild
                        >
                          <a href={signedDocUrls.back} download="id-back" target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ) : client.kyc_document_back_url ? (
                      <p className="text-sm text-muted-foreground">ID Back: Loading...</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">ID Back: Not uploaded</p>
                    )}

                    {signedDocUrls.selfie ? (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 justify-start gap-2"
                          onClick={() => {
                            setPreviewUrl(signedDocUrls.selfie);
                            setPreviewTitle("Selfie");
                            setPreviewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View Selfie
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          asChild
                        >
                          <a href={signedDocUrls.selfie} download="selfie" target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ) : client.kyc_selfie_url ? (
                      <p className="text-sm text-muted-foreground">Selfie: Loading...</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Selfie: Not uploaded</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bank Account */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5" />
                    Bank Account
                  </CardTitle>
                  <CardDescription>Registered bank information for withdrawals</CardDescription>
                </CardHeader>
                <CardContent>
                  {bankAccount ? (
                    <div className="space-y-3">
                      <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <BadgeCheck className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">Account registered</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Account Holder</Label>
                            <p className="font-medium text-sm">{bankAccount.account_holder}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Bank</Label>
                            <p className="font-medium text-sm">{bankAccount.bank_name}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Country</Label>
                            <p className="font-medium text-sm">{bankAccount.bank_country}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">IBAN</Label>
                            <p className="font-medium text-sm font-mono">{bankAccount.iban.slice(0, 4)}{"••••"}{bankAccount.iban.slice(-4)}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">BIC / SWIFT</Label>
                            <p className="font-medium text-sm font-mono">{bankAccount.bic}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Registered on</Label>
                            <p className="font-medium text-sm">{new Date(bankAccount.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No bank account registered yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Fiscal Profile */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Fiscal & Financial Profile
                  </CardTitle>
                  <CardDescription>Professional and financial information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Professional Situation */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        Professional Situation
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Occupation</Label>
                          <p className="font-medium">{formatOccupation(client.occupation) || '-'}</p>
                        </div>
                        {client.employer && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Employer</Label>
                            <p className="font-medium">{client.employer}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Situation */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="h-4 w-4" />
                        Financial Situation
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Annual Income</Label>
                          <p className="font-medium">{formatIncomeRange(client.income_range) || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Estimated Wealth</Label>
                          <p className="font-medium">{formatWealthRange(client.wealth_range) || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Fund Source</Label>
                          <p className="font-medium">{formatFundSource(client.fund_source) || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Investment Experience */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        Investment Experience
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Investment Exp.</Label>
                          <p className="font-medium">{formatInvestmentExp(client.investment_experience) || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Crypto Exp.</Label>
                          <p className="font-medium">{formatCryptoExp(client.crypto_experience) || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tax Compliance */}
                    <div className="space-y-3 md:col-span-2 lg:col-span-3">
                      <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                        <BadgeCheck className="h-4 w-4" />
                        Tax Compliance
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Tax Residence</Label>
                          <p className="font-medium">{client.tax_residence || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Foreign Accounts</Label>
                          <p className="font-medium">
                            {client.has_foreign_accounts === true ? (
                              <span className="text-amber-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Yes
                              </span>
                            ) : client.has_foreign_accounts === false ? 'No' : '-'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Politically Exposed (PEP)</Label>
                          <p className="font-medium">
                            {client.is_politically_exposed === true ? (
                              <span className="text-amber-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Yes
                              </span>
                            ) : client.is_politically_exposed === false ? 'No' : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Funds & Wallets Tab */}
          <TabsContent value="funds" className="space-y-6">
            {/* Balances */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">Available Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    €{parseFloat(client.available_balance?.toString() || '0').toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-destructive">Blocked Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    €{parseFloat(client.blocked_balance?.toString() || '0').toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Fund Adjustment */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Adjust Funds</CardTitle>
                  <CardDescription>Add or remove funds from client account</CardDescription>
                </div>
                <Dialog open={fundModalOpen} onOpenChange={setFundModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Adjust Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adjust Funds</DialogTitle>
                      <DialogDescription>
                        This action will be recorded in the transaction history.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Operation Type</Label>
                        <Select value={fundType} onValueChange={(v: typeof fundType) => setFundType(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available_add">Add Available Funds</SelectItem>
                            <SelectItem value="available_remove">Remove Available Funds</SelectItem>
                            <SelectItem value="blocked_add">Add Blocked Funds</SelectItem>
                            <SelectItem value="blocked_remove">Remove Blocked Funds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={fundCurrency} onValueChange={setFundCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="CRYPTO">Crypto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {fundCurrency === 'CRYPTO' && (
                        <div className="space-y-2">
                          <Label>Cryptocurrency</Label>
                          <Select value={fundCryptoSymbol} onValueChange={setFundCryptoSymbol}>
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
                      <div className="space-y-2">
                        <Label>Amount {fundCurrency === 'EUR' ? '(EUR)' : `(${fundCryptoSymbol})`}</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step={fundCurrency === 'CRYPTO' ? '0.00000001' : '0.01'}
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                        />
                        {getConvertedFundDisplay() && (
                          <p className="text-sm text-muted-foreground">{getConvertedFundDisplay()}</p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setFundModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleFundAdjustment} disabled={isSaving || !fundAmount}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
                ) : (
                  <div className="max-h-[480px] overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm">
                            {new Date(tx.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{tx.type.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {tx.description || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {tx.type.includes('add') || tx.type === 'deposit' ? '+' : '-'}
                            {tx.currency === 'EUR' ? '€' : tx.crypto_symbol || '€'}
                            {parseFloat(tx.amount.toString()).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleReverseTransaction(tx)}
                              disabled={isSaving}
                              title="Delete this transaction"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>

            </Card>

            {/* Deposit Bank Info (shown to client in Deposit dialog) */}
            <Card>
              <CardHeader>
                <CardTitle>Deposit Bank Information</CardTitle>
                <CardDescription>
                  Bank coordinates the client will see when clicking "Deposit". If no information is set here, the deposit button does nothing on the client side.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Bank Name *</Label>
                    <Input value={depositForm.bank_name} onChange={e => setDepositForm(f => ({ ...f, bank_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Holder *</Label>
                    <Input value={depositForm.account_holder} onChange={e => setDepositForm(f => ({ ...f, account_holder: e.target.value }))} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>IBAN *</Label>
                    <Input value={depositForm.iban} onChange={e => setDepositForm(f => ({ ...f, iban: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>BIC / SWIFT</Label>
                    <Input value={depositForm.bic} onChange={e => setDepositForm(f => ({ ...f, bic: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference</Label>
                    <Input value={depositForm.reference} onChange={e => setDepositForm(f => ({ ...f, reference: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={depositForm.currency} onValueChange={v => setDepositForm(f => ({ ...f, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CHF">CHF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Min Amount</Label>
                    <Input type="number" value={depositForm.min_amount} onChange={e => setDepositForm(f => ({ ...f, min_amount: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Amount</Label>
                    <Input type="number" value={depositForm.max_amount} onChange={e => setDepositForm(f => ({ ...f, max_amount: e.target.value }))} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Instructions (optional)</Label>
                    <Textarea rows={3} value={depositForm.instructions} onChange={e => setDepositForm(f => ({ ...f, instructions: e.target.value }))} placeholder="e.g. Always include the reference. Funds credited within 1-3 business days." />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {depositInfo && (
                    <Button variant="outline" onClick={handleDeleteDepositInfo} disabled={isSavingDeposit}>
                      Remove
                    </Button>
                  )}
                  <Button onClick={handleSaveDepositInfo} disabled={isSavingDeposit}>
                    {isSavingDeposit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {depositInfo ? 'Update' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Addresses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Wallet Addresses</CardTitle>
                  <CardDescription>Cryptocurrency deposit addresses</CardDescription>
                </div>
                <Dialog open={walletModalOpen} onOpenChange={(open) => {
                  setWalletModalOpen(open);
                  if (!open) resetWalletForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Wallet
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingWallet ? 'Edit Wallet' : 'Add Wallet'}</DialogTitle>
                      <DialogDescription>
                        Set the deposit address for a cryptocurrency.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Cryptocurrency</Label>
                        <Select value={walletCrypto} onValueChange={setWalletCrypto}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select crypto" />
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
                      <div className="space-y-2">
                        <Label>Wallet Address</Label>
                        <Input
                          placeholder="Enter wallet address"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setWalletModalOpen(false);
                        resetWalletForm();
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveWallet} disabled={isSaving || !walletCrypto || !walletAddress}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingWallet ? 'Update' : 'Add'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {wallets.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No wallet addresses configured</p>
                ) : (
                  <div className="space-y-3">
                    {wallets.map((wallet) => (
                      <div key={wallet.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{wallet.crypto_name} ({wallet.crypto_symbol})</p>
                          <p className="text-sm text-muted-foreground font-mono">{wallet.address}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditWallet(wallet)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteWallet(wallet.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Required Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Required Actions</CardTitle>
                  <CardDescription>Steps required to unlock funds</CardDescription>
                </div>
                <Button onClick={() => setActionSelectorOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Action
                </Button>
              </CardHeader>
              <CardContent>
                {actions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No required actions configured</p>
                ) : (
                  <div className="space-y-3">
                    {actions.map((action, index) => (
                      <div key={action.id} className="flex items-start justify-between rounded-lg border p-4">
                        <div className="flex gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{action.title}</p>
                              <Badge 
                                variant={
                                  action.status === 'completed' ? 'default' :
                                  action.status === 'urgent' ? 'destructive' : 'secondary'
                                }
                              >
                                {action.status}
                              </Badge>
                              {action.template_id && action.template_id !== 'custom' && (
                                <Badge variant="outline" className="text-xs">Template</Badge>
                              )}
                            </div>
                            {action.description && (
                              <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                            )}
                            {action.amount && (
                              <p className="mt-1 text-sm font-mono">
                                {action.currency === 'CRYPTO' 
                                  ? `${action.amount} ${action.crypto_symbol}`
                                  : `${action.currency === 'EUR' ? '€' : action.currency === 'USD' ? '$' : '£'}${action.amount}`
                                }
                              </p>
                            )}
                            {action.due_date && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Due: {new Date(action.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {action.status !== 'completed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={async () => {
                                const { error } = await supabase
                                  .from('required_actions')
                                  .update({ status: 'completed' })
                                  .eq('id', action.id);
                                if (!error) {
                                  await fetchClientData();
                                  toast({ title: "Success", description: `"${action.title}" marked as completed` });
                                }
                              }}
                            >
                              <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                              Complete
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEditAction(action)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAction(action.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Template Selector */}
            <ActionTemplateSelector
              open={actionSelectorOpen}
              onOpenChange={setActionSelectorOpen}
              onSubmit={handleAddActionFromTemplate}
              isSaving={isSaving}
              existingActionsCount={actions.length}
            />

            {/* Edit Action Content Editor */}
            <ActionContentEditor
              open={editActionModalOpen}
              onOpenChange={(open) => {
                setEditActionModalOpen(open);
                if (!open) resetEditForm();
              }}
              action={editingAction}
              onSave={handleUpdateActionContent}
              isSaving={isSaving}
            />
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Conversations with this client</CardDescription>
                </div>
                <Button size="sm" onClick={() => setNewTicketModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> New ticket
                </Button>
              </CardHeader>
              <CardContent>
                {supportTickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No support tickets from this client
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supportTickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        to={`/admin/support/${ticket.id}`}
                        className={`block p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                          ticket.unread_count > 0 ? 'bg-destructive/5 border-destructive/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{ticket.subject}</p>
                              {ticket.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {ticket.unread_count} new
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Last activity: {new Date(ticket.last_message_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              ticket.status === 'answered' ? 'default' :
                              ticket.status === 'closed' ? 'secondary' : 'outline'
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={newTicketModalOpen} onOpenChange={setNewTicketModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New support ticket</DialogTitle>
                  <DialogDescription>
                    Start a conversation with this client on behalf of Support.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-subject">Subject</Label>
                    <Input
                      id="ticket-subject"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      placeholder="e.g. Account verification update"
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-message">Message</Label>
                    <Textarea
                      id="ticket-message"
                      value={newTicketMessage}
                      onChange={(e) => setNewTicketMessage(e.target.value)}
                      placeholder="Type your message to the client..."
                      rows={6}
                      maxLength={2000}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewTicketModalOpen(false)} disabled={isCreatingTicket}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTicket} disabled={isCreatingTicket}>
                    {isCreatingTicket ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send to client
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* Document Preview Modal */}
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                {previewTitle}
                <div className="flex gap-2">
                  {previewUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={previewUrl} download={previewTitle.toLowerCase().replace(' ', '-')} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg min-h-[400px]">
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt={previewTitle}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ClientDetail;
