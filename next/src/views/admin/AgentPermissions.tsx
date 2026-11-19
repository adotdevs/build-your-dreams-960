import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAgentPermissions } from "@/hooks/useAgentPermissions";
import {
  PERMISSION_CATEGORIES,
  getAccessLevel,
  getAccessBadgeProps,
} from "@/data/agentPermissions";
import {
  ArrowLeft,
  Loader2,
  Save,
  Users,
  Wallet,
  FileText,
  MessageSquare,
  Shield,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Users,
  Wallet,
  FileText,
  MessageSquare,
};

const AgentPermissions = () => {
  const { agentId } = useParams();
  const { isSuperAdmin, isCompanyAdmin, isLoading: authLoading, user } = useAuth();
  const hasAccess = isSuperAdmin || isCompanyAdmin;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [agentProfile, setAgentProfile] = useState<{
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const {
    permissions,
    isLoading,
    isSaving,
    saveError,
    togglePermission,
    setAllPermissions,
    savePermissions,
  } = useAgentPermissions(agentId);

  useEffect(() => {
    if (!authLoading && !hasAccess) {
      navigate("/admin");
    }
  }, [authLoading, hasAccess, navigate]);

  useEffect(() => {
    if (agentId) {
      supabase
        .from("profiles")
        .select("email, first_name, last_name")
        .eq("id", agentId)
        .single()
        .then(({ data }) => {
          setAgentProfile(data);
          setProfileLoading(false);
        });
    }
  }, [agentId]);

  const handleSave = async () => {
    const success = await savePermissions();
    if (success && user && agentId) {
      // Log the permission change
      const changedPerms = Object.entries(permissions)
        .filter(([, v]) => v)
        .map(([k]) => k);

      await supabase.rpc("insert_activity_log", {
        p_user_id: user.id,
        p_title: "Agent permissions updated",
        p_type: "permission_change",
        p_description: `Updated permissions for agent ${agentProfile?.email || agentId}`,
        p_metadata: JSON.parse(
          JSON.stringify({
            agent_id: agentId,
            enabled_permissions: changedPerms,
            total_enabled: changedPerms.length,
          })
        ),
      });

      toast({
        title: "Permissions updated",
        description: "Agent permissions have been saved successfully.",
      });
    } else if (!success) {
      toast({
        title: "Error",
        description: saveError || "Failed to save permissions.",
        variant: "destructive",
      });
    }
  };

  const accessLevel = getAccessLevel(permissions);
  const badgeProps = getAccessBadgeProps(accessLevel);

  if (!hasAccess) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/agents">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Agent Permissions</h1>
                <Badge variant={badgeProps.variant}>{badgeProps.label}</Badge>
              </div>
              {profileLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : agentProfile ? (
                <p className="text-muted-foreground">
                  {agentProfile.first_name} {agentProfile.last_name} —{" "}
                  {agentProfile.email}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAllPermissions(true)}
            >
              <ToggleRight className="mr-2 h-4 w-4" />
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAllPermissions(false)}
            >
              <ToggleLeft className="mr-2 h-4 w-4" />
              Disable All
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Permissions
                </>
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6">
            {PERMISSION_CATEGORIES.map((category) => {
              const Icon = iconMap[category.icon] || Shield;
              const enabledCount = category.permissions.filter(
                (p) => permissions[p.key]
              ).length;

              return (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {category.label}
                          </CardTitle>
                          <CardDescription>
                            {enabledCount} / {category.permissions.length}{" "}
                            enabled
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {enabledCount}/{category.permissions.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {category.permissions.map((perm, idx) => (
                        <div key={perm.key}>
                          <div className="flex items-center justify-between py-3">
                            <span className="text-sm">{perm.label}</span>
                            <Switch
                              checked={permissions[perm.key] ?? false}
                              onCheckedChange={() =>
                                togglePermission(perm.key)
                              }
                            />
                          </div>
                          {idx < category.permissions.length - 1 && (
                            <Separator />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AgentPermissions;
