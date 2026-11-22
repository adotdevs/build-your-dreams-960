import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const resolveEmail = (input: string): string => {
    if (input.includes('@')) return input;
    return `${input.toLowerCase().replace(/[^a-z0-9_-]/g, '')}@cryptogen.internal`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const email = resolveEmail(username);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        setError("Invalid credentials");
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Authentication failed");
        setIsLoading(false);
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .in('role', ['super_admin', 'company_admin', 'platform_owner'])
        .maybeSingle();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        setError("Access denied. This portal is reserved for company owners and platform administrators. Agents should use the standard login page.");
        setIsLoading(false);
        return;
      }

      toast({
        title: "Welcome",
        description: "Login successful",
      });

      if (roleData.role === 'platform_owner') {
        navigate("/platform");
      } else {
        navigate("/admin");
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-white">Admin Portal</CardTitle>
          <CardDescription className="text-slate-400">
            Secure access for administrators only
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus:border-primary"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute end-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Access Portal
                </>
              )}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Not an administrator?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Client area
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
