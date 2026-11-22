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
  User, Lock, Shield, Globe, Loader2, Save, Eye, EyeOff, Building2, Database, Mail, Send, CheckCircle2, AlertTriangle
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

  // Email & SMTP settings (persisted in MongoDB for platform owner)
  const [loadingEmailSettings, setLoadingEmailSettings] = useState(true);
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [smtp, setSmtp] = useState({
    host: "",
    port: "587",
    secure: false,
    user: "",
    pass: "",
    hasPass: false,
    fromName: "Cryptogen",
    fromEmail: "",
    appUrl: "",
  });

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setTestRecipient((prev) => prev || user.email || "");
    }

    const saved = localStorage.getItem("platform_prefs");
    if (saved) {
      try {
        setPrefs(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch {}
    }

    fetchPlatformInfo();
    fetchEmailSettings();
  }, [user]);

  const fetchEmailSettings = async () => {
    setLoadingEmailSettings(true);
    try {
      const res = await fetch("/api/platform/settings", { credentials: "include" });
      const json = await res.json();
      if (!json.error && json.data) {
        setEmailVerificationRequired(Boolean(json.data.emailVerificationRequired));
        const s = json.data.smtp || {};
        setSmtp({
          host: s.host || "",
          port: String(s.port || 587),
          secure: Boolean(s.secure),
          user: s.user || "",
          pass: "",
          hasPass: Boolean(s.hasPass),
          fromName: s.fromName || "Cryptogen",
          fromEmail: s.fromEmail || "",
          appUrl: s.appUrl || "",
        });
      }
    } catch {
      // ignore initial load error
    } finally {
      setLoadingEmailSettings(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    const portNum = Number(smtp.port);
    if (smtp.host.trim() && (!Number.isFinite(portNum) || portNum <= 0)) {
      toast({ title: "Invalid port", description: "Please enter a valid SMTP port number.", variant: "destructive" });
      return;
    }
    if (emailVerificationRequired && (!smtp.host.trim() || !smtp.fromEmail.trim())) {
      toast({
        title: "SMTP required",
        description: "Please configure SMTP Host and From Email before enabling Email Link Verification.",
        variant: "destructive",
      });
      return;
    }

    setSavingEmailSettings(true);
    try {
      const res = await fetch("/api/platform/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          emailVerificationRequired,
          smtp: {
            host: smtp.host.trim(),
            port: Number.isFinite(portNum) && portNum > 0 ? portNum : 587,
            secure: smtp.secure,
            user: smtp.user.trim(),
            ...(smtp.pass ? { pass: smtp.pass } : {}),
            fromName: smtp.fromName.trim() || "Cryptogen",
            fromEmail: smtp.fromEmail.trim(),
            appUrl: smtp.appUrl.trim(),
          },
        }),
      });
      const json = await res.json();
      if (json.error) {
        toast({ title: "Error", description: json.error.message, variant: "destructive" });
      } else {
        setSmtp((prev) => ({
          ...prev,
          pass: "",
          hasPass: Boolean(json.data?.smtp?.hasPass),
        }));
        toast({ title: "Email & SMTP settings saved" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save email settings", variant: "destructive" });
    } finally {
      setSavingEmailSettings(false);
    }
  };

  const handleTestSmtp = async () => {
    const to = testRecipient.trim() || email;
    if (!to) {
      toast({ title: "Recipient required", description: "Enter an email address to send a test email.", variant: "destructive" });
      return;
    }
    setTestingSmtp(true);
    try {
      const portNum = Number(smtp.port);
      const res = await fetch("/api/platform/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "test_smtp",
          to,
          smtp: {
            host: smtp.host.trim(),
            port: Number.isFinite(portNum) && portNum > 0 ? portNum : 587,
            secure: smtp.secure,
            user: smtp.user.trim(),
            ...(smtp.pass ? { pass: smtp.pass } : {}),
            fromName: smtp.fromName.trim() || "Cryptogen",
            fromEmail: smtp.fromEmail.trim(),
          },
        }),
      });
      const json = await res.json();
      if (json.error) {
        toast({ title: "SMTP Test Failed", description: json.error.message, variant: "destructive" });
      } else {
        toast({ title: "Test email sent", description: `Successfully sent a test email to ${to}.` });
      }
    } catch {
      toast({ title: "SMTP Test Failed", description: "Unable to send test email", variant: "destructive" });
    } finally {
      setTestingSmtp(false);
    }
  };

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
            <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Email &amp; SMTP</TabsTrigger>
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

          {/* Email & SMTP Tab */}
          <TabsContent value="email" className="space-y-6">
            {loadingEmailSettings ? (
              <Card>
                <CardContent className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" /> Email Link Verification
                    </CardTitle>
                    <CardDescription>
                      Require users to verify their email address via a confirmation link before signing in
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          Require Email Link Verification
                          {emailVerificationRequired && (
                            <Badge variant="default" className="text-xs">Enabled</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          When enabled, newly registered and unverified users must click the verification link sent to their email before they can log in.
                        </p>
                      </div>
                      <Switch
                        checked={emailVerificationRequired}
                        onCheckedChange={setEmailVerificationRequired}
                      />
                    </div>

                    {emailVerificationRequired && (!smtp.host.trim() || !smtp.fromEmail.trim()) && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">
                          Configure your SMTP Host and From Email below so verification emails can be delivered.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" /> SMTP Configuration
                    </CardTitle>
                    <CardDescription>
                      Outgoing mail server used for email verification links and password resets
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host">SMTP Host</Label>
                        <Input
                          id="smtp-host"
                          value={smtp.host}
                          onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          value={smtp.port}
                          onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                          placeholder="587"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-user">SMTP Username</Label>
                        <Input
                          id="smtp-user"
                          value={smtp.user}
                          onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                          placeholder="your-user@domain.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-pass">
                          SMTP Password {smtp.hasPass && <span className="text-xs text-muted-foreground font-normal">(saved)</span>}
                        </Label>
                        <div className="relative">
                          <Input
                            id="smtp-pass"
                            type={showSmtpPass ? "text" : "password"}
                            value={smtp.pass}
                            onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                            placeholder={smtp.hasPass ? "Leave blank to keep current password" : "••••••••"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSmtpPass(!showSmtpPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showSmtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-from-name">From Name</Label>
                        <Input
                          id="smtp-from-name"
                          value={smtp.fromName}
                          onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
                          placeholder="Cryptogen"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-from-email">From Email</Label>
                        <Input
                          id="smtp-from-email"
                          type="email"
                          value={smtp.fromEmail}
                          onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })}
                          placeholder="no-reply@cryptogen.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtp-app-url">Application Base URL (optional)</Label>
                      <Input
                        id="smtp-app-url"
                        value={smtp.appUrl}
                        onChange={(e) => setSmtp({ ...smtp, appUrl: e.target.value })}
                        placeholder="https://app.cryptogen.com (defaults to current site URL)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used to build verification and password reset links sent in emails.
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Use SSL / TLS (Secure)</p>
                        <p className="text-xs text-muted-foreground">
                          Enable for port 465; leave off for STARTTLS on port 587.
                        </p>
                      </div>
                      <Switch
                        checked={smtp.secure}
                        onCheckedChange={(v) => setSmtp({ ...smtp, secure: v })}
                      />
                    </div>

                    <Button onClick={handleSaveEmailSettings} disabled={savingEmailSettings}>
                      {savingEmailSettings ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Email &amp; SMTP Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" /> Test SMTP Connection
                    </CardTitle>
                    <CardDescription>
                      Send a test email to verify your SMTP server credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      placeholder="recipient@example.com"
                      className="sm:max-w-sm"
                    />
                    <Button variant="outline" onClick={handleTestSmtp} disabled={testingSmtp}>
                      {testingSmtp ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send Test Email
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
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
