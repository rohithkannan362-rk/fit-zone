import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { type Profile } from "../lib/supabase-types";

export type UserRole = "admin" | "member";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  member: Profile | null;
}

interface AuthContextType {
  user: AppUser | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    mobile: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  syncProfileData: (data: {
    email?: string;
    full_name?: string;
    mobile?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const handleSession = async (authSessionUser: SupabaseUser) => {
      if (!mounted) return;
      setSupabaseUser(authSessionUser);

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authSessionUser.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
        }

        if (mounted) {
          setUser({
            uid: authSessionUser.id,
            email: authSessionUser.email || "",
            role: profile?.role === "admin" ? "admin" : "member",
            member: profile || null,
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Profile fetch failed:", error);
        if (mounted) {
          setUser({
            uid: authSessionUser.id,
            email: authSessionUser.email || "",
            role: "member",
            member: null,
          });
          setIsLoading(false);
        }
      }
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await handleSession(session.user);
        } else if (mounted) {
          const isOauthError =
            window.location.search.includes("error=") ||
            window.location.hash.includes("error=");
          if (isOauthError) {
            console.error("OAuth Error detected in URL");
            alert(
              "Google Login Failed. Please check your Supabase Provider settings (Client Secret).",
            );
            setSupabaseUser(null);
            setUser(null);
            setIsLoading(false);
          } else {
            // We wait for INITIAL_SESSION or SIGNED_IN
          }
        }
      } catch (error) {
        console.error("Session error:", error);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log("Auth event:", event, !!session);

      if (session?.user) {
        await handleSession(session.user);
      } else if (event === "INITIAL_SESSION") {
        const isOauthCallback =
          window.location.hash.includes("access_token=") ||
          window.location.search.includes("code=");
        if (!isOauthCallback) {
          setSupabaseUser(null);
          setUser(null);
          setIsLoading(false);
        } else {
          console.log(
            "INITIAL_SESSION has null session, but OAuth callback detected. Waiting for SIGNED_IN...",
          );
        }
      } else if (event === "SIGNED_OUT") {
        setSupabaseUser(null);
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    mobile: string;
    password: string;
  }): Promise<void> => {
    setIsLoading(true);
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          mobile: data.mobile,
        },
      },
    });

    if (error) {
      setIsLoading(false);
      throw error;
    }

    // Unset loading if no session is returned immediately (e.g. email confirmation required)
    if (!authData.session) {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };
  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/member/dashboard`,
      },
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const sendPhoneOtp = async (phone: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  };

  const verifyPhoneOtp = async (
    phone: string,
    token: string,
  ): Promise<void> => {
    setIsLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const syncProfileData = async (data: {
    email?: string;
    full_name?: string;
    mobile?: string;
  }): Promise<void> => {
    if (!user || !user.uid) return;

    // 1. Update Auth email if provided
    if (data.email && data.email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: data.email,
      });
      if (authError) throw authError;
    }

    // 2. Update Profile table
    const { error: profileError } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.uid);

    if (profileError) throw profileError;

    // Re-fetch profile to sync local state
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.uid)
      .single();

    if (updatedProfile) {
      setUser((prev) =>
        prev
          ? { ...prev, member: updatedProfile, email: data.email || prev.email }
          : null,
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        isLoading,
        login,
        register,
        logout,
        resetPassword,
        loginWithGoogle,
        sendPhoneOtp,
        verifyPhoneOtp,
        syncProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
