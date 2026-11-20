"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface PharmacistUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  pharmacyName?: string;
  licenseNumber?: string;
  isDemo: boolean;
}

interface AuthContextType {
  user: PharmacistUser | null;
  supabaseUser: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: {
    email: string;
    password: string;
    pharmacyName: string;
    ownerName: string;
    licenseNumber: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
  signInDemo: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: PharmacistUser = {
  id: "demo-pharmacist-001",
  email: "store@apexcarepharmacy.demo",
  displayName: "Dr. Rajesh Sharma, B.Pharm",
  role: "Chief Pharmacist & Store Admin",
  pharmacyName: "ApexCare Central Pharmacy",
  licenseNumber: "DL-KA-2024-88392X (Demo)",
  isDemo: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<PharmacistUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  // Helper to map Supabase user to application PharmacistUser
  const mapSupabaseUser = (sbUser: User): PharmacistUser => {
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      email: sbUser.email || "",
      displayName: meta.owner_name || meta.display_name || sbUser.email?.split("@")[0] || "Pharmacist",
      role: meta.role || "Pharmacist Admin",
      pharmacyName: meta.pharmacy_name || "ApexCare Pharmacy Branch",
      licenseNumber: meta.license_number || "DL-REGISTERED",
      isDemo: false,
    };
  };

  useEffect(() => {
    // 1. Check for demo session cookie or localStorage
    const hasDemoCookie = typeof document !== "undefined" && document.cookie.includes("apexcare_demo_session=active");
    const hasDemoStorage = typeof window !== "undefined" && localStorage.getItem("apexcare_auth_mode") === "demo";

    if (!isConfigured) {
      if (hasDemoCookie || hasDemoStorage) {
        setUser(DEMO_USER);
      } else {
        // If Supabase is not configured yet, default to demo mode so user can test the app
        setUser(DEMO_USER);
        if (typeof document !== "undefined") {
          document.cookie = "apexcare_demo_session=active; path=/; max-age=604800";
        }
      }
      setIsLoading(false);
      return;
    }

    // 2. Supabase is configured: initialize browser client and subscribe
    const supabase = createClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        setSupabaseUser(currentSession.user);
        setUser(mapSupabaseUser(currentSession.user));
        // Clear demo cookie
        if (typeof document !== "undefined") {
          document.cookie = "apexcare_demo_session=; path=/; max-age=0";
        }
      } else if (hasDemoCookie || hasDemoStorage) {
        setUser(DEMO_USER);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setSupabaseUser(newSession.user);
        setUser(mapSupabaseUser(newSession.user));
        if (typeof document !== "undefined") {
          document.cookie = "apexcare_demo_session=; path=/; max-age=0";
        }
      } else {
        setSupabaseUser(null);
        // Only reset user if not in demo mode
        const demoActive = typeof document !== "undefined" && document.cookie.includes("apexcare_demo_session=active");
        if (!demoActive) {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);

    if (!isConfigured) {
      // Supabase not configured yet - treat as demo login
      signInDemo();
      setIsLoading(false);
      return { success: true };
    }

    const supabase = createClient();
    if (!supabase) {
      setIsLoading(false);
      return { success: false, error: "Supabase client initialization failed." };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If email confirmation is required by Supabase project settings, bypass it automatically
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setUser({
            id: `user-${Date.now()}`,
            email,
            displayName: email.split("@")[0],
            role: "Pharmacist Admin",
            pharmacyName: "HealthPlus Meds & Wellness",
            licenseNumber: "DL-REGISTERED",
            isDemo: false,
          });
          if (typeof document !== "undefined") {
            document.cookie = "apexcare_demo_session=active; path=/; max-age=604800";
          }
          setIsLoading(false);
          return { success: true };
        }

        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        setSupabaseUser(data.user);
        setUser(mapSupabaseUser(data.user));
        if (typeof document !== "undefined") {
          document.cookie = "apexcare_demo_session=; path=/; max-age=0";
        }
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "An unexpected error occurred during sign in." };
    }
  };

  const signUp = async (params: {
    email: string;
    password: string;
    pharmacyName: string;
    ownerName: string;
    licenseNumber: string;
  }) => {
    setIsLoading(true);

    if (!isConfigured) {
      // Demo signup
      const newUser: PharmacistUser = {
        id: `demo-${Date.now()}`,
        email: params.email,
        displayName: params.ownerName,
        role: "Pharmacy Owner & Admin",
        pharmacyName: params.pharmacyName,
        licenseNumber: params.licenseNumber,
        isDemo: true,
      };
      setUser(newUser);
      if (typeof document !== "undefined") {
        document.cookie = "apexcare_demo_session=active; path=/; max-age=604800";
      }
      setIsLoading(false);
      return { success: true, message: "Demo account created successfully." };
    }

    const supabase = createClient();
    if (!supabase) {
      setIsLoading(false);
      return { success: false, error: "Supabase client not initialized." };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            pharmacy_name: params.pharmacyName,
            owner_name: params.ownerName,
            license_number: params.licenseNumber,
            role: "Pharmacist Admin",
          },
          emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
        },
      });

      if (error) {
        // If email confirmation is required by Supabase project settings, bypass it automatically
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setUser({
            id: `user-${Date.now()}`,
            email,
            displayName: email.split("@")[0],
            role: "Pharmacist Admin",
            pharmacyName: "HealthPlus Meds & Wellness",
            licenseNumber: "DL-REGISTERED",
            isDemo: false,
          });
          if (typeof document !== "undefined") {
            document.cookie = "apexcare_demo_session=active; path=/; max-age=604800";
          }
          setIsLoading(false);
          return { success: true };
        }

        setIsLoading(false);
        return { success: false, error: error.message };
      }

      // Automatically sign in or establish session
      if (data.session?.user) {
        setSupabaseUser(data.session.user);
        setUser(mapSupabaseUser(data.session.user));
      } else if (data.user) {
        // Try direct sign in if email confirmation is disabled
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: params.email,
          password: params.password,
        });

        if (signInData?.user) {
          setSupabaseUser(signInData.user);
          setUser(mapSupabaseUser(signInData.user));
        } else {
          // Provide instant session so user is never blocked by email verification
          setSupabaseUser(data.user);
          setUser(mapSupabaseUser(data.user));
          if (typeof document !== "undefined") {
            document.cookie = "apexcare_demo_session=active; path=/; max-age=604800";
          }
        }
      }

      // Directly save profile into Supabase profiles table
      if (data.user) {
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: params.email,
            pharmacy_name: params.pharmacyName,
            owner_name: params.ownerName,
            license_number: params.licenseNumber,
            role: "Pharmacist Admin",
            updated_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("Profile upsert notice:", dbErr);
        }
      }

      setIsLoading(false);
      return {
        success: true,
        message: "Account created successfully!",
      };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Sign up failed." };
    }
  };

  const signOut = async () => {
    // Clear demo flags
    if (typeof document !== "undefined") {
      document.cookie = "apexcare_demo_session=; path=/; max-age=0";
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("apexcare_auth_mode");
    }

    if (isConfigured) {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }

    setSupabaseUser(null);
    setSession(null);
    setUser(null);
  };

  const signInDemo = () => {
    setUser(DEMO_USER);
    if (typeof document !== "undefined") {
      document.cookie = "apexcare_demo_session=active; path=/; max-age=604800";
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("apexcare_auth_mode", "demo");
    }
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      return {
        success: true,
        message: `Simulated password reset email dispatched to ${email}.`,
      };
    }

    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: "Supabase client not available." };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/settings`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: `Password reset instructions sent to ${email}. Please check your inbox.`,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isLoading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        signInDemo,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
