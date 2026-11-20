"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Building2,
  User,
  Sliders,
  RotateCcw,
  LogOut,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sun,
  ShieldCheck,
  CloudLightning,
  Database,
  KeyRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { usePharmacy } from "@/lib/pharmacy-context";
import { useAuth } from "@/lib/auth-context";
import { PharmacyProfile, UserSettings } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, settings, updateProfile, updateSettings, resetToDemoData } = usePharmacy();
  const { user, signOut, isConfigured } = useAuth();

  // Local form state
  const [profileForm, setProfileForm] = useState<PharmacyProfile>({ ...profile });
  const [settingsForm, setSettingsForm] = useState<UserSettings>({ ...settings });

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    updateSettings(settingsForm);

    setSavedFeedback("All pharmacy profile and system preferences saved successfully.");
    setTimeout(() => {
      setSavedFeedback(null);
    }, 2500);
  };

  const handleConfirmReset = () => {
    resetToDemoData();
    setResetConfirmOpen(false);
    setSavedFeedback("Demo data has been reset to default state.");
    setTimeout(() => {
      router.push("/dashboard");
    }, 700);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <AppShell pageTitle="Pharmacy Configuration & Store Settings">
      <div className="max-w-4xl space-y-6">
        {savedFeedback && (
          <div className="flex items-center gap-2 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-xs text-[#15803D]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{savedFeedback}</span>
          </div>
        )}

        {/* Section 0: Supabase Authentication Status */}
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
            <div className="flex items-center gap-2">
              {isConfigured ? (
                <CloudLightning className="h-5 w-5 text-[#15803D]" />
              ) : (
                <Database className="h-5 w-5 text-[#0F766E]" />
              )}
              <div>
                <h3 className="text-xs font-bold text-[#1F2937]">Supabase Cloud Authentication</h3>
                <p className="text-[11px] text-[#64748B]">Cloud session state and user identity status</p>
              </div>
            </div>
            <div>
              {isConfigured && user && !user.isDemo ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 text-xs font-semibold text-[#15803D]">
                  <span className="h-2 w-2 rounded-full bg-[#15803D] animate-pulse"></span>
                  Connected to Supabase
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-1 text-xs font-semibold text-[#B45309]">
                  <span className="h-2 w-2 rounded-full bg-[#D97706]"></span>
                  Demo Session Active
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <span className="text-[11px] font-medium text-[#64748B]">Current Authenticated User</span>
              <p className="mt-1 font-semibold text-[#1F2937] text-sm">{user?.displayName || "Pharmacist"}</p>
              <p className="text-[11px] text-[#64748B]">{user?.email || "No email"}</p>
            </div>

            <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <span className="text-[11px] font-medium text-[#64748B]">Auth Provider & User ID</span>
              <p className="mt-1 font-semibold text-[#1F2937]">
                {user?.isDemo ? "Local Demo Terminal" : "Supabase Auth (Cloud)"}
              </p>
              <p className="text-[11px] font-mono text-[#64748B] truncate">
                ID: {user?.id || "N/A"}
              </p>
            </div>
          </div>

          {!isConfigured && (
            <div className="mt-4 rounded-md border border-[#CCFBF1] bg-[#F0FDFA] p-3 text-xs text-[#0F766E]">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">How to connect your live Supabase database:</span>
                  <p className="mt-1 text-[11px] text-[#0F766E]/90 leading-relaxed">
                    1. Create a free project at <span className="font-semibold">supabase.com</span><br />
                    2. Go to <span className="font-semibold">Project Settings &gt; API</span> and copy your Project URL &amp; anon public key<br />
                    3. Add them in <code className="font-mono bg-white/70 px-1 py-0.5 rounded border border-teal-200">.env.local</code> as <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveAll} className="space-y-6">
          {/* Section 1: Pharmacy Profile */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3 mb-4">
              <Building2 className="h-4 w-4 text-[#0F766E]" />
              <div>
                <h3 className="text-xs font-bold text-[#1F2937]">Store Profile & License Information</h3>
                <p className="text-[11px] text-[#64748B]">
                  Appears on invoices, sales receipts, and prescription records
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Pharmacy / Chemist Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Proprietor / Pharmacist Name</label>
                <input
                  type="text"
                  value={profileForm.ownerName}
                  onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Drug License / Registration No.</label>
                <input
                  type="text"
                  value={profileForm.licenseNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Store Phone / Mobile</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">City, State & Pin</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#374151] mb-1">Physical Store Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Dispensary Type</label>
                <select
                  value={profileForm.pharmacyType}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      pharmacyType: e.target.value as "standalone" | "doctor-associated",
                    })
                  }
                  className="w-full rounded border border-[#E2E8F0] bg-white px-3 py-2 outline-none focus:border-[#0F766E]"
                >
                  <option value="standalone">Standalone Retail Chemist</option>
                  <option value="doctor-associated">Clinic / Hospital Dispensary</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Store Inventory Capacity</label>
                <select
                  value={profileForm.storeSize}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      storeSize: e.target.value as "small" | "medium" | "large",
                    })
                  }
                  className="w-full rounded border border-[#E2E8F0] bg-white px-3 py-2 outline-none focus:border-[#0F766E]"
                >
                  <option value="small">Small Retail Store</option>
                  <option value="medium">Medium Multi-Rack Store</option>
                  <option value="large">Large Super-Stockist / Hospital</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: User Preferences & POS Tax Rules */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3 mb-4">
              <Sliders className="h-4 w-4 text-[#0F766E]" />
              <div>
                <h3 className="text-xs font-bold text-[#1F2937]">User Preferences & Billing Rules</h3>
                <p className="text-[11px] text-[#64748B]">Terminal settings and tax assumptions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Pharmacist Display Name</label>
                <input
                  type="text"
                  value={settingsForm.displayName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, displayName: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Designated Role</label>
                <input
                  type="text"
                  value={settingsForm.role}
                  onChange={(e) => setSettingsForm({ ...settingsForm, role: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Default GST / Tax Rate (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="28"
                    value={settingsForm.defaultTaxPercent}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, defaultTaxPercent: Number(e.target.value) })
                    }
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                  <span className="text-xs text-[#64748B] whitespace-nowrap">% rate</span>
                </div>
                <span className="text-[10px] text-[#64748B]">
                  Applied automatically on POS checkout
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Expiry Warning Horizon (Days)
                </label>
                <input
                  type="number"
                  min="15"
                  max="365"
                  value={settingsForm.lowStockAlertDays}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, lowStockAlertDays: Number(e.target.value) })
                  }
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
                <span className="text-[10px] text-[#64748B]">
                  Batches expiring within this window trigger amber warnings
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Default Table Page Size
                </label>
                <select
                  value={settingsForm.tablePageSize}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, tablePageSize: Number(e.target.value) })
                  }
                  className="w-full rounded border border-[#E2E8F0] bg-white px-3 py-2 outline-none focus:border-[#0F766E]"
                >
                  <option value={5}>5 records per page</option>
                  <option value={10}>10 records per page</option>
                  <option value={20}>20 records per page</option>
                  <option value={50}>50 records per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Appearance */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3 mb-4">
              <Sun className="h-4 w-4 text-[#0F766E]" />
              <div>
                <h3 className="text-xs font-bold text-[#1F2937]">Appearance & Theme</h3>
                <p className="text-[11px] text-[#64748B]">
                  High-contrast clinical white & teal-green system
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-[#1F2937]">Interface Theme Mode</div>
                <div className="text-[11px] text-[#64748B]">
                  Optimized for dispensary counter lighting and barcode scanning readability
                </div>
              </div>
              <div className="flex items-center gap-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] p-1">
                <button
                  type="button"
                  onClick={() => setSettingsForm({ ...settingsForm, theme: "light" })}
                  className={`flex items-center gap-1.5 rounded px-3 py-1 font-semibold ${
                    settingsForm.theme === "light"
                      ? "bg-white text-[#0F766E] shadow-xs"
                      : "text-[#64748B]"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light (Default)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded bg-[#0F766E] px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#115E59]"
            >
              <Save className="h-4 w-4" />
              <span>Save Configuration Changes</span>
            </button>
          </div>
        </form>

        {/* Section 4: Demo Session & Data Management */}
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
          <div className="border-b border-[#E2E8F0] pb-3 mb-4">
            <h3 className="text-xs font-bold text-[#1F2937]">Terminal Session & Reset Management</h3>
            <p className="text-[11px] text-[#64748B]">Manage client browser state and terminal access</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-semibold text-[#1F2937]">Factory Reset Demo Data</div>
              <div className="text-[11px] text-[#64748B]">
                Clear simulated sales, newly created batches, and restore the initial verified dataset
              </div>
            </div>
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="flex items-center gap-1.5 rounded border border-[#B45309] bg-[#FFFBEB] px-3.5 py-1.5 text-xs font-semibold text-[#B45309] hover:bg-[#FEF3C7]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Seed Demo State</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-semibold text-[#1F2937]">Sign Out from Pharmacy Terminal</div>
              <div className="text-[11px] text-[#64748B]">
                End active session and return to the login prompt
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded border border-[#E2E8F0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out Terminal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-xl">
            <h3 className="text-sm font-bold text-[#1F2937]">Reset Demo Store Data?</h3>
            <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
              This action will reset all medicines, batches, billing cart, invoices, and preferences back to the initial standard demo catalog. Any test transactions will be cleared.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="rounded border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="rounded bg-[#B91C1C] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#991B1B]"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
