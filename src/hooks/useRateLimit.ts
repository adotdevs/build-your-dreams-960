import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RateLimitState {
  isLocked: boolean;
  remainingSeconds: number;
  remainingAttempts: number;
}

export const useRateLimit = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLocked: false,
    remainingSeconds: 0,
    remainingAttempts: 5,
  });

  const checkRateLimit = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("check_rate_limit", {
        p_email: email,
      });

      if (error) {
        console.error("Rate limit check error:", error);
        return true; // Allow on error to not block legitimate users
      }

      const result = data as { allowed: boolean; remaining_seconds?: number; remaining_attempts?: number };

      if (!result.allowed) {
        setRateLimitState({
          isLocked: true,
          remainingSeconds: result.remaining_seconds ?? 0,
          remainingAttempts: 0,
        });

        // Start countdown
        const interval = setInterval(() => {
          setRateLimitState((prev) => {
            const newSeconds = prev.remainingSeconds - 1;
            if (newSeconds <= 0) {
              clearInterval(interval);
              return { isLocked: false, remainingSeconds: 0, remainingAttempts: 5 };
            }
            return { ...prev, remainingSeconds: newSeconds };
          });
        }, 1000);

        return false;
      }

      setRateLimitState({
        isLocked: false,
        remainingSeconds: 0,
        remainingAttempts: result.remaining_attempts ?? 5,
      });
      return true;
    } catch {
      return true;
    }
  }, []);

  const recordAttempt = useCallback(async (email: string, success: boolean) => {
    try {
      await supabase.rpc("record_login_attempt", {
        p_email: email,
        p_success: success,
      });
    } catch (err) {
      console.error("Failed to record login attempt:", err);
    }
  }, []);

  return { rateLimitState, checkRateLimit, recordAttempt };
};
