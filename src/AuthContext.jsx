import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession ?? null);
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error("NovaCart could not restore the auth session.", error);
        setSession(data?.session ?? null);
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        console.error("NovaCart could not restore the auth session.", error);
        setSession(null);
        setLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!userId) {
      setRole(null);
      setRoleLoading(false);
      return () => {
        active = false;
      };
    }

    setRoleLoading(true);

    // The client can only read the signed-in user's role because of RLS.
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("NovaCart could not load the account role. Run the supplied SQL migration.", error);
          setRole(null);
        } else {
          setRole(data?.role ?? "customer");
        }
        setRoleLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        console.error("NovaCart could not load the account role.", error);
        setRole(null);
        setRoleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      role,
      roleLoading,
      signOut,
    }),
    [session, loading, role, roleLoading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
