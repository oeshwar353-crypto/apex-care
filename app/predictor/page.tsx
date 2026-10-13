"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Search,
  Filter,
  Info,
  AlertTriangle,
  CheckCircle2,
  Package,
  Clock,
  ArrowRight,
  Eye,
  Sliders,
  HelpCircle,
  X,
  FileCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { usePharmacy } from "@/lib/pharmacy-context";
import { DemandPrediction, MedicineCategory } from "@/lib/types";

export default function DemandPredictorPage() {
  const { demandPredictions } = usePharmacy();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activePrediction, setActivePrediction] = useState<DemandPrediction | null>(null);

  // Filtered recommendations
  const filteredPredictions = useMemo(() => {
    return demandPredictions.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        item.medicineName.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter !== "all" && item.recommendationStatus !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;

      return true;
    });
  }, [demandPredictions, searchTerm, statusFilter, categoryFilter]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    demandPredictions.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [demandPredictions]);

  // Aggregate stats
  const immediateReorders = demandPredictions.filter((p) => p.recommendationStatus === "Immediate Reorder");
  const orderSoon = demandPredictions.filter((p) => p.recommendationStatus === "Order Soon");
  const overstocked = demandPredictions.filter((p) => p.recommendationStatus === "Overstocked");

  return (
    <AppShell pageTitle="Demand Forecasting & Reorder Predictor">
      <div className="space-y-6">
        {/* Transparent Methodology & Disclaimer Banner */}
        <div className="rounded-lg border border-[#CCFBF1] bg-[#F0FDFA] p-4 text-xs text-[#0F766E] shadow-sm">
          <div className="flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-[#0F766E]">
                Deterministic Inventory Run-Rate Algorithm (Demo Estimate)
              </div>
              <p className="text-[#134E4A] leading-relaxed">
                This interface uses a transparent operational replenishment formula based on 30-day dispensing velocity, supplier lead-time (5 days), and a 7-day safety buffer:
                <br />
                <span className="font-mono font-semibold bg-white/70 px-1.5 py-0.5 rounded border border-[#CCFBF1] inline-block my-1">
                  Suggested Reorder Qty = max(0, (Daily Velocity × Lead Time) + Safety Stock − Available Units)
                </span>
                <br />
                <span className="text-[11px] text-[#64748B]">
                  * Illustrative estimation tool designed for retail inventory workflows; does not substitute certified clinical supply-chain judgment.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Immediate Reorders Required</span>
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#FEF2F2] text-[#B91C1C]">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-[#B91C1C]">
              {immediateReorders.length} <span className="text-xs font-normal text-[#64748B]">medicines</span>
            </div>
            <p className="mt-1 text-[11px] text-[#64748B]">Stock depleted or below critical lead-time demand</p>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Order Soon / Watchlist</span>
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#FEF3C7] text-[#B45309]">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-[#B45309]">
              {orderSoon.length} <span className="text-xs font-normal text-[#64748B]">medicines</span>
            </div>
            <p className="mt-1 text-[11px] text-[#64748B]">Depletion projected within 10–14 business days</p>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Overstocked / Freeze PO</span>
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#F8FAFC] text-[#475569]">
                <Package className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-[#475569]">
              {overstocked.length} <span className="text-xs font-normal text-[#64748B]">medicines</span>
            </div>
            <p className="mt-1 text-[11px] text-[#64748B]">Excess stock exceeding 75 days of projected run-rate</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search brand, generic name, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="all">All Recommendation Statuses</option>
                <option value="Immediate Reorder">Immediate Reorder</option>
                <option value="Order Soon">Order Soon</option>
                <option value="Adequate Stock">Adequate Stock</option>
                <option value="Overstocked">Overstocked</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Demand Forecasting Table */}
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B]">
                  <th className="py-3 px-3">Medicine & Generic</th>
                  <th className="py-3 px-3 text-right">Current Stock</th>
                  <th className="py-3 px-3 text-right">30-Day Sales</th>
                  <th className="py-3 px-3 text-right">Est. 30d Demand</th>
                  <th className="py-3 px-3 text-right">Lead Time</th>
                  <th className="py-3 px-3 text-right">Suggested Order</th>
                  <th className="py-3 px-3">Expiry Risk</th>
                  <th className="py-3 px-3">Status Recommendation</th>
                  <th className="py-3 px-3 text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredPredictions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-[#64748B]">
                      No medicines match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredPredictions.map((pred) => (
                    <tr key={pred.medicineId} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1F2937]">{pred.medicineName}</div>
                        <div className="text-[10px] text-[#64748B]">{pred.genericName}</div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-semibold ${
                            pred.currentStock === 0
                              ? "text-[#B91C1C]"
                              : pred.currentStock < 20
                              ? "text-[#B45309]"
                              : "text-[#1F2937]"
                          }`}
                        >
                          {pred.currentStock}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-[#4B5563]">
                        {pred.unitsSoldPast30Days} units
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-[#1F2937]">
                        ~{pred.forecastDemandNext30Days}
                      </td>

                      <td className="py-3 px-3 text-right text-[#64748B]">
                        {pred.leadTimeDays} days
                      </td>

                      <td className="py-3 px-3 text-right">
                        {pred.suggestedReorderQty > 0 ? (
                          <span className="font-bold text-[#0F766E]">
                            +{pred.suggestedReorderQty} units
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">0</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            pred.expiryRisk === "High"
                              ? "bg-[#FEE2E2] text-[#B91C1C]"
                              : pred.expiryRisk === "Medium"
                              ? "bg-[#FEF3C7] text-[#B45309]"
                              : "bg-[#F0FDF4] text-[#15803D]"
                          }`}
                        >
                          {pred.expiryRisk} Risk
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {pred.recommendationStatus === "Immediate Reorder" ? (
                          <span className="inline-flex items-center gap-1 rounded border border-[#FECACA] bg-[#FEF2F2] px-2 py-0.5 text-[10px] font-bold text-[#B91C1C]">
                            Immediate Reorder
                          </span>
                        ) : pred.recommendationStatus === "Order Soon" ? (
                          <span className="inline-flex items-center gap-1 rounded border border-[#FDE68A] bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#B45309]">
                            Order Soon
                          </span>
                        ) : pred.recommendationStatus === "Overstocked" ? (
                          <span className="inline-flex items-center gap-1 rounded border border-[#E2E8F0] bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">
                            Overstocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-semibold text-[#15803D]">
                            Adequate Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setActivePrediction(pred)}
                          className="rounded border border-[#E2E8F0] bg-white px-2 py-1 text-[11px] font-semibold text-[#0F766E] hover:bg-[#F0FDFA]"
                          title="View Formula & Rationale Breakdown"
                        >
                          Rationale
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rationale & Formula Breakdown Side Drawer */}
      {activePrediction && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-md bg-[#FFFFFF] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">{activePrediction.medicineName}</h3>
                  <span className="text-xs text-[#64748B]">{activePrediction.genericName}</span>
                </div>
                <button onClick={() => setActivePrediction(null)} className="text-[#64748B] hover:text-[#1F2937]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Recommendation Summary */}
                <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-1">
                  <div className="font-semibold text-[#1F2937]">Status Recommendation:</div>
                  <div className="text-xs font-bold text-[#0F766E]">{activePrediction.recommendationStatus}</div>
                  <p className="text-[11px] text-[#64748B] mt-1">{activePrediction.rationale}</p>
                </div>

                {/* Mathematical Run-down */}
                <div className="rounded border border-[#E2E8F0] p-3 space-y-2">
                  <div className="font-bold text-[11px] text-[#1F2937] uppercase">Replenishment Formula Inputs</div>
                  <div className="flex justify-between border-b border-[#F1F5F9] pb-1">
                    <span className="text-[#64748B]">Units Sold (30-day window):</span>
                    <span className="font-semibold">{activePrediction.unitsSoldPast30Days} units</span>
                  </div>
                  <div className="flex justify-between border-b border-[#F1F5F9] pb-1">
                    <span className="text-[#64748B]">Daily Run Rate (Velocity):</span>
                    <span className="font-semibold">
                      {(activePrediction.unitsSoldPast30Days / 30).toFixed(2)} units / day
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#F1F5F9] pb-1">
                    <span className="text-[#64748B]">Supplier Lead Time Demand (5d):</span>
                    <span className="font-semibold">
                      ~{Math.round((activePrediction.unitsSoldPast30Days / 30) * activePrediction.leadTimeDays)} units
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#F1F5F9] pb-1">
                    <span className="text-[#64748B]">Safety Buffer Required:</span>
                    <span className="font-semibold">{activePrediction.safetyStock} units</span>
                  </div>
                  <div className="flex justify-between border-b border-[#F1F5F9] pb-1">
                    <span className="text-[#64748B]">Available On-Shelf Stock:</span>
                    <span className="font-bold text-[#B45309]">{activePrediction.currentStock} units</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-sm text-[#0F766E]">
                    <span>Suggested Order Quantity:</span>
                    <span>+{activePrediction.suggestedReorderQty} units</span>
                  </div>
                </div>

                {/* Statistical Confidence */}
                <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-1">
                  <div className="font-semibold text-[#1F2937]">Confidence Level:</div>
                  <div className="text-[11px] text-[#64748B]">{activePrediction.confidence}</div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-4 mt-6">
              <button
                onClick={() => setActivePrediction(null)}
                className="w-full rounded bg-[#0F766E] py-2 text-xs font-semibold text-white hover:bg-[#115E59]"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
