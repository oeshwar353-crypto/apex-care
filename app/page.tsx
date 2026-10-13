"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Pill,
  Receipt,
  Boxes,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertTriangle,
  Menu,
  X,
  Printer,
  ChevronRight,
  Sparkles,
  Building2,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1F2937]">
      {/* Top Notification Bar */}
      <div className="border-b border-[#CCFBF1] bg-[#F0FDFA] px-4 py-2 text-center text-xs text-[#0F766E] font-medium">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#15803D]"></span>
          <span>ApexCare Rx Terminal v2.4 • Client-side Interactive Prototype Ready • Currency: INR (₹)</span>
        </span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-[#FFFFFF]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0F766E] text-white">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-[#1F2937] leading-none">
                ApexCare Rx
              </div>
              <div className="text-[10px] font-medium text-[#64748B] mt-0.5">
                Pharmacy Management ERP
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#4B5563]">
            <a href="#features" className="hover:text-[#0F766E] transition-colors">
              Modules & Capabilities
            </a>
            <a href="#pos-terminal" className="hover:text-[#0F766E] transition-colors">
              POS Billing
            </a>
            <a href="#inventory-control" className="hover:text-[#0F766E] transition-colors">
              Batch Tracking
            </a>
            <a href="#forecasting" className="hover:text-[#0F766E] transition-colors">
              Demand Forecasting
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded border border-[#E2E8F0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#374151] hover:bg-[#F8FAFC] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded bg-[#0F766E] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59] transition-colors flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded p-1.5 text-[#64748B] hover:bg-[#F8FAFC] md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-[#E2E8F0] bg-[#FFFFFF] px-4 py-4 md:hidden space-y-3">
            <nav className="flex flex-col space-y-2 text-xs font-medium text-[#4B5563]">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#0F766E]"
              >
                Modules & Capabilities
              </a>
              <a
                href="#pos-terminal"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#0F766E]"
              >
                POS Billing
              </a>
              <a
                href="#inventory-control"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#0F766E]"
              >
                Batch Tracking
              </a>
              <a
                href="#forecasting"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#0F766E]"
              >
                Demand Forecasting
              </a>
            </nav>

            <div className="border-t border-[#E2E8F0] pt-3 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center rounded border border-[#E2E8F0] py-2 text-xs font-semibold text-[#374151]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="w-full text-center rounded bg-[#0F766E] py-2 text-xs font-semibold text-white"
              >
                Get Started Free
              </Link>
              <Link
                href="/dashboard"
                className="w-full text-center rounded border border-[#0F766E] bg-[#F0FDFA] py-2 text-xs font-semibold text-[#0F766E]"
              >
                Launch Demo Terminal Directly
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="border-b border-[#E2E8F0] bg-[#FFFFFF] py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Col: Hero Copy */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 rounded border border-[#CCFBF1] bg-[#F0FDFA] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Production-Style Pharmacy POS & ERP</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1F2937] leading-tight">
                Complete Inventory, POS Billing & Expiry Management for Retail Pharmacies
              </h1>

              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl">
                Built specifically for retail chemists, hospital dispensaries, and chain stores. Rapid barcode billing, batch-level FIFO expiry tracking, deterministic demand forecasting, and instant GST tax invoices.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/signup"
                  className="rounded bg-[#0F766E] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#115E59] transition-colors flex items-center gap-2"
                >
                  <span>Get Started & Setup Pharmacy</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/dashboard"
                  className="rounded border border-[#0F766E] bg-[#F0FDFA] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#0F766E] hover:bg-[#CCFBF1] transition-colors flex items-center gap-2"
                >
                  <span>Launch Live Demo Terminal</span>
                </Link>

                <Link
                  href="/login"
                  className="rounded border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#4B5563] hover:bg-[#F8FAFC]"
                >
                  Pharmacist Sign In
                </Link>
              </div>

              {/* Quick highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
                  <span>Zero negative stock</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
                  <span>FIFO batch control</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
                  <span>Indian Rupee (₹) & GST</span>
                </div>
              </div>
            </div>

            {/* Right Col: Interactive Live Terminal Preview Card */}
            <div className="lg:col-span-5">
              <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] shadow-md overflow-hidden">
                {/* Terminal Window Header */}
                <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#15803D]"></span>
                    <span className="font-bold text-[#1F2937]">ApexCare Terminal Preview</span>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono">STATION-01</span>
                </div>

                {/* Terminal Content Mock */}
                <div className="p-4 space-y-3.5 text-xs">
                  {/* Top Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                      <div className="text-[10px] text-[#64748B]">Today's Turnover</div>
                      <div className="text-base font-bold text-[#0F766E]">{formatINR(1845.85)}</div>
                      <div className="text-[10px] text-[#15803D] font-medium">+8.4% vs yesterday</div>
                    </div>
                    <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                      <div className="text-[10px] text-[#64748B]">Active SKUs</div>
                      <div className="text-base font-bold text-[#1F2937]">16 Medicines</div>
                      <div className="text-[10px] text-[#64748B]">18 Batches Tracked</div>
                    </div>
                  </div>

                  {/* Active Cart Snapshot */}
                  <div className="rounded border border-[#E2E8F0] p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#1F2937] border-b border-[#E2E8F0] pb-1.5">
                      <span>Live Billing Cart (Sample)</span>
                      <span className="text-[#0F766E]">2 items</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div>
                          <div className="font-medium text-[#1F2937]">Dolo 650 Tablet</div>
                          <div className="text-[10px] text-[#64748B]">Batch: DL-2024-901 • Qty: 2</div>
                        </div>
                        <div className="font-bold text-[#0F766E]">{formatINR(64.0)}</div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <div>
                          <div className="font-medium text-[#1F2937]">Augmentin 625 Duo</div>
                          <div className="text-[10px] text-[#64748B]">Batch: AUG-625-78 • Qty: 1</div>
                        </div>
                        <div className="font-bold text-[#0F766E]">{formatINR(201.5)}</div>
                      </div>
                    </div>

                    <div className="border-t border-[#E2E8F0] pt-2 flex items-center justify-between text-xs font-bold text-[#1F2937]">
                      <span>Total Payable:</span>
                      <span className="text-[#0F766E]">{formatINR(278.78)}</span>
                    </div>
                  </div>

                  {/* Immediate alerts */}
                  <div className="rounded border border-[#FEF3C7] bg-[#FFFBEB] p-2 text-[11px] text-[#92400E] flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#B45309]" />
                      <span>2 batches expiring within 30 days</span>
                    </span>
                    <Link href="/inventory" className="font-bold underline text-[#B45309]">
                      Inspect
                    </Link>
                  </div>

                  {/* CTA button inside preview */}
                  <Link
                    href="/dashboard"
                    className="w-full flex items-center justify-center gap-1.5 rounded bg-[#0F766E] py-2 text-xs font-semibold text-white hover:bg-[#115E59]"
                  >
                    <span>Enter Full Management System</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE MODULES SECTION */}
      <section id="features" className="py-14 sm:py-16 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Dedicated Operations Suite
            </h2>
            <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#1F2937]">
              Engineered for Practical Pharmacy Dispensing
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B]">
              Every module is designed to eliminate dispensing errors, speed up counter queues, and keep regulatory batch records accurate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1: POS Billing */}
            <div
              id="pos-terminal"
              className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm space-y-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0F766E]">
                <Receipt className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Fast POS Billing Terminal</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Dual-pane checkout with instant barcode search, batch selection, auto-calculated GST tax rules, customizable patient discounts, and instant printable tax memos.
              </p>
              <Link
                href="/billing"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline"
              >
                <span>Try Billing Terminal</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Module 2: Inventory & Batches */}
            <div
              id="inventory-control"
              className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm space-y-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0F766E]">
                <Boxes className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Multi-Batch & Expiry Control</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Track multiple lots per medicine brand. Automatic quarantine for expired medicines, 90-day expiry threshold alerts, stock adjustment logs, and zero negative stock enforcement.
              </p>
              <Link
                href="/inventory"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline"
              >
                <span>Explore Inventory</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Module 3: Demand Predictor */}
            <div
              id="forecasting"
              className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm space-y-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0F766E]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Demand Forecasting Algorithm</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Deterministic inventory velocity calculator using 30-day run rates, lead times, and safety buffers to generate exact PO replenishment quantities before stockouts occur.
              </p>
              <Link
                href="/predictor"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline"
              >
                <span>Review Forecast Engine</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Module 4: Sales Invoices & Refunds */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0F766E]">
                <Printer className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Tax Invoices & Returns</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Full sales history log with filtering by payment mode (UPI, Cash, Card) and date range. Consistent refund workflows that simultaneously restock batch inventory.
              </p>
              <Link
                href="/sales"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline"
              >
                <span>View Sales History</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Module 5: Analytics & Reports */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0F766E]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Visual Analytics & Reports</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Revenue trends, daily & monthly sales volume, top dispensing medicines, therapeutic category breakdowns, and average basket sizes presented in solid, high-contrast charts.
              </p>
              <Link
                href="/analytics"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline"
              >
                <span>Open Analytics</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Module 6: First-Time Onboarding */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0F766E]">
                <Building2 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">3-Step Pharmacy Onboarding</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Guided setup wizard to record pharmacy drug licenses, contact information, store capacity, and initial opening stock before terminal activation.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline"
              >
                <span>Launch Onboarding Wizard</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4-STEP WORKFLOW WALKTHROUGH */}
      <section className="py-14 sm:py-16 bg-[#FFFFFF] border-b border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Workflow Simplicity
            </h2>
            <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#1F2937]">
              From Receiving Stock to Patient Dispensing
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-[#E2E8F0] p-4 text-xs space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0F766E] text-white font-bold text-xs">
                1
              </div>
              <div className="font-bold text-[#1F2937] text-sm">Register Store & Batches</div>
              <p className="text-[#64748B] leading-relaxed">
                Log medicine brand, salt composition, lot number, manufacturer, purchase and selling MRP, and expiry dates.
              </p>
            </div>

            <div className="rounded-lg border border-[#E2E8F0] p-4 text-xs space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0F766E] text-white font-bold text-xs">
                2
              </div>
              <div className="font-bold text-[#1F2937] text-sm">Scan & Ring Up Sales</div>
              <p className="text-[#64748B] leading-relaxed">
                Add prescribed lines to the POS cart with real-time stock limits, apply optional discounts, and calculate GST.
              </p>
            </div>

            <div className="rounded-lg border border-[#E2E8F0] p-4 text-xs space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0F766E] text-white font-bold text-xs">
                3
              </div>
              <div className="font-bold text-[#1F2937] text-sm">Print Tax Invoice</div>
              <p className="text-[#64748B] leading-relaxed">
                Complete checkout with UPI, Cash, or Card. Generate printable receipts while inventory atomically deducts.
              </p>
            </div>

            <div className="rounded-lg border border-[#E2E8F0] p-4 text-xs space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0F766E] text-white font-bold text-xs">
                4
              </div>
              <div className="font-bold text-[#1F2937] text-sm">Replenish with Forecasts</div>
              <p className="text-[#64748B] leading-relaxed">
                Consult the demand predictor for suggested purchase quantities to avoid capital lockup and stockouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-14 sm:py-16 bg-[#F0FDFA] border-b border-[#CCFBF1]">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#0F766E] text-white mx-auto">
            <Pill className="h-6 w-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937]">
            Ready to Explore the Pharmacy Terminal?
          </h2>

          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Test the entire frontend demo in your browser. All inventory adjustments, billing sales, returns, and forecasts operate reactively with local persistence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="rounded bg-[#0F766E] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#115E59] transition-colors"
            >
              Get Started (Register Store)
            </Link>
            <Link
              href="/dashboard"
              className="rounded border border-[#0F766E] bg-white px-6 py-2.5 text-xs sm:text-sm font-bold text-[#0F766E] hover:bg-[#F0FDFA] transition-colors"
            >
              Open Live Dashboard
            </Link>
            <Link
              href="/login"
              className="rounded border border-[#E2E8F0] bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#4B5563] hover:bg-[#F8FAFC]"
            >
              Terminal Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#FFFFFF] py-8 text-xs text-[#64748B]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0F766E] text-white">
              <Pill className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-[#1F2937]">ApexCare Rx Terminal</span>
            <span className="text-[#94A3B8]">| Pharmacy Inventory & Point of Sale System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/dashboard" className="hover:text-[#0F766E]">
              Dashboard
            </Link>
            <Link href="/inventory" className="hover:text-[#0F766E]">
              Inventory
            </Link>
            <Link href="/billing" className="hover:text-[#0F766E]">
              POS Billing
            </Link>
            <Link href="/predictor" className="hover:text-[#0F766E]">
              Predictor
            </Link>
            <Link href="/settings" className="hover:text-[#0F766E]">
              Settings
            </Link>
          </div>

          <div className="text-[11px] text-[#94A3B8]">
            Frontend Prototype • High-Contrast White & Teal Design
          </div>
        </div>
      </footer>
    </div>
  );
}
