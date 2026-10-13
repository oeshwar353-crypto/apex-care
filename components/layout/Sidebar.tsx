"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Receipt,
  History,
  BarChart3,
  TrendingUp,
  Settings,
  Pill,
  X,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { usePharmacy } from "@/lib/pharmacy-context";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const pathname = usePathname();
  const { profile, kpiStats, cart } = usePharmacy();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Inventory",
      href: "/inventory",
      icon: Boxes,
      badge: kpiStats.lowStockCount > 0 ? `${kpiStats.lowStockCount} low` : undefined,
      badgeColor: "bg-[#FEF3C7] text-[#B45309]",
    },
    {
      label: "Billing / POS",
      href: "/billing",
      icon: Receipt,
      badge: cart.length > 0 ? `${cart.length}` : undefined,
      badgeColor: "bg-[#0F766E] text-white",
    },
    {
      label: "Sales History",
      href: "/sales",
      icon: History,
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      label: "Demand Predictor",
      href: "/predictor",
      icon: TrendingUp,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#E2E8F0] bg-[#FFFFFF] transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#E2E8F0] px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0F766E] text-white">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-[#1F2937]">ApexCare Rx</div>
              <div className="text-[11px] font-medium text-[#64748B]">Pharmacy ERP v2.4</div>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="rounded p-1 text-[#64748B] hover:bg-[#F8FAFC] lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Live System Indicator */}
        <div className="border-b border-[#E2E8F0] bg-[#F0FDFA] px-4 py-2 text-[11px] font-medium text-[#0F766E] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#15803D]"></span>
            Store Online (Client State)
          </span>
          <span className="font-semibold text-xs">INR (₹)</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-nav-y overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Operations
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#F0FDFA] text-[#0F766E] border-l-4 border-[#0F766E] pl-2 font-semibold"
                      : "text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#1F2937]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? "text-[#0F766E]" : "text-[#64748B]"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick status alerts in sidebar */}
          {(kpiStats.lowStockCount > 0 || kpiStats.expiringBatchesCount > 0) && (
            <div className="mt-6 rounded-md border border-[#FDE68A] bg-[#FEF3C7] p-3 text-xs text-[#92400E]">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-4 w-4 text-[#B45309]" />
                Attention Needed
              </div>
              <p className="mt-1 text-[11px] leading-tight text-[#78350F]">
                {kpiStats.lowStockCount} items below threshold, {kpiStats.expiringBatchesCount} batches expiring soon.
              </p>
              <Link
                href="/inventory"
                className="mt-2 inline-block text-[11px] font-semibold text-[#B45309] underline hover:text-[#78350F]"
              >
                Inspect Inventory &rarr;
              </Link>
            </div>
          )}
        </nav>

        {/* Pharmacy Context Footer */}
        <div className="border-t border-[#E2E8F0] p-3.5">
          <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
            <div className="truncate text-xs font-semibold text-[#1F2937]">
              {profile.name}
            </div>
            <div className="mt-0.5 truncate text-[10px] text-[#64748B]">
              Lic: {profile.licenseNumber}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#64748B]">Type:</span>
              <span className="capitalize font-medium text-[#0F766E]">
                {profile.pharmacyType}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
