import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Loader2,
  FileText,
  UserCog,
  Shield,
  DollarSign,
  AlertTriangle,
  Filter,
} from "lucide-react";
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

interface ActivityLog {
  id: string;
  user_id: string;
  title: string;
  type: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_email?: string;
}

const typeConfig: Record<string, { label: string; icon: typeof FileText; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  login: { label: "Login", icon: Shield, variant: "secondary" },
  security: { label: "Security", icon: Shield, variant: "destructive" },
  transaction: { label: "Transaction", icon: DollarSign, variant: "default" },
  client_update: { label: "Client Update", icon: UserCog, variant: "outline" },
  action_update: { label: "Action Update", icon: AlertTriangle, variant: "outline" },
  kyc: { label: "KYC", icon: FileText, variant: "secondary" },
};

const AdminActivityLogs = () => {
  const { t } = useTranslation('admin');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // Fetch activity logs
      const { data: logsData, error: logsError } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      // Get unique user IDs to fetch emails
      const userIds = [...new Set((logsData || []).map((l) => l.user_id))];

      let emailMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);

        (profiles || []).forEach((p) => emailMap.set(p.id, p.email));
      }

      const enriched: ActivityLog[] = (logsData || []).map((log) => ({
        ...log,
        metadata: log.metadata as Record<string, unknown> | null,
        admin_email: emailMap.get(log.user_id) || log.user_id,
      }));

      setLogs(enriched);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueTypes = [...new Set(logs.map((l) => l.type))];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || log.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getTypeConfig = (type: string) => {
    return typeConfig[type] || { label: type, icon: FileText, variant: "outline" as const };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Activity Logs
          </h1>
          <p className="text-muted-foreground">
            Complete audit trail of all administrative actions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, description, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getTypeConfig(type).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline" className="px-4 py-2">
                {filteredLogs.length} entries
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No activity logs found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const config = getTypeConfig(log.type);
                    const Icon = config.icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.title}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-muted-foreground text-sm">
                          {log.description || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{log.admin_email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {log.ip_address || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminActivityLogs;
