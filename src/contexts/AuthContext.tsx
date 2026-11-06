/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/types";
import { 
  getAdminIdForCurrentUser, 
  setReferrerForUser,
  getReferrerForUser,
  syncCustomAccountsWithSupabase,
  syncUserReferralsWithSupabase,
  syncAdminWalletsWithSupabase
} from "@/lib/adminPermissions";

export const getFallbackUserProfile = (user: User | null): UserProfile => {
  const isGuest = !user;
  const email = user?.email || (isGuest ? null : 'user@example.com');
  const uname = email ? email.split('@')[0] : (isGuest ? 'Guest' : 'trader');
  const dname = user?.user_metadata?.display_name || user?.user_metadata?.username || (isGuest ? 'Guest Trader' : (email ? email.split('@')[0] : 'Trader'));
  const randomFtid = 'FID-' + (user?.id ? user.id.replace(/-/g, '').substring(0, 8).toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase());

  return {
    id: user?.id || 'guest',
    username: uname,
    display_name: dname,
    avatar_url: null,
    email: email,
    ftid: randomFtid,
    balance: isGuest ? 0 : 10000,
    futures_balance: isGuest ? 0 : 5000,
    staked_balance: isGuest ? 0 : 1000,
    kyc_status: 'UNVERIFIED',
    withdrawal_address: null,
    force_win: false,
    force_loss: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateProfileLocally: (updates: Partial<UserProfile>) => void;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => null,
  updateProfileLocally: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUser = session?.user ?? null;

  const clearSupabaseLocalStorage = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('-auth-token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
    }
  };

  const refreshProfile = useCallback(async (targetUser?: User | null): Promise<UserProfile | null> => {
    const u = targetUser !== undefined ? targetUser : currentUser;
    if (!u) {
      setProfile(null);
      return null;
    }

    // Try reading cached profile first for speed
    const cached = localStorage.getItem(`crypx_user_profile_${u.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setProfile(parsed);
      } catch (e) {
        console.warn("Error parsing cached profile", e);
      }
    }

    const fallback = getFallbackUserProfile(u);

    // Validate UUID format before querying Supabase
    const isValidUUID = (idStr: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
    if (!isValidUUID(u.id)) {
      setProfile(fallback);
      localStorage.setItem(`crypx_user_profile_${u.id}`, JSON.stringify(fallback));
      return fallback;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (error) {
        console.warn("Error fetching user profile from Supabase:", error);
        setProfile(prev => prev || fallback);
        return fallback;
      }

      if (data) {
        const fullProfile = data as UserProfile;
        setProfile(fullProfile);
        localStorage.setItem(`crypx_user_profile_${u.id}`, JSON.stringify(fullProfile));
        return fullProfile;
      } else {
        // Auto-create missing profile
        const { data: insertedData, error: insertErr } = await supabase
          .from('profiles')
          .insert(fallback)
          .select()
          .maybeSingle();

        const resProfile = (!insertErr && insertedData) ? (insertedData as UserProfile) : fallback;
        setProfile(resProfile);
        localStorage.setItem(`crypx_user_profile_${u.id}`, JSON.stringify(resProfile));
        return resProfile;
      }
    } catch (err) {
      console.warn("Exception in refreshProfile:", err);
      setProfile(prev => prev || fallback);
      return fallback;
    }
  }, [currentUser]);

  const updateProfileLocally = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates, updated_at: new Date().toISOString() };
      if (currentUser?.id) {
        localStorage.setItem(`crypx_user_profile_${currentUser.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUser]);

  useEffect(() => {
    // Safety timeout to prevent loading state from freezing indefinitely
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // 1. Check custom session first
    const customSessionStr = localStorage.getItem("crypx_custom_session_v1");
    if (customSessionStr) {
      try {
        const customSession = JSON.parse(customSessionStr);
        setSession(customSession);
        refreshProfile(customSession.user);
        setLoading(false);
        clearTimeout(timer);
      } catch (e) {
        localStorage.removeItem("crypx_custom_session_v1");
      }
    } else {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error("Auth error:", error);
          if (error.message && (error.message.toLowerCase().includes('refresh token') || error.message.toLowerCase().includes('not found'))) {
            clearSupabaseLocalStorage();
            supabase.auth.signOut().catch(() => {});
          }
        }
        setSession(session);
        if (session?.user) {
          refreshProfile(session.user);
        }
        setLoading(false);
        clearTimeout(timer);
      }).catch((err) => {
        console.error("Session fetch error:", err);
        if (err.message && (err.message.toLowerCase().includes('refresh token') || err.message.toLowerCase().includes('not found'))) {
          clearSupabaseLocalStorage();
          supabase.auth.signOut().catch(() => {});
        }
        setLoading(false);
        clearTimeout(timer);
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, supabaseSession) => {
        // If there's an active custom session, don't let Supabase override it with null
        const activeCustomStr = localStorage.getItem("crypx_custom_session_v1");
        if (activeCustomStr) {
          try {
            const customSession = JSON.parse(activeCustomStr);
            setSession(customSession);
            refreshProfile(customSession.user);
          } catch {
            setSession(supabaseSession);
            refreshProfile(supabaseSession?.user ?? null);
          }
        } else {
          setSession(supabaseSession);
          refreshProfile(supabaseSession?.user ?? null);
        }
        setLoading(false);
      }
    );

    // React if custom session is logged out or updated from another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "crypx_custom_session_v1") {
        if (!e.newValue) {
          setSession(null);
          setProfile(null);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            setSession(parsed);
            refreshProfile(parsed.user);
          } catch {
            setSession(null);
            setProfile(null);
          }
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Real-time Postgres changes subscription for the current user's profile
  useEffect(() => {
    if (!currentUser?.id) return;

    const isValidUUID = (idStr: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
    if (!isValidUUID(currentUser.id)) return;

    const profileChannel = supabase
      .channel(`auth-profile-sync-${currentUser.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${currentUser.id}`
      }, (payload) => {
        if (payload.new) {
          const updated = payload.new as UserProfile;
          setProfile(updated);
          localStorage.setItem(`crypx_user_profile_${currentUser.id}`, JSON.stringify(updated));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    // Capture referral query parameter from URL immediately on app load
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        localStorage.setItem('crypx_pending_ref_v1', ref);
      }
    } catch (e) {
      console.warn("Could not parse referral parameter", e);
    }

    // Trigger asynchronous Supabase database syncing for admin portal
    syncCustomAccountsWithSupabase().catch(console.warn);
    syncUserReferralsWithSupabase().catch(console.warn);
    syncAdminWalletsWithSupabase().catch(console.warn);
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      const isAdminOrStaff = getAdminIdForCurrentUser(session.user.email);
      if (!isAdminOrStaff) {
        const pendingRef = localStorage.getItem('crypx_pending_ref_v1');
        if (pendingRef) {
          setReferrerForUser(session.user.email, session.user.id, pendingRef);
          localStorage.removeItem('crypx_pending_ref_v1');
        } else {
          // If the user registered/logged in without any unique referral, auto-default them to admin2 (CXPAD-002)
          const currentReferrer = getReferrerForUser(session.user.email, session.user.id);
          if (!currentReferrer) {
            setReferrerForUser(session.user.email, session.user.id, 'CXPAD-002');
          }
        }
      }
    }
  }, [session]);

  const signOut = async () => {
    localStorage.removeItem("crypx_custom_session_v1");
    if (currentUser?.id) {
      localStorage.removeItem(`crypx_user_profile_${currentUser.id}`);
    }
    clearSupabaseLocalStorage();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Error during Supabase signOut:", err);
    }
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: currentUser,
        profile,
        loading,
        signOut,
        refreshProfile,
        updateProfileLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
