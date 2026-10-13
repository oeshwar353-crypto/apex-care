"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  User,
  Search,
  RotateCcw,
  LogOut,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Plus,
} from "lucide-react";
import { usePharmacy } from "@/lib/pharmacy-context";
import { formatINR } from "@/lib/calculations";

interface HeaderProps {
  pageTitle: string;
  onOpenMobileNav: () => void;
  onOpenAddMedicine?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  onOpenMobileNav,
  onOpenAddMedicine,
}) => {
  const router = useRouter();
  const { profile, settings, kpiStats, batches, resetToDemoData } = usePharmacy();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalAlerts = kpiStats.lowStockCount + kpiStats.expiringBatchesCount + kpiStats.expiredBatchesCount;

  // Filter batches for notifications
  const lowStockItems = batches.filter((b) => b.quantity > 0 && b.quantity <= b.reorderThreshold);
  const expiringItems = batches.filter((b) => {
    const today = new Date();
    const expiry = new Date(b.expiryDate);
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 90;
  });

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-[#FFFFFF] px-4 sm:px-6">
        {/* Left side: Hamburger (mobile) + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="rounded p-1.5 text-[#64748B] hover:bg-[#F8FAFC] lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#1F2937] leading-none">
                {pageTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-medium text-[#64748B]">
                {profile.city.split(",")[0] || "Store Front"}
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-[#64748B] mt-0.5">
              Logged in as <span className="font-semibold text-[#1F2937]">{settings.displayName}</span> ({settings.role})
            </p>
          </div>
        </div>

        {/* Right side: Quick actions + Notifications + User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Billing Action */}
          <Link
            href="/billing"
            className="hidden sm:inline-flex items-center gap-1.5 rounded bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#115E59]"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>New Bill (POS)</span>
          </Link>

          {/* Quick Add Medicine trigger if on inventory */}
          {onOpenAddMedicine && (
            <button
              onClick={onOpenAddMedicine}
              className="inline-flex items-center gap-1.5 rounded border border-[#0F766E] bg-[#F0FDFA] px-2.5 py-1.5 text-xs font-medium text-[#0F766E] transition-colors hover:bg-[#CCFBF1]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Medicine</span>
            </button>
          )}

          {/* Notification Menu */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative rounded-md border border-[#E2E8F0] bg-[#FFFFFF] p-2 text-[#4B5563] transition-colors hover:bg-[#F8FAFC]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B91C1C] text-[10px] font-bold text-white">
                  {totalAlerts > 9 ? "9+" : totalAlerts}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] shadow-md z-50">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                  <div className="text-xs font-bold text-[#1F2937]">Store Alerts & Notifications</div>
                  <span className="rounded bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-medium text-[#64748B]">
                    {totalAlerts} Active
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#F1F5F9]">
                  {totalAlerts === 0 ? (
                    <div className="py-6 text-center text-xs text-[#64748B]">
                      <CheckCircle2 className="mx-auto mb-1.5 h-6 w-6 text-[#15803D]" />
                      All inventory levels and batches are healthy.
                    </div>
                  ) : (
                    <>
                      {/* Low Stock Alerts */}
                      {lowStockItems.slice(0, 4).map((b) => (
                        <div key={b.id} className="p-2 text-xs hover:bg-[#F8FAFC]">
                          <div className="flex items-center gap-1.5 text-[#B45309] font-medium">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>Low Stock: {b.medicineName}</span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#64748B]">
                            Only {b.quantity} units remaining (Batch: {b.batchNumber}, Threshold: {b.reorderThreshold})
                          </div>
                        </div>
                      ))}

                      {/* Expiring Soon Alerts */}
                      {expiringItems.slice(0, 4).map((b) => (
                        <div key={b.id} className="p-2 text-xs hover:bg-[#F8FAFC]">
                          <div className="flex items-center gap-1.5 text-[#B91C1C] font-medium">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>Expiring Soon: {b.medicineName}</span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#64748B]">
                            Batch {b.batchNumber} expires on {b.expiryDate} ({b.quantity} units)
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-2 text-center">
                  <Link
                    href="/inventory"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-semibold text-[#0F766E] hover:underline"
                  >
                    Manage Inventory Batches &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-2.5 py-1.5 text-xs text-[#1F2937] hover:bg-[#F8FAFC]"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[#F0FDFA] text-[#0F766E] font-bold text-xs">
                {settings.displayName.charAt(0) || "U"}
              </div>
              <span className="hidden sm:inline font-medium text-xs max-w-[120px] truncate">
                {settings.displayName}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] shadow-md z-50 py-1">
                <div className="border-b border-[#E2E8F0] px-3.5 py-2.5">
                  <div className="text-xs font-bold text-[#1F2937] truncate">{settings.displayName}</div>
                  <div className="text-[11px] text-[#64748B] truncate">{settings.email}</div>
                  <div className="mt-1 inline-block rounded bg-[#F0FDFA] px-1.5 py-0.5 text-[10px] font-semibold text-[#0F766E]">
                    {settings.role}
                  </div>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#374151] hover:bg-[#F8FAFC]"
                >
                  <Sliders className="h-3.5 w-3.5 text-[#64748B]" />
                  <span>Store Settings</span>
                </Link>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setResetConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs text-[#B45309] hover:bg-[#FEF3C7]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Demo Data</span>
                </button>

                <div className="border-t border-[#E2E8F0] my-1"></div>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs text-[#B91C1C] hover:bg-[#FEE2E2]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Reset Demo Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-md border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-lg">
            <h3 className="text-sm font-bold text-[#1F2937]">Reset Demo Store Data?</h3>
            <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
              This will reset all medicines, batches, bills, invoices, and settings back to the default initial mock state. Any simulated sales or inventory changes will be cleared.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="rounded border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#4B5563] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDemoData();
                  setResetConfirmOpen(false);
                }}
                className="rounded bg-[#B91C1C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#991B1B]"
              >
                Yes, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
