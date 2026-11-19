import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  Search, 
  Filter,
  Loader2,
  ArrowUpDown,
  Clock,
  User,
  Mail
} from "lucide-react";

interface TicketWithProfile {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
  user_id: string;
  profile: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    agent_id: string | null;
  } | null;
  needs_reply: boolean;
  agent_name: string | null;
}

const SupportTickets = () => {
  const { t } = useTranslation('admin');
  const [tickets, setTickets] = useState<TicketWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "unanswered">("recent");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      // Fetch all tickets with profile info
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set((ticketsData || []).map(t => t.user_id))];
      
      const { data: profilesData } = await supabase
        .from('profiles_secure')
        .select('id, email, first_name, last_name, agent_id')
        .in('id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );

      // Fetch agent profiles for agent names
      const agentIds = [...new Set(
        (profilesData || []).map(p => p.agent_id).filter(Boolean)
      )] as string[];

      const agentsMap = new Map<string, string>();
      if (agentIds.length > 0) {
        const { data: agentsData } = await supabase
          .from('profiles_secure')
          .select('id, first_name, last_name, email')
          .in('id', agentIds);
        
        (agentsData || []).forEach(a => {
          const name = [a.first_name, a.last_name].filter(Boolean).join(' ') || a.email;
          agentsMap.set(a.id, name);
        });
      }

      // For each ticket, check if the last message is from a client (needs reply)
      const ticketsWithProfiles: TicketWithProfile[] = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { data: lastMsg } = await supabase
            .from('support_messages')
            .select('is_admin')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMessageIsClient = lastMsg && lastMsg.length > 0 && !lastMsg[0].is_admin;
          const profile = profilesMap.get(ticket.user_id) || null;
          const agentName = profile?.agent_id ? agentsMap.get(profile.agent_id) || null : null;

          return {
            ...ticket,
            profile,
            needs_reply: !!lastMessageIsClient && ticket.status !== 'closed',
            agent_name: agentName,
          };
        })
      );

      setTickets(ticketsWithProfiles);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredTickets = () => {
    let filtered = [...tickets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.subject.toLowerCase().includes(query) ||
        t.profile?.email.toLowerCase().includes(query) ||
        t.profile?.first_name?.toLowerCase().includes(query) ||
        t.profile?.last_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Agent filter
    if (agentFilter !== "all") {
      if (agentFilter === "unassigned") {
        filtered = filtered.filter(t => !t.agent_name);
      } else {
        filtered = filtered.filter(t => t.agent_name === agentFilter);
      }
    }

    // Sort
    if (sortBy === "unanswered") {
      filtered = filtered.sort((a, b) => (b.needs_reply ? 1 : 0) - (a.needs_reply ? 1 : 0));
    } else {
      filtered = filtered.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    }

    return filtered;
  };

  const getStatusBadge = (status: string, needsReply: boolean) => {
    if (needsReply) {
      return <Badge variant="destructive">Needs Reply</Badge>;
    }
    switch (status) {
      case 'open':
        return <Badge variant="outline">Open</Badge>;
      case 'answered':
        return <Badge variant="default">Answered</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTickets = getFilteredTickets();
  const uniqueAgents = [...new Set(tickets.map(t => t.agent_name).filter(Boolean))] as string[];
  const stats = {
    total: tickets.length,
    needsReply: tickets.filter(t => t.needs_reply).length,
    open: tickets.filter(t => t.status === 'open').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage all customer support requests</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                  <Clock className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.needsReply}</p>
                  <p className="text-sm text-muted-foreground">Needs Reply</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                  <Mail className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.open}</p>
                  <p className="text-sm text-muted-foreground">Open</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <Mail className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.closed}</p>
                  <p className="text-sm text-muted-foreground">Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by client or subject..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="w-44">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {uniqueAgents.map(agent => (
                      <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v: "recent" | "unanswered") => setSortBy(v)}>
                  <SelectTrigger className="w-40">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="unanswered">Unanswered First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
            <CardDescription>Click on a ticket to view and respond</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No tickets found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Assigned Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow 
                      key={ticket.id}
                      className={ticket.needs_reply ? 'bg-destructive/5' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {ticket.profile?.first_name || ''} {ticket.profile?.last_name || ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.profile?.email || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        {ticket.agent_name ? (
                          <Badge variant="outline" className="font-normal">
                            {ticket.agent_name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.status, ticket.needs_reply)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(ticket.last_message_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm">
                          <Link to={`/admin/support/${ticket.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SupportTickets;
