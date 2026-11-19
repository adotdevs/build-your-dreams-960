import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Lock, User, Shield, Smartphone, Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { t } = useTranslation(['actions', 'common']);
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [smsAuthEnabled, setSmsAuthEnabled] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (user) { fetchProfile(); const prefs = localStorage.getItem(`notif_prefs_${user.id}`); if (prefs) { const p = JSON.parse(prefs); setEmailNotifs(p.email ?? true); setPriceAlerts(p.priceAlerts ?? true); setMarketing(p.marketing ?? false); } }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try { const { data, error } = await supabase.from("profiles").select("first_name, last_name, email, phone").eq("id", user.id).maybeSingle(); if (error) throw error; if (data) { setFirstName(data.first_name || ""); setLastName(data.last_name || ""); setEmail(data.email || ""); setPhone(data.phone || ""); } } catch (err) { console.error(err); } finally { setProfileLoading(false); }
  };

  const handleSaveProfile = async () => {
    if (!user) return; setProfileSaving(true);
    try { const { error } = await supabase.from("profiles").update({ first_name: firstName, last_name: lastName, phone }).eq("id", user.id); if (error) throw error; toast.success(t('actions:settings.toast.profileUpdated')); } catch (err: any) { toast.error(err.message || t('actions:settings.toast.updateError')); } finally { setProfileSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) { toast.error(t('actions:settings.toast.fillAllFields')); return; }
    if (newPassword.length < 1) { toast.error(t('actions:settings.toast.passwordMinLength')); return; }
    if (newPassword !== confirmPassword) { toast.error(t('actions:settings.toast.passwordMismatch')); return; }
    setPasswordSaving(true);
    try { const { error } = await supabase.auth.updateUser({ password: newPassword }); if (error) throw error; toast.success(t('actions:settings.toast.passwordChanged')); setNewPassword(""); setConfirmPassword(""); } catch (err: any) { toast.error(err.message || t('actions:settings.toast.passwordError')); } finally { setPasswordSaving(false); }
  };

  const handleToggle2FA = (checked: boolean) => { setTwoFactorEnabled(checked); toast.info(checked ? t('actions:settings.toast.twoFactorEnabled') : t('actions:settings.toast.twoFactorDisabled')); };
  const handleToggleSmsAuth = (checked: boolean) => { setSmsAuthEnabled(checked); toast.info(checked ? t('actions:settings.toast.smsEnabled') : t('actions:settings.toast.smsDisabled')); };

  const saveNotifPrefs = (key: string, value: boolean) => {
    if (!user) return; const current = { email: emailNotifs, priceAlerts, marketing }; const updated = { ...current, [key]: value }; localStorage.setItem(`notif_prefs_${user.id}`, JSON.stringify(updated));
    if (key === 'email') setEmailNotifs(value); if (key === 'priceAlerts') setPriceAlerts(value); if (key === 'marketing') setMarketing(value); toast.success(t('actions:settings.toast.notifUpdated'));
  };

  if (profileLoading) { return <div className="flex min-h-screen bg-background"><Sidebar /><div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>; }

  return (
    <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <MobileNav />
        <main className="p-3 sm:p-4 lg:p-8 max-w-full overflow-hidden">
          <div className="mb-4 sm:mb-8">
            <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">{t('common:nav.settings')}</h1>
            <p className="text-muted-foreground">{t('actions:settings.title')}</p>
          </div>
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />{t('actions:settings.profile.title')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="firstName">{t('actions:settings.profile.firstName')}</Label><Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="lastName">{t('actions:settings.profile.lastName')}</Label><Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="email">{t('actions:settings.profile.email')}</Label><Input id="email" type="email" value={email} disabled className="opacity-60" /><p className="text-xs text-muted-foreground">{t('actions:settings.profile.emailHint')}</p></div>
                <div className="space-y-2"><Label htmlFor="phone">{t('actions:settings.profile.phone')}</Label><Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <Button onClick={handleSaveProfile} disabled={profileSaving}>{profileSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}{t('actions:settings.profile.save')}</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />{t('actions:settings.security.title')}</CardTitle><CardDescription>{t('actions:settings.security.description')}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="newPassword">{t('actions:settings.security.newPassword')}</Label><Input id="newPassword" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="confirmPassword">{t('actions:settings.security.confirmPassword')}</Label><Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                <Button onClick={handleChangePassword} disabled={passwordSaving}>{passwordSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}{t('actions:settings.security.changePassword')}</Button>
                <Separator className="my-4" />
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-muted-foreground" /><div><div className="font-medium">{t('actions:settings.security.twoFactor')}</div><div className="text-sm text-muted-foreground">{t('actions:settings.security.twoFactorDesc')}</div></div></div><Switch checked={twoFactorEnabled} onCheckedChange={handleToggle2FA} /></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Smartphone className="h-5 w-5 text-muted-foreground" /><div><div className="font-medium">{t('actions:settings.security.smsAuth')}</div><div className="text-sm text-muted-foreground">{t('actions:settings.security.smsAuthDesc')}</div></div></div><Switch checked={smsAuthEnabled} onCheckedChange={handleToggleSmsAuth} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />{t('actions:settings.notifications.title')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><div><div className="font-medium">{t('actions:settings.notifications.email')}</div><div className="text-sm text-muted-foreground">{t('actions:settings.notifications.emailDesc')}</div></div><Switch checked={emailNotifs} onCheckedChange={(v) => saveNotifPrefs('email', v)} /></div>
                <div className="flex items-center justify-between"><div><div className="font-medium">{t('actions:settings.notifications.priceAlerts')}</div><div className="text-sm text-muted-foreground">{t('actions:settings.notifications.priceAlertsDesc')}</div></div><Switch checked={priceAlerts} onCheckedChange={(v) => saveNotifPrefs('priceAlerts', v)} /></div>
                <div className="flex items-center justify-between"><div><div className="font-medium">{t('actions:settings.notifications.marketing')}</div><div className="text-sm text-muted-foreground">{t('actions:settings.notifications.marketingDesc')}</div></div><Switch checked={marketing} onCheckedChange={(v) => saveNotifPrefs('marketing', v)} /></div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
