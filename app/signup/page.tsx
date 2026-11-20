"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pill, ArrowRight, AlertCircle, Info, CloudLightning, Database, CheckCircle2 } from "lucide-react";
import { validateSignupForm } from "@/lib/validation";
import { usePharmacy } from "@/lib/pharmacy-context";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { updateProfile } = usePharmacy();
  const { signUp, isConfigured } = useAuth();

  const [formData, setFormData] = useState({
    pharmacyName: "",
    ownerName: "",
    email: "",
    licenseNumber: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessInfo(null);

    const result = validateSignupForm(formData);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      const res = await signUp({
        email: formData.email,
        password: formData.password,
        pharmacyName: formData.pharmacyName,
        ownerName: formData.ownerName,
        licenseNumber: formData.licenseNumber,
      });

      if (!res.success) {
        setSubmitError(res.error || "Failed to create account.");
        setIsLoading(false);
        return;
      }

      // Update store profile with newly registered store information
      await updateProfile({
        name: formData.pharmacyName,
        ownerName: formData.ownerName,
        email: formData.email,
        licenseNumber: formData.licenseNumber,
      });

      // Directly proceed to store onboarding wizard
      router.push("/onboarding");
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-8 sm:py-10">
      <div className="w-full max-w-lg">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F766E] transition-colors"
          >
            &larr; Back to Home Page
          </Link>
        </div>

        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#0F766E] text-white shadow-sm">
            <Pill className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-[#1F2937]">
            Register Pharmacy Terminal
          </h1>
          <p className="text-xs text-[#64748B]">
            Create your account powered by Supabase Authentication
          </p>
        </div>

        {/* Supabase status notice */}
        <div
          className={`mb-4 rounded-md border p-3 text-xs ${
            isConfigured
              ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
              : "border-[#E2E8F0] bg-[#FFFFFF] text-[#64748B]"
          }`}
        >
          <div className="flex items-start gap-2">
            {isConfigured ? (
              <CloudLightning className="h-4 w-4 shrink-0 text-[#15803D] mt-0.5" />
            ) : (
              <Database className="h-4 w-4 shrink-0 text-[#0F766E] mt-0.5" />
            )}
            <div>
              {isConfigured ? (
                <div>
                  <span className="font-semibold text-[#15803D]">Supabase Connected:</span> Registration creates a verified user profile in your Supabase Auth user table.
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-[#1F2937]">Demo / Setup Mode:</span> Supabase keys not set yet in <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">.env.local</code>. Registrations proceed locally so you can test all features immediately.
                </div>
              )}
            </div>
          </div>
        </div>

        {submitError && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#B91C1C]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {successInfo && (
          <div className="mb-4 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-xs text-[#15803D]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successInfo}</p>
                <div className="mt-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 font-semibold text-[#0F766E] underline"
                  >
                    Go to Sign In &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pharmacy Name */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Pharmacy / Chemist Name *
                </label>
                <input
                  type="text"
                  value={formData.pharmacyName}
                  onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                  placeholder="e.g. Sanjeevani Medicals"
                  className={`w-full rounded border px-3 py-2 text-xs text-[#1F2937] outline-none focus:border-[#0F766E] ${
                    errors.pharmacyName ? "border-[#B91C1C]" : "border-[#E2E8F0]"
                  }`}
                />
                {errors.pharmacyName && (
                  <p className="mt-1 text-[11px] text-[#B91C1C]">{errors.pharmacyName}</p>
                )}
              </div>

              {/* Owner / Registered Pharmacist */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Pharmacist / Owner Name *
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Sharma, B.Pharm"
                  className={`w-full rounded border px-3 py-2 text-xs text-[#1F2937] outline-none focus:border-[#0F766E] ${
                    errors.ownerName ? "border-[#B91C1C]" : "border-[#E2E8F0]"
                  }`}
                />
                {errors.ownerName && (
                  <p className="mt-1 text-[11px] text-[#B91C1C]">{errors.ownerName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Contact Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="store@pharmacy.com"
                  className={`w-full rounded border px-3 py-2 text-xs text-[#1F2937] outline-none focus:border-[#0F766E] ${
                    errors.email ? "border-[#B91C1C]" : "border-[#E2E8F0]"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-[#B91C1C]">{errors.email}</p>
                )}
              </div>

              {/* Drug License */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Drug License / Reg Number *
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="e.g. DL-MH-2024-XXXX"
                  className={`w-full rounded border px-3 py-2 text-xs text-[#1F2937] outline-none focus:border-[#0F766E] ${
                    errors.licenseNumber ? "border-[#B91C1C]" : "border-[#E2E8F0]"
                  }`}
                />
                {errors.licenseNumber && (
                  <p className="mt-1 text-[11px] text-[#B91C1C]">{errors.licenseNumber}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Terminal Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className={`w-full rounded border px-3 py-2 text-xs text-[#1F2937] outline-none focus:border-[#0F766E] ${
                    errors.password ? "border-[#B91C1C]" : "border-[#E2E8F0]"
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-[11px] text-[#B91C1C]">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repeat password"
                  className={`w-full rounded border px-3 py-2 text-xs text-[#1F2937] outline-none focus:border-[#0F766E] ${
                    errors.confirmPassword ? "border-[#B91C1C]" : "border-[#E2E8F0]"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-[#B91C1C]">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-[#4B5563]">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#0F766E] focus:ring-[#0F766E]"
                />
                <span>
                  I agree to standard pharmacy drug dispensing standards, record retention guidelines, and terms of service.
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="mt-1 text-[11px] text-[#B91C1C]">{errors.termsAccepted}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#0F766E] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#115E59] disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Return to Login */}
          <div className="mt-6 border-t border-[#E2E8F0] pt-4 text-center text-xs text-[#64748B]">
            Already have an active pharmacy terminal?{" "}
            <Link href="/login" className="font-semibold text-[#0F766E] hover:underline">
              Sign In Instead &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
