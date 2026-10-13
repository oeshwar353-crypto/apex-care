"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pill, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Info } from "lucide-react";
import { validateLoginForm } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrStoreId, setEmailOrStoreId] = useState("store@apexcarepharmacy.demo");
  const [password, setPassword] = useState("apexcare2026");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateLoginForm({ emailOrStoreId, password });
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 700);
  };

  const handleDemoBypass = () => {
    setEmailOrStoreId("store@apexcarepharmacy.demo");
    setPassword("apexcare2026");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 400);
  };

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetFeedback(`Password reset instructions have been dispatched to ${resetEmail} (Simulated).`);
    setTimeout(() => {
      setForgotModal(false);
      setResetFeedback(null);
    }, 2200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F766E] transition-colors"
          >
            &larr; Back to Home Page
          </Link>
        </div>
        {/* Software Branding Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#0F766E] text-white">
            <Pill className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-[#1F2937]">
            ApexCare Rx
          </h1>
          <p className="text-xs text-[#64748B]">
            Pharmacy Inventory & Point of Sale Management System
          </p>
        </div>

        {/* Demo Mode Notice Banner */}
        <div className="mb-4 rounded-md border border-[#CCFBF1] bg-[#F0FDFA] p-3 text-xs text-[#0F766E]">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Interactive Demo Mode:</span> Use the pre-filled credentials below or click the 1-click Demo Login button to access the full system.
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm">
          <div className="mb-5 border-b border-[#E2E8F0] pb-3">
            <h2 className="text-sm font-bold text-[#1F2937]">Sign in to your Pharmacy Terminal</h2>
            <p className="text-xs text-[#64748B]">Enter your store credentials or pharmacist ID</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Store ID / Email */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Store ID or Registered Email
              </label>
              <input
                type="text"
                value={emailOrStoreId}
                onChange={(e) => setEmailOrStoreId(e.target.value)}
                placeholder="e.g. store@apexcarepharmacy.demo or STR-401"
                className={`w-full rounded border px-3 py-2 text-xs text-[#1F2937] placeholder-[#94A3B8] outline-none transition-colors focus:border-[#0F766E] ${
                  errors.emailOrStoreId ? "border-[#B91C1C]" : "border-[#E2E8F0]"
                }`}
              />
              {errors.emailOrStoreId && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#B91C1C]">
                  <AlertCircle className="h-3 w-3" />
                  {errors.emailOrStoreId}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#374151]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-[11px] font-medium text-[#0F766E] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded border px-3 py-2 pr-9 text-xs text-[#1F2937] placeholder-[#94A3B8] outline-none transition-colors focus:border-[#0F766E] ${
                    errors.password ? "border-[#B91C1C]" : "border-[#E2E8F0]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#1F2937]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#B91C1C]">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#4B5563]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#0F766E] focus:ring-[#0F766E]"
                />
                <span>Remember this terminal</span>
              </label>
              <span className="text-[11px] text-[#64748B]">Terminal 01 (Main POS)</span>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#0F766E] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#115E59] disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In to Pharmacy Terminal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>

            {/* Demo Instant Login Button */}
            <button
              type="button"
              onClick={handleDemoBypass}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 rounded border border-[#0F766E] bg-[#F0FDFA] py-2 text-xs font-semibold text-[#0F766E] transition-colors hover:bg-[#CCFBF1]"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Explore Demo Dashboard Directly</span>
            </button>
          </form>

          {/* Links to Onboarding / Register */}
          <div className="mt-6 border-t border-[#E2E8F0] pt-4 text-center text-xs text-[#64748B]">
            Opening a new pharmacy branch?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#0F766E] hover:underline"
            >
              Register Pharmacy &rarr;
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-4 text-center text-[11px] text-[#94A3B8]">
          ApexCare Rx v2.4 • Client-side Demonstration • Currency: INR (₹)
        </p>
      </div>

      {/* Forgot Password Simulated Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-lg">
            <h3 className="text-sm font-bold text-[#1F2937]">Reset Pharmacist Credentials</h3>
            <p className="mt-1 text-xs text-[#64748B]">
              Enter your registered pharmacy email address to receive recovery verification details.
            </p>

            {resetFeedback ? (
              <div className="mt-3 rounded border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-xs text-[#15803D]">
                {resetFeedback}
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="mt-4 space-y-3">
                <input
                  type="email"
                  required
                  placeholder="name@pharmacy.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="rounded border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59]"
                  >
                    Send Instructions
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
