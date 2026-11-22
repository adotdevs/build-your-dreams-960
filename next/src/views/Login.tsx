import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import SimpleHeader from "@/components/SimpleHeader";

const Login = () => {
  const { t } = useTranslation('auth');
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendingVerification(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const json = await res.json();
      if (json.error) {
        toast({ title: t('login.error'), description: json.error.message, variant: "destructive" });
      } else {
        toast({
          title: "Verification email sent",
          description: `A new verification link has been sent to ${unverifiedEmail}.`,
        });
      }
    } catch {
      toast({ title: t('login.error'), description: t('login.unexpectedError'), variant: "destructive" });
    } finally {
      setResendingVerification(false);
    }
  };

  const resolveEmail = (input: string): string => {
    if (input.includes('@')) return input;
    return `${input.toLowerCase().replace(/[^a-z0-9_-]/g, '')}@cryptogen.internal`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUnverifiedEmail(null);

    const email = resolveEmail(identifier);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (authData?.requiresEmailVerification) {
          setUnverifiedEmail(authData.email || email);
        }
        toast({
          title: t('login.error'),
          description: error.message || t('login.invalidCredentials'),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: t('login.success.title'),
        description: t('login.success.description'),
      });

      // Check role and redirect accordingly
      if (authData.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .maybeSingle();
        
        if (roleData?.role === 'platform_owner') {
          navigate("/platform");
        } else if (roleData?.role === 'company_admin' || roleData?.role === 'admin' || roleData?.role === 'super_admin') {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: t('login.error'),
        description: t('login.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <SimpleHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle>{t('login.title')}</CardTitle>
          <CardDescription>
            {t('login.subtitle')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {unverifiedEmail && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm space-y-2">
                <p className="font-medium text-foreground">Email verification required</p>
                <p className="text-muted-foreground">
                  Please click the verification link sent to <span className="font-medium">{unverifiedEmail}</span> before signing in.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                >
                  {resendingVerification ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-3.5 w-3.5" />
                  )}
                  Resend verification email
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="identifier">{t('login.email')}</Label>
              <Input
                id="identifier"
                type="text"
                placeholder={t('login.emailPlaceholder')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {t('login.identifierHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                {t('login.forgotPassword')}
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('login.loading')}
                </>
              ) : (
                t('login.submit')
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t('login.noAccount')}{" "}
              <Link to="/register" className="text-primary hover:underline">
                {t('login.register')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
};

export default Login;
