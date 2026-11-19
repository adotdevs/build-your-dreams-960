import { useTranslation } from "react-i18next";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  FileQuestion, MessageSquare, Paperclip, X, FileText, Image as ImageIcon, Download,
  Send, Loader2, Plus, ArrowLeft, Search, CheckCircle2, Clock3, Lock, LifeBuoy, Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface Ticket { id: string; subject: string; status: string; created_at: string; last_message_at: string; }
interface Message { id: string; message: string; is_admin: boolean; created_at: string; attachments: string[] | null; }

const faqsData = {
  en: [
    { question: "How do I verify my identity (KYC)?", answer: "To verify your identity, go to Settings and complete the KYC process by uploading a valid ID document (passport, driver's license, or national ID) and a proof of address. Verification usually takes 24-48 hours." },
    { question: "How long do withdrawals take?", answer: "Cryptocurrency withdrawals are typically processed within 1-2 hours. However, network congestion may cause delays. Bank transfers can take 1-3 business days." },
    { question: "What are the transaction fees?", answer: "Our platform charges a small fee for transactions. The exact fee depends on the cryptocurrency and network conditions. You can view the fee before confirming any transaction." },
    { question: "Is my crypto safe?", answer: "Yes, we use industry-leading security measures including cold storage for 95% of assets, 256-bit SSL encryption, and two-factor authentication." },
    { question: "How do I reset my password?", answer: "Click on 'Forgot Password' on the login page and enter your email address. You'll receive a link to reset your password." },
  ],
  fr: [
    { question: "Comment vérifier mon identité (KYC) ?", answer: "Pour vérifier votre identité, allez dans Paramètres et complétez le processus KYC en téléchargeant une pièce d'identité valide et un justificatif de domicile. La vérification prend généralement 24 à 48 heures." },
    { question: "Combien de temps prennent les retraits ?", answer: "Les retraits de cryptomonnaies sont généralement traités dans un délai de 1 à 2 heures. Les virements bancaires peuvent prendre 1 à 3 jours ouvrables." },
    { question: "Quels sont les frais de transaction ?", answer: "Notre plateforme facture des frais minimes pour les transactions." },
    { question: "Mes cryptos sont-elles en sécurité ?", answer: "Oui, nous utilisons des mesures de sécurité de pointe incluant le stockage à froid pour 95% des actifs, le chiffrement SSL 256 bits et l'authentification à deux facteurs." },
    { question: "Comment réinitialiser mon mot de passe ?", answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion et entrez votre adresse email." },
  ],
  de: [
    { question: "Wie verifiziere ich meine Identität (KYC)?", answer: "Gehen Sie zu Einstellungen und schließen Sie den KYC-Prozess ab. Die Verifizierung dauert in der Regel 24-48 Stunden." },
    { question: "Wie lange dauern Auszahlungen?", answer: "Kryptowährungsauszahlungen werden in der Regel innerhalb von 1-2 Stunden bearbeitet." },
    { question: "Was sind die Transaktionsgebühren?", answer: "Unsere Plattform erhebt eine geringe Gebühr für Transaktionen." },
    { question: "Ist meine Krypto sicher?", answer: "Ja, wir verwenden branchenführende Sicherheitsmaßnahmen." },
    { question: "Wie setze ich mein Passwort zurück?", answer: "Klicken Sie auf 'Passwort vergessen' auf der Anmeldeseite." },
  ],
  es: [
    { question: "¿Cómo verifico mi identidad (KYC)?", answer: "Vaya a Configuración y complete el proceso KYC. La verificación tarda 24-48 horas." },
    { question: "¿Cuánto tardan los retiros?", answer: "Los retiros de criptomonedas se procesan en 1-2 horas." },
    { question: "¿Cuáles son las tarifas?", answer: "Nuestra plataforma cobra una pequeña tarifa por transacciones." },
    { question: "¿Están seguras mis criptomonedas?", answer: "Sí, utilizamos medidas de seguridad líderes en la industria." },
    { question: "¿Cómo restablezco mi contraseña?", answer: "Haga clic en 'Olvidé mi contraseña' en la página de inicio." },
  ],
  pt: [
    { question: "Como verifico minha identidade (KYC)?", answer: "Vá a Configurações e complete o processo KYC." },
    { question: "Quanto tempo levam os saques?", answer: "Os saques de criptomoedas são processados em 1-2 horas." },
    { question: "Quais são as taxas?", answer: "Nossa plataforma cobra uma pequena taxa por transações." },
    { question: "Minhas criptomoedas estão seguras?", answer: "Sim, utilizamos medidas de segurança líderes do setor." },
    { question: "Como redefinir minha senha?", answer: "Clique em 'Esqueci minha senha' na página de login." },
  ],
  it: [
    { question: "Come verifico la mia identità (KYC)?", answer: "Vai alle Impostazioni e completa il processo KYC." },
    { question: "Quanto tempo richiedono i prelievi?", answer: "I prelievi vengono elaborati entro 1-2 ore." },
    { question: "Quali sono le commissioni?", answer: "La nostra piattaforma applica una piccola commissione." },
    { question: "Le mie cripto sono al sicuro?", answer: "Sì, utilizziamo misure di sicurezza all'avanguardia." },
    { question: "Come resettare la password?", answer: "Clicca su 'Password dimenticata' nella pagina di login." },
  ],
  ar: [
    { question: "كيف أتحقق من هويتي (KYC)؟", answer: "انتقل إلى الإعدادات وأكمل عملية KYC. يستغرق التحقق 24-48 ساعة." },
    { question: "كم تستغرق عمليات السحب؟", answer: "تتم معالجة سحب العملات المشفرة خلال 1-2 ساعة." },
    { question: "ما هي رسوم المعاملات؟", answer: "تفرض منصتنا رسومًا بسيطة على المعاملات." },
    { question: "هل عملاتي المشفرة آمنة؟", answer: "نعم، نستخدم إجراءات أمان رائدة في الصناعة." },
    { question: "كيف أعيد تعيين كلمة المرور؟", answer: "انقر على 'نسيت كلمة المرور' في صفحة تسجيل الدخول." },
  ],
};

const Support = () => {
  const { t, i18n } = useTranslation(['actions', 'common']);
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  // Chat input
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New conversation dialog
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);

  const currentFaqs = faqsData[i18n.language as keyof typeof faqsData] || faqsData.en;

  useEffect(() => { if (user) fetchTickets(); }, [user]);

  useEffect(() => {
    if (!selectedTicket) return;
    fetchMessages(selectedTicket.id);
    const channel = supabase
      .channel(`ticket-page-${selectedTicket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${selectedTicket.id}` },
        (payload) => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Realtime ticket list updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`tickets-list-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user.id}` },
        () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('support_tickets')
        .select('*').eq('user_id', user.id).order('last_message_at', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase.from('support_messages')
        .select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (e) { console.error(e); }
  };

  const validateFiles = (files: File[]) => {
    const max = 10 * 1024 * 1024;
    return files.filter(f => {
      if (f.size > max) { toast.error(t('actions:support.toast.fileTooLarge', { name: f.name })); return false; }
      return true;
    });
  };

  const onPickReplyFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...validateFiles(files)].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const onPickNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewFiles(prev => [...prev, ...validateFiles(files)].slice(0, 5));
    if (newFileInputRef.current) newFileInputRef.current.value = '';
  };

  const uploadFiles = async (ticketId: string, files: File[]) => {
    const refs: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${ticketId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('support-attachments').upload(path, file);
      if (error) throw error;
      refs.push(`${file.name}|||${path}`);
    }
    return refs;
  };

  const handleDownloadAttachment = async (attachment: string) => {
    const parts = attachment.split('|||');
    const path = parts.length > 1 ? parts[1] : parts[0];
    try {
      const { data } = await supabase.storage.from('support-attachments').createSignedUrl(path, 60 * 60);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch { toast.error(t('actions:support.toast.downloadError')); }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || (!newMessage.trim() && selectedFiles.length === 0)) return;
    if (newMessage.trim().length > 2000) { toast.error(t('actions:support.toast.messageTooLong')); return; }
    setSending(true);
    try {
      const refs = await uploadFiles(selectedTicket.id, selectedFiles);
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: selectedTicket.id, sender_id: user.id,
        message: newMessage.trim() || (refs.length > 0 ? '📎' : ''),
        is_admin: false, attachments: refs.length > 0 ? refs : null,
      });
      if (error) throw error;
      setNewMessage(""); setSelectedFiles([]);
      await supabase.from('support_tickets').update({ last_message_at: new Date().toISOString(), status: 'open' }).eq('id', selectedTicket.id);
    } catch (e) { console.error(e); toast.error(t('actions:support.toast.sendError')); }
    finally { setSending(false); }
  };

  const handleCreateTicket = async () => {
    if (!user || !newSubject.trim() || !newBody.trim()) return;
    setCreating(true);
    try {
      const { data: ticket, error } = await supabase.from('support_tickets').insert({
        user_id: user.id, subject: newSubject.trim(), status: 'open',
      }).select().single();
      if (error) throw error;

      const refs = await uploadFiles(ticket.id, newFiles);
      const { error: msgError } = await supabase.from('support_messages').insert({
        ticket_id: ticket.id, sender_id: user.id, message: newBody.trim(),
        is_admin: false, attachments: refs.length > 0 ? refs : null,
      });
      if (msgError) throw msgError;

      toast.success(t('actions:support.toast.created'));
      setShowNewDialog(false);
      setNewSubject(""); setNewBody(""); setNewFiles([]);
      await fetchTickets();
      setSelectedTicket(ticket as Ticket);
    } catch (e) { console.error(e); toast.error(t('actions:support.toast.createError')); }
    finally { setCreating(false); }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (statusFilter === 'open' && t.status === 'closed') return false;
      if (statusFilter === 'closed' && t.status !== 'closed') return false;
      if (searchQuery && !t.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tickets, statusFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'answered': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"><CheckCircle2 className="h-3 w-3 mr-1" />{t('actions:support.status.answered')}</Badge>;
      case 'closed': return <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />{t('actions:support.status.closed')}</Badge>;
      default: return <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5"><Clock3 className="h-3 w-3 mr-1" />{t('actions:support.status.pending')}</Badge>;
    }
  };

  const FilePreviewChip = ({ file, onRemove }: { file: File; onRemove: () => void }) => (
    <div className="flex items-center gap-2 bg-muted/70 border rounded-lg px-2.5 py-1.5 text-xs">
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate max-w-[140px]">{file.name}</span>
      <span className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <MobileNav />
        <main className="p-3 sm:p-4 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
                <LifeBuoy className="h-3.5 w-3.5" /> {t('actions:support.pageTitle')}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {t('actions:support.heroTitle')}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                {t('actions:support.heroSubtitle')}
              </p>
            </div>
            <Button size="lg" onClick={() => setShowNewDialog(true)} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" /> {t('actions:support.newConversation')}
            </Button>
          </div>

          {/* Conversation view OR list */}
          {selectedTicket ? (
            <Card className="overflow-hidden">
              <CardHeader className="border-b py-3 px-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)} className="shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{selectedTicket.subject}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('actions:support.openedOn')} {format(new Date(selectedTicket.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </CardHeader>

              <div className="h-[55vh] min-h-[400px] flex flex-col">
                <ScrollArea className="flex-1 px-4 sm:px-6 py-4 bg-muted/20">
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        {t('actions:support.noMessagesYet')}
                      </div>
                    )}
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${msg.is_admin ? 'bg-card border rounded-bl-md' : 'bg-primary text-primary-foreground rounded-br-md'}`}>
                          {msg.is_admin && <p className="text-xs font-medium mb-1 text-muted-foreground">Support</p>}
                          {msg.message && msg.message !== '📎' && (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          )}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className={`mt-2 space-y-1 ${msg.message && msg.message !== '📎' ? 'pt-2 border-t' : ''} ${msg.is_admin ? 'border-border/50' : 'border-primary-foreground/20'}`}>
                              {msg.attachments.map((att, i) => {
                                const fileName = att.split('|||')[0];
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                return (
                                  <button key={i} onClick={() => handleDownloadAttachment(att)}
                                    className={`flex items-center gap-2 text-xs underline w-full text-left ${msg.is_admin ? 'text-foreground/70 hover:text-foreground' : 'text-primary-foreground/90 hover:text-primary-foreground'}`}>
                                    {isImage ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                    <span className="truncate flex-1">{fileName}</span>
                                    <Download className="h-3.5 w-3.5 shrink-0" />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <p className={`text-[10px] mt-1.5 ${msg.is_admin ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                            {format(new Date(msg.created_at), 'dd/MM HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {selectedTicket.status !== 'closed' ? (
                  <div className="p-3 sm:p-4 border-t bg-background space-y-2">
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedFiles.map((file, i) => (
                          <FilePreviewChip key={i} file={file} onRemove={() => setSelectedFiles(p => p.filter((_, idx) => idx !== i))} />
                        ))}
                      </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-end gap-2">
                      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={onPickReplyFiles} className="hidden" />
                      <Button type="button" size="icon" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={sending || selectedFiles.length >= 5} title={t('actions:support.attachFile')}>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Textarea
                        placeholder={t('actions:support.messagePlaceholder')}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                        maxLength={2000}
                        rows={1}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        className="flex-1 min-h-[40px] max-h-32 resize-none"
                      />
                      <Button type="submit" size="icon" disabled={sending || (!newMessage.trim() && selectedFiles.length === 0)}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 border-t bg-muted/30 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" /> {t('actions:support.ticketClosed')}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <>
              {/* Quick start banner */}
              <Card className="mb-6 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{t('actions:support.quickStartTitle')}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{t('actions:support.quickStartDesc')}</p>
                  </div>
                  <Button onClick={() => setShowNewDialog(true)} className="shrink-0 w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> {t('actions:support.startChat')}
                  </Button>
                </CardContent>
              </Card>

              {/* History */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <CardTitle className="text-base flex items-center gap-2 flex-1">
                      <MessageSquare className="h-4 w-4" />
                      {t('actions:support.history')}
                      <span className="text-muted-foreground font-normal text-sm">({tickets.length})</span>
                    </CardTitle>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('actions:support.searchPlaceholder')} className="pl-8 h-9" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    {(['all', 'open', 'closed'] as const).map(s => (
                      <Button key={s} variant={statusFilter === s ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter(s)} className="h-7 text-xs">
                        {t(`actions:support.filter.${s}`)}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground text-sm flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> {t('actions:support.loading')}
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-7 w-7 text-muted-foreground/60" />
                      </div>
                      <p className="text-sm font-medium mb-1">{tickets.length === 0 ? t('actions:support.emptyTitle') : t('actions:support.noResults')}</p>
                      <p className="text-xs text-muted-foreground mb-4">{tickets.length === 0 ? t('actions:support.emptyDesc') : t('actions:support.noResultsHint')}</p>
                      {tickets.length === 0 && (
                        <Button onClick={() => setShowNewDialog(true)} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" /> {t('actions:support.newConversation')}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y -mx-6">
                      {filteredTickets.map((ticket) => (
                        <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                          className="w-full text-left px-6 py-4 hover:bg-muted/40 transition-colors flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{ticket.subject}</p>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('actions:support.lastMessage')} {formatDistanceToNow(new Date(ticket.last_message_at), { addSuffix: true })}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* FAQ */}
          {!selectedTicket && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileQuestion className="h-5 w-5" />{t('actions:support.faqTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {currentFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-start text-sm">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* New conversation dialog */}
      <Dialog open={showNewDialog} onOpenChange={(o) => { if (!creating) setShowNewDialog(o); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('actions:support.newConversation')}</DialogTitle>
            <DialogDescription>{t('actions:support.newConversationDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-subject">{t('actions:support.subject')}</Label>
              <Input id="ticket-subject" placeholder={t('actions:support.subjectPlaceholder')} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} maxLength={120} disabled={creating} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ticket-body">{t('actions:support.message')}</Label>
              <Textarea id="ticket-body" placeholder={t('actions:support.messageBodyPlaceholder')} value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={5} maxLength={2000} disabled={creating} />
              <p className="text-xs text-muted-foreground text-right">{newBody.length}/2000</p>
            </div>
            <div className="space-y-1.5">
              <Label>{t('actions:support.attachments')} <span className="text-muted-foreground font-normal">({t('actions:support.optional')})</span></Label>
              <input ref={newFileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={onPickNewFiles} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => newFileInputRef.current?.click()} disabled={creating || newFiles.length >= 5} className="w-full">
                <Paperclip className="h-4 w-4 mr-2" />
                {t('actions:support.addFiles')} {newFiles.length > 0 && `(${newFiles.length}/5)`}
              </Button>
              {newFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {newFiles.map((file, i) => (
                    <FilePreviewChip key={i} file={file} onRemove={() => setNewFiles(p => p.filter((_, idx) => idx !== i))} />
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t('actions:support.attachmentsHint')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} disabled={creating}>{t('common:cancel', 'Cancel')}</Button>
            <Button onClick={handleCreateTicket} disabled={creating || !newSubject.trim() || !newBody.trim()}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {t('actions:support.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
