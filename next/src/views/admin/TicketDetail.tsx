import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Send, 
  Loader2,
  User,
  ExternalLink,
  Paperclip,
  X,
  FileText,
  Image,
  File,
  Download
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
  user_id: string;
  company_id: string | null;
}

interface Message {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
  attachments: string[] | null;
}

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface UploadedFile {
  name: string;
  url: string;
  path: string;
}

const TicketDetail = () => {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clientProfile, setClientProfile] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (ticketId) {
      fetchTicketData();
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticket) {
      // Subscribe to new messages
      const channel = supabase
        .channel(`admin-ticket-${ticket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_id=eq.${ticket.id}`
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
  }, [ticket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTicketData = async () => {
    if (!ticketId) return;

    try {
      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData);

      // Fetch client profile
      const { data: profileData } = await supabase
        .from('profiles_secure')
        .select('id, email, first_name, last_name')
        .eq('id', ticketData.user_id)
        .single();

      setClientProfile(profileData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Mark client messages as read
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .eq('is_admin', false);

    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !ticket) return;

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(files)) {
        // Max 10MB per file
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${ticket.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('support-attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        // Get signed URL for the file
        const { data: signedUrlData } = await supabase.storage
          .from('support-attachments')
          .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

        if (signedUrlData) {
          newFiles.push({
            name: file.name,
            url: signedUrlData.signedUrl,
            path: filePath
          });
        }
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      if (newFiles.length > 0) {
        toast({
          title: "Files uploaded",
          description: `${newFiles.length} file(s) ready to send`,
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeUploadedFile = async (fileToRemove: UploadedFile) => {
    try {
      await supabase.storage
        .from('support-attachments')
        .remove([fileToRemove.path]);

      setUploadedFiles(prev => prev.filter(f => f.path !== fileToRemove.path));
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !ticket || (!newMessage.trim() && uploadedFiles.length === 0)) return;

    setIsSending(true);
    try {
      const attachmentUrls = uploadedFiles.map(f => `${f.name}|||${f.path}`);

      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          message: newMessage.trim() || (uploadedFiles.length > 0 ? '📎 Attachment(s) sent' : ''),
          is_admin: true,
          attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
          company_id: ticket.company_id,
        });

      if (messageError) throw messageError;

      // Update ticket status and last_message_at
      await supabase
        .from('support_tickets')
        .update({ 
          last_message_at: new Date().toISOString(),
          status: 'answered'
        })
        .eq('id', ticket.id);

      setNewMessage("");
      setUploadedFiles([]);
      
      toast({
        title: "Message Sent",
        description: "Your reply has been sent to the client.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    try {
      await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      setTicket({ ...ticket, status: newStatus });

      // Log the status change
      if (user) {
        try {
          await supabase.rpc('insert_activity_log', {
            p_user_id: user.id,
            p_title: `Ticket status changed to ${newStatus}`,
            p_type: 'client_update',
            p_description: `Updated ticket "${ticket.subject}" status`,
            p_metadata: JSON.parse(JSON.stringify({ ticket_id: ticket.id, new_status: newStatus })),
          });
        } catch (err) { console.error('Log error:', err); }
      }
      
      toast({
        title: "Status Updated",
        description: `Ticket marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
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
              className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                isAdmin 
                  ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30' 
                  : 'bg-background/20 hover:bg-background/30'
              } transition-colors`}
            >
              {getFileIcon(name)}
              <span className="truncate max-w-[150px]">{name}</span>
              <Download className="h-3 w-3" />
            </button>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ticket not found</p>
          <Button asChild className="mt-4">
            <Link to="/admin/support">Back to Tickets</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/support">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{ticket.subject}</h1>
              <p className="text-sm text-muted-foreground">
                Ticket #{ticket.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <Select value={ticket.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="answered">Answered</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Messages */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Conversation</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          msg.is_admin
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        <p className="text-xs font-medium mb-1">
                          {msg.is_admin ? 'You (Admin)' : clientProfile?.first_name || 'Client'}
                        </p>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        {renderAttachments(msg.attachments, msg.is_admin)}
                        <p className={`text-xs mt-2 ${
                          msg.is_admin ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                {/* Uploaded files preview */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm"
                      >
                        {getFileIcon(file.name)}
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <button
                          onClick={() => removeUploadedFile(file)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your reply... (Ctrl+Enter to send)"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    rows={3}
                    disabled={isSending || ticket.status === 'closed'}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || ticket.status === 'closed'}
                      >
                        {isUploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Paperclip className="mr-2 h-4 w-4" />
                        )}
                        Attach Files
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Max 10MB per file
                      </span>
                    </div>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={isSending || (!newMessage.trim() && uploadedFiles.length === 0) || ticket.status === 'closed'}
                    >
                      {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Client Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {clientProfile?.first_name || ''} {clientProfile?.last_name || ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {clientProfile?.email || 'Unknown'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/admin/clients/${ticket.user_id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Client Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge 
                    variant={
                      ticket.status === 'answered' ? 'default' :
                      ticket.status === 'closed' ? 'secondary' : 'outline'
                    }
                  >
                    {ticket.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Activity</span>
                  <span className="text-sm">
                    {new Date(ticket.last_message_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Messages</span>
                  <span className="text-sm font-medium">{messages.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TicketDetail;
