import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  User, Lock, Shield, Bell, Globe, Loader2, Save, Eye, EyeOff, Building2, Database
} from "lucide-react";
import PlatformLayout from "./PlatformLayout";

const PlatformSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    autoApproveKyc: false,
    maintenanceMode: false,
    defaultCurrency: "EUR",
    maxAgentsPerCompany: "10",
    sessionTimeout: "60",
  });

  const [platformInfo, setPlatformInfo] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    dbSize: "—",
  });
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
    }

    const saved = localStorage.getItem("platform_prefs");
    if (saved) {
      try {
        setPrefs(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch {}
    }

    fetchPlatformInfo();
  }, [user]);

  const fetchPlatformInfo = async () => {
    setLoadingInfo(true);
    const [companiesRes, usersRes] = await Promise.all([
      supabase.from("companies").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    setPlatformInfo({
      totalCompanies: companiesRes.count || 0,
      totalUsers: usersRes.count || 0,
      dbSize: "Cloud Infrastructure",
    });
    setLoadingInfo(false);
  };

  const savePrefs = (newPrefs: typeof prefs) => {
    setPrefs(newPrefs);
    localStorage.setItem("platform_prefs", JSON.stringify(newPrefs));
    toast({ title: "Preferences saved" });
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 1) {
      toast({ title: "Error", description: "Password is required", variant: "destructive" });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <PlatformLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Platform and account configuration</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account" className="gap-2"><User className="h-4 w-4" /> Account</TabsTrigger>
            <TabsTrigger value="platform" className="gap-2"><Globe className="h-4 w-4" /> Platform</TabsTrigger>
            <TabsTrigger value="info" className="gap-2"><Database className="h-4 w-4" /> Info</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
                <CardDescription>Platform Owner account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div>
                    <Badge className="bg-primary">Platform Owner</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Security</CardTitle>
                <CardDescription>Change your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                <Button onClick={handlePasswordChange} disabled={savingPassword}>
                  {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Tab */}
          <TabsContent value="platform" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Global Preferences</CardTitle>
                <CardDescription>These settings apply to the entire platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Input
                      value={prefs.defaultCurrency}
                      onChange={(e) => setPrefs({ ...prefs, defaultCurrency: e.target.value.toUpperCase() })}
                      placeholder="EUR"
                      maxLength={3}
                      className="font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Agents per Company</Label>
                    <Input
                      type="number"
                      value={prefs.maxAgentsPerCompany}
                      onChange={(e) => setPrefs({ ...prefs, maxAgentsPerCompany: e.target.value })}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Session Timeout (min)</Label>
                    <Input
                      type="number"
                      value={prefs.sessionTimeout}
                      onChange={(e) => setPrefs({ ...prefs, sessionTimeout: e.target.value })}
                      min={5}
                      max={1440}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive alerts for important events</p>
                    </div>
                    <Switch
                      checked={prefs.emailNotifications}
                      onCheckedChange={(v) => setPrefs({ ...prefs, emailNotifications: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-approve KYC</p>
                      <p className="text-sm text-muted-foreground">Automatically approve KYC verifications</p>
                    </div>
                    <Switch
                      checked={prefs.autoApproveKyc}
                      onCheckedChange={(v) => setPrefs({ ...prefs, autoApproveKyc: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        Maintenance Mode
                        {prefs.maintenanceMode && <Badge variant="destructive" className="text-xs">Active</Badge>}
                      </p>
                      <p className="text-sm text-muted-foreground">Block public access to the platform</p>
                    </div>
                    <Switch
                      checked={prefs.maintenanceMode}
                      onCheckedChange={(v) => setPrefs({ ...prefs, maintenanceMode: v })}
                    />
                  </div>
                </div>

                <Button onClick={() => savePrefs(prefs)} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" /> Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Platform Information</CardTitle>
                <CardDescription>Current system status</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInfo ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4 text-center">
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{platformInfo.totalCompanies}</p>
                      <p className="text-sm text-muted-foreground">Companies</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <User className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{platformInfo.totalUsers}</p>
                      <p className="text-sm text-muted-foreground">Users</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">{platformInfo.dbSize}</p>
                      <p className="text-sm text-muted-foreground">Backend</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Version</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Application</span>
                  <Badge variant="outline">v1.0.0</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Framework</span>
                  <span>React 18 + Vite</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Backend</span>
                  <span>Cloud Infrastructure</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PlatformLayout>
  );
};

export default PlatformSettings;
