import { useState, useEffect, useRef } from "react";
import { useLocation } from "@/lib/router-compat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Loader2, 
  Plus,
  X,
  ChevronDown,
  Headphones,
  FileText,
  Image,
  File,
  Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
}

interface Message {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
  attachments: string[] | null;
}

const SupportChat = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Don't show on admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (user && !isAdminRoute) {
      fetchTickets();
      // Fetch user's company_id
      supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setUserCompanyId(data.company_id);
        });
    }
  }, [user, isAdminRoute]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`ticket-${selectedTicket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_id=eq.${selectedTicket.id}`
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTickets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);

      // Count unread tickets (those with admin responses we haven't seen)
      const unreadTickets = (data || []).filter(t => t.status === 'answered');
      setUnreadCount(unreadTickets.length);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!user || !newTicketSubject.trim() || !newTicketMessage.trim()) return;

    setIsCreatingTicket(true);
    try {
      // Create ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: newTicketSubject.trim(),
          status: 'open',
          company_id: userCompanyId,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create first message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: user.id,
          message: newTicketMessage.trim(),
          is_admin: false,
          company_id: userCompanyId,
        });

      if (messageError) throw messageError;

      toast({
        title: "Ticket Created",
        description: "Our team will respond as soon as possible.",
      });

      setShowNewTicketModal(false);
      setNewTicketSubject("");
      setNewTicketMessage("");
      await fetchTickets();
      setSelectedTicket(ticketData);
      setIsExpanded(true);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          message: newMessage.trim(),
          is_admin: false,
          company_id: userCompanyId,
        });

      if (messageError) throw messageError;

      // Update ticket last_message_at
      await supabase
        .from('support_tickets')
        .update({ 
          last_message_at: new Date().toISOString(),
          status: 'open'
        })
        .eq('id', selectedTicket.id);

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-3 w-3" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="h-3 w-3" />;
    }
    return <File className="h-3 w-3" />;
  };

  const renderAttachments = (attachments: string[] | null, isAdmin: boolean) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {attachments.map((attachment, index) => {
          const [name, path] = attachment.split('|||');
          
          const handleDownload = async () => {
            const { data } = await supabase.storage
              .from('support-attachments')
              .createSignedUrl(path, 60 * 60); // 1 hour
            
            if (data?.signedUrl) {
              window.open(data.signedUrl, '_blank');
            }
          };

          return (
            <button
              key={index}
              onClick={handleDownload}
              className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded ${
                isAdmin 
                  ? 'bg-background/20 hover:bg-background/30' 
                  : 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
              } transition-colors`}
            >
              {getFileIcon(name)}
              <span className="truncate max-w-[100px]">{name}</span>
              <Download className="h-2.5 w-2.5" />
            </button>
          );
        })}
      </div>
    );
  };

  // Don't render for non-logged users or on admin routes
  if (!user || isAdminRoute) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isExpanded ? (
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg relative"
            onClick={() => setIsExpanded(true)}
          >
            <Headphones className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs flex items-center justify-center text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        ) : (
          <Card className="w-[380px] shadow-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Headphones className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Support</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {selectedTicket ? selectedTicket.subject : "How can we help?"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {selectedTicket && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setSelectedTicket(null)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {!selectedTicket ? (
                // Ticket list
                <div className="px-4 pb-4">
                  <Button 
                    className="w-full mb-3" 
                    onClick={() => setShowNewTicketModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Conversation
                  </Button>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No conversations yet.<br />
                      Start a new one!
                    </div>
                  ) : (
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-2">
                        {tickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{ticket.subject}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(ticket.last_message_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge 
                                variant={
                                  ticket.status === 'answered' ? 'default' :
                                  ticket.status === 'closed' ? 'secondary' : 'outline'
                                }
                                className="text-xs shrink-0"
                              >
                                {ticket.status === 'answered' ? 'Replied' : 
                                 ticket.status === 'closed' ? 'Closed' : 'Open'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              ) : (
                // Chat view
                <div className="flex flex-col h-[350px]">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-3 py-2">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                              msg.is_admin
                                ? 'bg-muted text-foreground rounded-bl-md'
                                : 'bg-primary text-primary-foreground rounded-br-md'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                            {renderAttachments(msg.attachments, msg.is_admin)}
                            <p className={`text-[10px] mt-1 ${
                              msg.is_admin ? 'text-muted-foreground' : 'text-primary-foreground/70'
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isSending}
                        className="flex-1"
                      />
                      <Button 
                        size="icon" 
                        onClick={handleSendMessage}
                        disabled={isSending || !newMessage.trim()}
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Ticket Modal */}
      <Dialog open={showNewTicketModal} onOpenChange={setShowNewTicketModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Support Request</DialogTitle>
            <DialogDescription>
              Describe your issue and our team will get back to you soon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={newTicketSubject}
                onChange={(e) => setNewTicketSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Please provide details about your question or issue..."
                value={newTicketMessage}
                onChange={(e) => setNewTicketMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTicketModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTicket} 
              disabled={isCreatingTicket || !newTicketSubject.trim() || !newTicketMessage.trim()}
            >
              {isCreatingTicket && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SupportChat;
