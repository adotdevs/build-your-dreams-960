import { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import SimpleHeader from "@/components/SimpleHeader";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email address...");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification link is missing a token.");
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const json = await supabase.auth.verifyEmail(token);
        if (cancelled) return;

        if (json.error || !json.data?.verified) {
          setStatus("error");
          setMessage(json.error?.message || "Invalid or expired verification link.");
          return;
        }

        setStatus("success");
        setMessage("Your email address has been verified. Your account is now active.");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Unable to verify your email right now. Please try again.");
        }
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      const json = await res.json();
      if (json.error) {
        toast({ title: "Error", description: json.error.message, variant: "destructive" });
      } else {
        toast({
          title: "Verification email sent",
          description: "If an unverified account exists for that email, a new link has been sent.",
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to resend verification email", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <SimpleHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto">
              <Logo size="lg" />
            </div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {status === "verifying" && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
              {status === "success" && <CheckCircle2 className="h-6 w-6 text-green-600" />}
              {status === "error" && <XCircle className="h-6 w-6 text-destructive" />}
            </div>
            <CardTitle>
              {status === "verifying" && "Verifying Email"}
              {status === "success" && "Email Verified"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === "success" && (
              <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={() => navigate("/fiscal-profile", { replace: true })}>
                  Continue to Account Setup
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard", { replace: true })}>
                  Go to Dashboard
                </Button>
              </div>
            )}

            {status === "error" && (
              <form onSubmit={handleResend} className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="resend-email">Request a new verification link</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                    disabled={resending}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={resending}>
                  {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Resend Verification Email
                </Button>
                <div className="text-center pt-1">
                  <Link to="/login" className="text-sm text-primary hover:underline">
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
