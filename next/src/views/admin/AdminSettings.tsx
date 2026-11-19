import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "./AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@/lib/router-compat";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Key, Globe, Palette, Save, Lock } from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  crypto_id_code: string;
  default_currency: string;
  primary_color: string | null;
  logo_url: string | null;
  status: string;
}

const AdminSettings = () => {
  const { t } = useTranslation('admin');
  const { user, isCompanyAdmin, isSuperAdmin, companyId, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasAccess = isCompanyAdmin || isSuperAdmin;

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [name, setName] = useState("");
  const [cryptoIdCode, setCryptoIdCode] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [logoUrl, setLogoUrl] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!authLoading && !hasAccess) {
      navigate("/admin");
    }
  }, [authLoading, hasAccess, navigate]);

  useEffect(() => {
    if (companyId && hasAccess) {
      fetchCompany();
    }
  }, [companyId, hasAccess]);

  const fetchCompany = async () => {
    if (!companyId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("id, name, crypto_id_code, default_currency, primary_color, logo_url, status")
      .eq("id", companyId)
      .maybeSingle();

    if (data) {
      setCompany(data);
      setName(data.name);
      setCryptoIdCode(data.crypto_id_code);
      setDefaultCurrency(data.default_currency || "EUR");
      setPrimaryColor(data.primary_color || "#6366f1");
      setLogoUrl(data.logo_url || "");
    }
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!company) return;
    if (!name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    if (!cryptoIdCode.trim()) {
      toast({ title: "Error", description: "Crypto ID is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({
        name: name.trim(),
        crypto_id_code: cryptoIdCode.toUpperCase().trim(),
        default_currency: defaultCurrency,
        primary_color: primaryColor,
        logo_url: logoUrl.trim() || null,
      })
      .eq("id", company.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message.includes("unique") ? "This Crypto ID is already in use" : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Settings saved", description: "Changes have been applied." });
      fetchCompany();
    }
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast({ title: "Error", description: "Please enter a password", variant: "destructive" });
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

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsChangingPassword(false);
  };

  if (!hasAccess) return null;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your company settings and account.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Edit the name, Crypto ID and visual settings of your company.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Company"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nic" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Crypto Identification Number (CIN)
                  </Label>
                  <Input
                    id="nic"
                    value={cryptoIdCode}
                    onChange={(e) => setCryptoIdCode(e.target.value)}
                    placeholder="EX: ACME-2024-001"
                    className="font-mono uppercase tracking-wider"
                  />
                  <p className="text-xs text-muted-foreground">
                    This code is required for your clients to register.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Default Currency
                  </Label>
                  <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR — Euro</SelectItem>
                      <SelectItem value="USD">USD — Dollar</SelectItem>
                      <SelectItem value="GBP">GBP — British Pound</SelectItem>
                      <SelectItem value="CHF">CHF — Swiss Franc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent p-1"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#6366f1"
                      className="font-mono w-32"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Account Security
                </CardTitle>
                <CardDescription>
                  Change your admin account password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={isChangingPassword} variant="outline" className="w-full">
                  {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
