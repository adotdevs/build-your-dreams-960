import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'client' | 'admin' | 'super_admin' | 'platform_owner' | 'company_admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPlatformOwner: boolean;
  isCompanyAdmin: boolean;
  userRole: UserRole | null;
  companyId: string | null;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'platform_owner' || userRole === 'company_admin';
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'platform_owner';
  const isPlatformOwner = userRole === 'platform_owner';
  const isCompanyAdmin = userRole === 'company_admin';

  useEffect(() => {
    let isMounted = true;

    const initSession = async (session: Session | null) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await Promise.all([
          checkUserRole(session.user.id),
          fetchCompanyId(session.user.id),
        ]);
      } else {
        setUserRole(null);
        setCompanyId(null);
      }
      if (isMounted) setIsLoading(false);
    };

    // Set up listener first (synchronous callback, delegates to async helper)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        initSession(session);
      }
    );

    // Then fetch current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      initSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setUserRole(data.role as UserRole);
      } else {
        setUserRole('client');
      }
    } catch {
      setUserRole('client');
    }
  };

  const fetchCompanyId = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .maybeSingle();

      if (data?.company_id) {
        setCompanyId(data.company_id);
      }
    } catch {
      // ignore
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });

    if (error) return { error: error as Error };

    // If sign-up did not return an active session, sign the user in right away
    // so the onboarding flow (fiscal profile, KYC, wallet) stays authenticated.
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return { error: signInError as Error };
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setCompanyId(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, isSuperAdmin, isPlatformOwner, isCompanyAdmin, userRole, companyId, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
