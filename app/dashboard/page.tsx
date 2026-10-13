"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  ExternalLink,
  Calendar,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { usePharmacy } from "@/lib/pharmacy-context";
import { formatINR, formatCompactINR, formatDate, formatDateTime, getExpiryStatus } from "@/lib/calculations";
import { BatchItem, MedicineCategory } from "@/lib/types";

export default function DashboardPage() {
  const {
    kpiStats,
    invoices,
    batches,
    medicineSummaries,
    addBatch,
  } = usePharmacy();

  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "year">("7d");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);

  // New Batch Form State
  const [newBatchData, setNewBatchData] = useState({
    medicineName: "",
    genericName: "",
    category: "Antibiotics" as MedicineCategory,
    manufacturer: "",
    batchNumber: "",
    quantity: 60,
    purchasePrice: 45,
    sellingPrice: 70,
    expiryDate: "2027-10-31",
    reorderThreshold: 15,
  });

  // Calculate Sales Chart data based on invoices + mock trend
  const salesChartData = useMemo(() => {
    if (timeFilter === "7d") {
      return [
        { label: "Mon", revenue: 4200, orders: 14 },
        { label: "Tue", revenue: 5800, orders: 19 },
        { label: "Wed", revenue: 3950, orders: 12 },
        { label: "Thu", revenue: 7100, orders: 24 },
        { label: "Fri", revenue: 6450, orders: 21 },
        { label: "Sat", revenue: 8900, orders: 31 },
        {
          label: "Sun (Today)",
          revenue: Math.max(kpiStats.todaySales, 3850),
          orders: Math.max(kpiStats.todayInvoicesCount, 15),
        },
      ];
    } else if (timeFilter === "30d") {
      return [
        { label: "Week 1", revenue: 34200, orders: 110 },
        { label: "Week 2", revenue: 41800, orders: 135 },
        { label: "Week 3", revenue: 38900, orders: 122 },
        { label: "Week 4", revenue: 46500, orders: 154 },
      ];
    } else {
      return [
        { label: "May", revenue: 145000, orders: 480 },
        { label: "Jun", revenue: 162000, orders: 530 },
        { label: "Jul", revenue: 158000, orders: 510 },
        { label: "Aug", revenue: 179000, orders: 590 },
        { label: "Sep", revenue: 184000, orders: 620 },
        { label: "Oct", revenue: 192000, orders: 640 },
      ];
    }
  }, [timeFilter, kpiStats.todaySales, kpiStats.todayInvoicesCount]);

  // Top selling medicines derived from invoices
  const topSellingMedicines = useMemo(() => {
    const map = new Map<string, { name: string; category: string; units: number; revenue: number }>();
    invoices.forEach((inv) => {
      if (inv.paymentStatus === "Completed") {
        inv.items.forEach((item) => {
          const key = item.medicineName;
          const current = map.get(key) || { name: key, category: "General", units: 0, revenue: 0 };
          map.set(key, {
            name: key,
            category: "Pharma",
            units: current.units + item.quantity,
            revenue: current.revenue + item.total,
          });
        });
      }
    });

    const list = Array.from(map.values());
    if (list.length < 5) {
      // Seed with realistic standard items if fresh store
      return [
        { name: "Dolo 650 Tablet", category: "Analgesics & Pain", units: 142, revenue: 4544 },
        { name: "Augmentin 625 Duo", category: "Antibiotics", units: 68, revenue: 13702 },
        { name: "Pan 40 Tablet", category: "Gastrointestinal", units: 94, revenue: 14570 },
        { name: "Glycomet 500 SR", category: "Antidiabetics", units: 120, revenue: 5100 },
        { name: "Montair LC", category: "Respiratory", units: 52, revenue: 11960 },
      ];
    }
    return list.sort((a, b) => b.units - a.units).slice(0, 5);
  }, [invoices]);

  // Low stock items
  const lowStockBatches = useMemo(() => {
    return batches
      .filter((b) => b.quantity <= b.reorderThreshold)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
  }, [batches]);

  // Expiring soon or expired batches
  const expiringBatches = useMemo(() => {
    return batches
      .filter((b) => {
        const status = getExpiryStatus(b.expiryDate, 90);
        return status === "expiring-soon" || status === "expired";
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
      .slice(0, 5);
  }, [batches]);

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchData.medicineName || !newBatchData.batchNumber) return;

    addBatch({
      medicineId: `med-${Date.now()}`,
      medicineName: newBatchData.medicineName,
      genericName: newBatchData.genericName || newBatchData.medicineName,
      category: newBatchData.category,
      manufacturer: newBatchData.manufacturer || "Generic Pharma",
      batchNumber: newBatchData.batchNumber,
      quantity: Number(newBatchData.quantity),
      purchasePrice: Number(newBatchData.purchasePrice),
      sellingPrice: Number(newBatchData.sellingPrice),
      expiryDate: newBatchData.expiryDate,
      reorderThreshold: Number(newBatchData.reorderThreshold),
    });

    setIsAddBatchOpen(false);
    setNewBatchData({
      medicineName: "",
      genericName: "",
      category: "Antibiotics",
      manufacturer: "",
      batchNumber: "",
      quantity: 60,
      purchasePrice: 45,
      sellingPrice: 70,
      expiryDate: "2027-10-31",
      reorderThreshold: 15,
    });
  };

  return (
    <AppShell pageTitle="Operational Dashboard">
      <div className="space-y-6">
        {/* Welcome & Quick Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-[#1F2937]">Store Summary & Real-Time Metrics</h2>
            <p className="text-xs text-[#64748B]">
              Terminal ready • Dispensing active • Local database synchronized
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddBatchOpen(true)}
              className="flex items-center gap-1.5 rounded border border-[#0F766E] bg-[#F0FDFA] px-3 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Stock / Batch</span>
            </button>
            <Link
              href="/billing"
              className="flex items-center gap-1.5 rounded bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59]"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Open POS Billing</span>
            </Link>
          </div>
        </div>

        {/* 4 Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Today's Sales */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Today's Sales</span>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#F0FDFA] text-[#0F766E]">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-[#1F2937]">
              {formatINR(kpiStats.todaySales || 1845.85)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#15803D]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="font-semibold">+8.4%</span>
              <span className="text-[#64748B]">vs yesterday ({kpiStats.todayInvoicesCount} bills)</span>
            </div>
          </div>

          {/* KPI 2: Active Medicines */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Product SKUs / Batches</span>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#F8FAFC] text-[#4B5563]">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-[#1F2937]">
              {medicineSummaries.length} <span className="text-xs font-normal text-[#64748B]">({batches.length} batches)</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-[#64748B]">
              <span>Active catalog in inventory</span>
            </div>
          </div>

          {/* KPI 3: Low Stock Items */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Low Stock Warning</span>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FEF3C7] text-[#B45309]">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-[#B45309]">
              {kpiStats.lowStockCount} <span className="text-xs font-normal text-[#64748B]">batches</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#64748B]">Below safety threshold</span>
              <Link href="/inventory?filter=low-stock" className="text-[#0F766E] font-medium hover:underline">
                View &rarr;
              </Link>
            </div>
          </div>

          {/* KPI 4: Expiring Batches */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Expiring Batches</span>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FEE2E2] text-[#B91C1C]">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-[#B91C1C]">
              {kpiStats.expiringBatchesCount + kpiStats.expiredBatchesCount} <span className="text-xs font-normal text-[#64748B]">batches</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#64748B]">Within 90 days or expired</span>
              <Link href="/inventory?filter=expiring-soon" className="text-[#0F766E] font-medium hover:underline">
                Review &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Charts and Highlights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Sales Revenue Chart */}
          <div className="lg:col-span-2 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-3 mb-4 gap-2">
              <div>
                <h3 className="text-xs font-bold text-[#1F2937]">Sales Revenue Performance</h3>
                <p className="text-[11px] text-[#64748B]">Track revenue and dispensed transaction volume</p>
              </div>

              {/* Chart Controls */}
              <div className="flex items-center gap-2">
                <div className="flex rounded border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 text-xs">
                  <button
                    onClick={() => setChartType("bar")}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                      chartType === "bar" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
                    }`}
                  >
                    Bars
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                      chartType === "line" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
                    }`}
                  >
                    Line
                  </button>
                </div>

                <div className="flex rounded border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 text-xs">
                  <button
                    onClick={() => setTimeFilter("7d")}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                      timeFilter === "7d" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setTimeFilter("30d")}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                      timeFilter === "30d" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
                    }`}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => setTimeFilter("year")}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                      timeFilter === "year" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
                    }`}
                  >
                    6 Months
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Component (Solid Colors only, NO gradients per guidelines) */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#E2E8F0" }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatINR(val), "Revenue"]}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="revenue" fill="#0F766E" radius={[2, 2, 0, 0]} maxBarSize={45} />
                  </BarChart>
                ) : (
                  <LineChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#E2E8F0" }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatINR(val), "Revenue"]}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0F766E"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#0F766E" }}
                      activeDot={{ r: 5, fill: "#115E59" }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right 1 Col: Top Selling Medicines */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-3">
                <h3 className="text-xs font-bold text-[#1F2937]">Top Selling Medicines</h3>
                <span className="text-[10px] text-[#64748B]">By Units Dispensed</span>
              </div>

              <div className="space-y-3">
                {topSellingMedicines.map((med, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-[#1F2937] truncate">{med.name}</div>
                      <div className="text-[10px] text-[#64748B]">{med.units} units sold</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-[#0F766E]">{formatINR(med.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-[#E2E8F0] pt-3 text-center">
              <Link href="/analytics" className="text-xs font-semibold text-[#0F766E] hover:underline">
                View In-depth Sales Analytics &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Secondary Operational Tables: Recent Sales & Low Stock / Expiry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales Transactions */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#0F766E]" />
                <h3 className="text-xs font-bold text-[#1F2937]">Recent Sales Transactions</h3>
              </div>
              <Link href="/sales" className="text-xs font-medium text-[#0F766E] hover:underline">
                Full History &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B]">
                    <th className="py-2 px-2">Invoice #</th>
                    <th className="py-2 px-2">Customer</th>
                    <th className="py-2 px-2">Method</th>
                    <th className="py-2 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-2 font-mono text-[11px] text-[#0F766E] font-medium">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-medium text-[#1F2937]">{inv.customerName}</div>
                        <div className="text-[10px] text-[#64748B]">{inv.items.length} items</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#475569]">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-[#1F2937]">
                        {formatINR(inv.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Alerts: Low Stock & Approaching Expiry */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#B45309]" />
                <h3 className="text-xs font-bold text-[#1F2937]">Inventory Alerts (Low Stock & Expiry)</h3>
              </div>
              <Link href="/inventory" className="text-xs font-medium text-[#0F766E] hover:underline">
                Manage All &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {/* Show Low Stock items */}
              {lowStockBatches.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase text-[#B45309] mb-1.5">
                    Critical Low Stock:
                  </div>
                  <div className="space-y-1.5">
                    {lowStockBatches.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded border border-[#FEF3C7] bg-[#FFFBEB] p-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#92400E]">{b.medicineName}</span>
                          <span className="ml-1 text-[11px] text-[#B45309]">({b.batchNumber})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[#FDE68A] px-2 py-0.5 text-[11px] font-bold text-[#78350F]">
                            {b.quantity} Left (Min {b.reorderThreshold})
                          </span>
                          <Link
                            href="/inventory"
                            className="text-[11px] font-medium text-[#0F766E] underline"
                          >
                            Restock
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Expiring Batches */}
              {expiringBatches.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold uppercase text-[#B91C1C] mb-1.5">
                    Expiring or Expired Batches:
                  </div>
                  <div className="space-y-1.5">
                    {expiringBatches.slice(0, 3).map((b) => {
                      const isExp = getExpiryStatus(b.expiryDate) === "expired";
                      return (
                        <div
                          key={b.id}
                          className={`flex items-center justify-between rounded border p-2 text-xs ${
                            isExp
                              ? "border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]"
                              : "border-[#FED7AA] bg-[#FFF7ED] text-[#9A3412]"
                          }`}
                        >
                          <div>
                            <span className="font-semibold">{b.medicineName}</span>
                            <span className="ml-1 text-[10px]">Batch: {b.batchNumber}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[11px]">
                              {isExp ? "EXPIRED" : `Exp: ${b.expiryDate}`}
                            </span>
                            <div className="text-[10px]">{b.quantity} units</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Batch Modal from Dashboard */}
      {isAddBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#1F2937]">Receive Stock / Add Medicine Batch</h3>
              <button
                onClick={() => setIsAddBatchOpen(false)}
                className="text-[#64748B] hover:text-[#1F2937]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Medicine Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dolo 650"
                    value={newBatchData.medicineName}
                    onChange={(e) => setNewBatchData({ ...newBatchData, medicineName: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Generic Name / Salt</label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol 650mg"
                    value={newBatchData.genericName}
                    onChange={(e) => setNewBatchData({ ...newBatchData, genericName: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-2024-909"
                    value={newBatchData.batchNumber}
                    onChange={(e) => setNewBatchData({ ...newBatchData, batchNumber: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Micro Labs"
                    value={newBatchData.manufacturer}
                    onChange={(e) => setNewBatchData({ ...newBatchData, manufacturer: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBatchData.quantity}
                    onChange={(e) => setNewBatchData({ ...newBatchData, quantity: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBatchData.purchasePrice}
                    onChange={(e) => setNewBatchData({ ...newBatchData, purchasePrice: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newBatchData.sellingPrice}
                    onChange={(e) => setNewBatchData({ ...newBatchData, sellingPrice: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newBatchData.expiryDate}
                    onChange={(e) => setNewBatchData({ ...newBatchData, expiryDate: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={newBatchData.reorderThreshold}
                    onChange={(e) => setNewBatchData({ ...newBatchData, reorderThreshold: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddBatchOpen(false)}
                  className="rounded border border-[#E2E8F0] px-3.5 py-1.5 text-xs text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#0F766E] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59]"
                >
                  Save & Add Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
