import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { replaceSupabaseAuthStorage, supabase } from '@/lib/supabase';
import { usernameToEmail } from '@/lib/users';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (
    usernameOrEmail: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const bindAuthListener = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    subscriptionRef.current = subscription;
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    bindAuthListener();

    return () => {
      mounted = false;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [bindAuthListener]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    async signIn(usernameOrEmail, password, rememberMe = true) {
      const raw = usernameOrEmail.trim();
      const email = raw.includes('@') ? raw : usernameToEmail(raw);
      replaceSupabaseAuthStorage(rememberMe);
      bindAuthListener();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password.trim(),
      });
      if (!error && data.session) setSession(data.session);
      return { error: error?.message ?? null };
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
