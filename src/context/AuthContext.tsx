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
import {
  getOAuthCallbackUrl,
  getPasswordResetCallbackUrl,
} from "../utils/authUtils";

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
  login: (
    email: string,
    password: string,
    expectedRole?: UserRole,
  ) => Promise<void>;
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
    avatar_url?: string;
    gender?: string;
    dob?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    blood_group?: string;
    fitness_goal?: string;
    height_cm?: number | string;
    weight_kg?: number | string;
    bio?: string;
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
        let profile = null;
        let retries = 3;
        while (retries > 0) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authSessionUser.id)
            .single();

          if (!error) {
            profile = data;
            break;
          }
          if (error.code !== "PGRST116") {
            console.error("Error fetching profile:", error);
            break;
          }
          // Wait and retry if profile not found (trigger delay)
          retries--;
          if (retries > 0) await new Promise((r) => setTimeout(r, 1000));
        }

        if (mounted) {
          const userMeta = authSessionUser.user_metadata || {};
          const mergedProfile: Profile | null = profile
            ? {
                ...profile,
                avatar_url: profile.avatar_url || userMeta.avatar_url || null,
                gender: profile.gender ?? userMeta.gender ?? null,
                dob: profile.dob ?? userMeta.dob ?? null,
                address: profile.address ?? userMeta.address ?? null,
                emergency_contact_name: profile.emergency_contact_name ?? userMeta.emergency_contact_name ?? null,
                emergency_contact_phone: profile.emergency_contact_phone ?? userMeta.emergency_contact_phone ?? null,
                blood_group: profile.blood_group ?? userMeta.blood_group ?? null,
                fitness_goal: profile.fitness_goal ?? userMeta.fitness_goal ?? null,
                height_cm: profile.height_cm ?? userMeta.height_cm ?? null,
                weight_kg: profile.weight_kg ?? userMeta.weight_kg ?? null,
                bio: profile.bio ?? userMeta.bio ?? null,
              }
            : null;

          setUser({
            uid: authSessionUser.id,
            email: authSessionUser.email || "",
            role: profile?.role === "admin" ? "admin" : "member",
            member: mergedProfile,
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
          window.location.search.includes("code=") ||
          window.location.pathname.includes("/auth/callback");
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

  const login = async (
    email: string,
    password: string,
    expectedRole?: UserRole,
  ): Promise<void> => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }

    if (expectedRole && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const userRole: UserRole = profile?.role === "admin" ? "admin" : "member";
      if (userRole !== expectedRole) {
        await supabase.auth.signOut();
        setSupabaseUser(null);
        setUser(null);
        setIsLoading(false);
        if (expectedRole === "member") {
          throw new Error(
            "Access denied: Admin accounts cannot sign in through Member Login. Please use the Admin Portal.",
          );
        } else {
          throw new Error(
            "Access denied: Member accounts cannot sign in through the Admin Portal.",
          );
        }
      }
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
    const redirectTo = getPasswordResetCallbackUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  };

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    const redirectTo = getOAuthCallbackUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
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
    avatar_url?: string;
    gender?: string;
    dob?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    blood_group?: string;
    fitness_goal?: string;
    height_cm?: number | string;
    weight_kg?: number | string;
    bio?: string;
  }): Promise<void> => {
    if (!user || !user.uid) return;

    // 1. Prepare user metadata for auth.users
    const userMetadata: Record<string, any> = {};
    if (data.full_name !== undefined) userMetadata.full_name = data.full_name;
    if (data.mobile !== undefined) userMetadata.mobile = data.mobile;
    if (data.avatar_url !== undefined) userMetadata.avatar_url = data.avatar_url;
    if (data.gender !== undefined) userMetadata.gender = data.gender;
    if (data.dob !== undefined) userMetadata.dob = data.dob;
    if (data.address !== undefined) userMetadata.address = data.address;
    if (data.emergency_contact_name !== undefined) userMetadata.emergency_contact_name = data.emergency_contact_name;
    if (data.emergency_contact_phone !== undefined) userMetadata.emergency_contact_phone = data.emergency_contact_phone;
    if (data.blood_group !== undefined) userMetadata.blood_group = data.blood_group;
    if (data.fitness_goal !== undefined) userMetadata.fitness_goal = data.fitness_goal;
    if (data.height_cm !== undefined) userMetadata.height_cm = data.height_cm;
    if (data.weight_kg !== undefined) userMetadata.weight_kg = data.weight_kg;
    if (data.bio !== undefined) userMetadata.bio = data.bio;

    // 2. Update Auth email if provided and metadata
    const authUpdatePayload: { email?: string; data?: Record<string, any> } = {};
    if (data.email && data.email !== user.email) {
      authUpdatePayload.email = data.email;
    }
    if (Object.keys(userMetadata).length > 0) {
      authUpdatePayload.data = userMetadata;
    }
    if (Object.keys(authUpdatePayload).length > 0) {
      try {
        const { error: authError } = await supabase.auth.updateUser(authUpdatePayload);
        if (authError) console.warn("Supabase auth updateUser notice:", authError.message);
      } catch (err) {
        console.warn("Auth update error:", err);
      }
    }

    // 3. Update Profile table
    const fullProfilePayload: Record<string, any> = { ...data };
    delete (fullProfilePayload as any).id;
    delete (fullProfilePayload as any).created_at;
    delete (fullProfilePayload as any).updated_at;
    delete (fullProfilePayload as any).role;
    delete (fullProfilePayload as any).status;
    delete (fullProfilePayload as any).member_code;

    // Try updating all columns in profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update(fullProfilePayload)
      .eq("id", user.uid);

    // If extended columns don't exist yet in the SQL table, update core fields
    if (profileError) {
      console.warn("Profiles full update fallback to core columns:", profileError.message);
      const corePayload: Record<string, any> = {};
      if (data.full_name !== undefined) corePayload.full_name = data.full_name;
      if (data.mobile !== undefined) corePayload.mobile = data.mobile;
      if (data.email !== undefined) corePayload.email = data.email;

      if (data.avatar_url !== undefined) {
        try {
          await supabase
            .from("profiles")
            .update({ avatar_url: data.avatar_url })
            .eq("id", user.uid);
        } catch (avErr) {
          console.warn("Avatar column update note:", avErr);
        }
      }

      if (Object.keys(corePayload).length > 0) {
        const { error: coreError } = await supabase
          .from("profiles")
          .update(corePayload)
          .eq("id", user.uid);
        if (coreError) {
          console.warn("Core profile update notice:", coreError.message);
        }
      }
    }

    // 4. Update local state immediately so UI updates without reload
    setUser((prev) => {
      if (!prev) return null;
      const currentMember = prev.member || ({} as Profile);
      return {
        ...prev,
        email: data.email || prev.email,
        member: {
          ...currentMember,
          ...data,
          full_name: data.full_name !== undefined ? data.full_name : currentMember.full_name,
          mobile: data.mobile !== undefined ? data.mobile : currentMember.mobile,
          avatar_url: data.avatar_url !== undefined ? data.avatar_url : currentMember.avatar_url,
          gender: data.gender !== undefined ? data.gender : currentMember.gender,
          dob: data.dob !== undefined ? data.dob : currentMember.dob,
          address: data.address !== undefined ? data.address : currentMember.address,
          emergency_contact_name: data.emergency_contact_name !== undefined ? data.emergency_contact_name : currentMember.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone !== undefined ? data.emergency_contact_phone : currentMember.emergency_contact_phone,
          blood_group: data.blood_group !== undefined ? data.blood_group : currentMember.blood_group,
          fitness_goal: data.fitness_goal !== undefined ? data.fitness_goal : currentMember.fitness_goal,
          height_cm: data.height_cm !== undefined ? data.height_cm : currentMember.height_cm,
          weight_kg: data.weight_kg !== undefined ? data.weight_kg : currentMember.weight_kg,
          bio: data.bio !== undefined ? data.bio : currentMember.bio,
        },
      };
    });
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
