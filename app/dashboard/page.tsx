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
  ShoppingBag,
  CheckCircle2,
  X,
  Radio,
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
    isRealtimeConnected,
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
    quantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    expiryDate: "",
    reorderThreshold: 10,
  });

  // Calculate REAL Sales Chart data strictly derived from real invoices
  const salesChartData = useMemo(() => {
    const now = new Date();

    if (timeFilter === "7d") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const result = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        const dayName = days[d.getDay()];
        const isToday = i === 0;

        const dayInvoices = invoices.filter(
          (inv) => inv.paymentStatus === "Completed" && inv.date.startsWith(dayStr)
        );

        const revenue = dayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        result.push({
          label: isToday ? `${dayName} (Today)` : dayName,
          revenue,
          orders: dayInvoices.length,
        });
      }
      return result;
    } else if (timeFilter === "30d") {
      // 4 week segments
      const result = [];
      for (let w = 4; w >= 1; w--) {
        const startDay = new Date(now);
        startDay.setDate(startDay.getDate() - w * 7);
        const endDay = new Date(now);
        endDay.setDate(endDay.getDate() - (w - 1) * 7);

        const weekInvoices = invoices.filter((inv) => {
          if (inv.paymentStatus !== "Completed") return false;
          const invDate = new Date(inv.date);
          return invDate >= startDay && invDate < endDay;
        });

        const revenue = weekInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        result.push({
          label: `Week ${5 - w}`,
          revenue,
          orders: weekInvoices.length,
        });
      }
      return result;
    } else {
      // Last 6 calendar months
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const result = [];
      for (let m = 5; m >= 0; m--) {
        const target = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const monthKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;

        const monthInvoices = invoices.filter(
          (inv) => inv.paymentStatus === "Completed" && inv.date.startsWith(monthKey)
        );

        const revenue = monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        result.push({
          label: monthNames[target.getMonth()],
          revenue,
          orders: monthInvoices.length,
        });
      }
      return result;
    }
  }, [timeFilter, invoices]);

  // Top selling medicines derived STRICTLY from real user invoices
  const topSellingMedicines = useMemo(() => {
    const map = new Map<string, { name: string; units: number; revenue: number }>();

    invoices.forEach((inv) => {
      if (inv.paymentStatus === "Completed") {
        inv.items.forEach((item) => {
          const key = item.medicineName;
          const cur = map.get(key) || { name: key, units: 0, revenue: 0 };
          map.set(key, {
            name: key,
            units: cur.units + item.quantity,
            revenue: cur.revenue + item.total,
          });
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [invoices]);

  // Low stock items based on actual batches
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

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchData.medicineName || !newBatchData.batchNumber) return;

    await addBatch({
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
      quantity: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      expiryDate: "",
      reorderThreshold: 10,
    });
  };

  return (
    <AppShell pageTitle="Operational Dashboard">
      <div className="space-y-6">
        {/* Welcome & Quick Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1F2937]">Store Summary & Real-Time Metrics</h2>
              {isRealtimeConnected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 text-[10px] font-semibold text-[#15803D]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#15803D] animate-ping" />
                  Live Sync Active
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              Real-time POS dispensing, cloud-synchronized inventory, and live transaction ledger
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
              {formatINR(kpiStats.todaySales)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#64748B]">
              <TrendingUp className="h-3.5 w-3.5 text-[#0F766E]" />
              <span>
                {kpiStats.todayInvoicesCount === 0
                  ? "No bills processed today"
                  : `${kpiStats.todayInvoicesCount} bill${kpiStats.todayInvoicesCount > 1 ? "s" : ""} generated`}
              </span>
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
              {medicineSummaries.length}{" "}
              <span className="text-xs font-normal text-[#64748B]">({batches.length} batches)</span>
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
              {kpiStats.expiringBatchesCount + kpiStats.expiredBatchesCount}{" "}
              <span className="text-xs font-normal text-[#64748B]">batches</span>
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
                <h3 className="text-xs font-bold text-[#1F2937]">Real-Time Sales Revenue Performance</h3>
                <p className="text-[11px] text-[#64748B]">
                  Live transaction data generated from completed sales bills
                </p>
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
                    This Year
                  </button>
                </div>
              </div>
            </div>

            {/* Render Recharts Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <Bar dataKey="revenue" fill="#0F766E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                ) : (
                  <LineChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <span className="text-[10px] text-[#64748B]">Real Sales</span>
              </div>

              {topSellingMedicines.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  <ShoppingBag className="mx-auto mb-2 h-7 w-7 text-[#CBD5E1]" />
                  No sales recorded yet.<br />
                  Bills completed in POS will appear here live.
                </div>
              ) : (
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
              )}
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
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-[#94A3B8]">
                        No billing transactions completed yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.slice(0, 5).map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-2 font-mono text-[11px] text-[#0F766E] font-medium">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-[#1F2937]">{inv.customerName}</div>
                          <div className="text-[10px] text-[#64748B]">{formatDate(inv.date)}</div>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="rounded bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 text-[10px] font-medium text-[#4B5563]">
                            {inv.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold text-[#1F2937]">
                          {formatINR(inv.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Alerts: Low Stock & Expiring Batches */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#B45309]" />
                <h3 className="text-xs font-bold text-[#1F2937]">Stock Level & Expiry Alerts</h3>
              </div>
              <Link href="/inventory" className="text-xs font-medium text-[#0F766E] hover:underline">
                Manage Stock &rarr;
              </Link>
            </div>

            <div className="space-y-4">
              {/* Low Stock Subtable */}
              <div>
                <div className="text-[11px] font-semibold text-[#B45309] uppercase tracking-wider mb-1.5">
                  Critical Low Stock ({lowStockBatches.length})
                </div>
                {lowStockBatches.length === 0 ? (
                  <div className="rounded border border-[#BBF7D0] bg-[#F0FDF4] p-2.5 text-xs text-[#15803D] flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>All medicine stock levels are currently healthy.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9] rounded border border-[#E2E8F0]">
                    {lowStockBatches.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2 text-xs">
                        <div>
                          <div className="font-semibold text-[#1F2937]">{b.medicineName}</div>
                          <div className="text-[10px] text-[#64748B]">Batch: {b.batchNumber}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#B45309]">{b.quantity} left</span>
                          <span className="text-[10px] text-[#64748B] block">Min: {b.reorderThreshold}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expiring Soon Subtable */}
              <div>
                <div className="text-[11px] font-semibold text-[#B91C1C] uppercase tracking-wider mb-1.5">
                  Expiring Within 90 Days ({expiringBatches.length})
                </div>
                {expiringBatches.length === 0 ? (
                  <div className="rounded border border-[#BBF7D0] bg-[#F0FDF4] p-2.5 text-xs text-[#15803D] flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>No batches expiring soon.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9] rounded border border-[#E2E8F0]">
                    {expiringBatches.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2 text-xs">
                        <div>
                          <div className="font-semibold text-[#1F2937]">{b.medicineName}</div>
                          <div className="text-[10px] text-[#64748B] font-mono">{b.batchNumber}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-[#B91C1C]">{b.expiryDate}</span>
                          <span className="text-[10px] text-[#64748B] block">{b.quantity} units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Batch Modal */}
      {isAddBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#1F2937]">Add Medicine Batch to Inventory</h3>
              <button
                onClick={() => setIsAddBatchOpen(false)}
                className="rounded p-1 text-[#64748B] hover:bg-[#F8FAFC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Medicine Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500"
                  value={newBatchData.medicineName}
                  onChange={(e) => setNewBatchData({ ...newBatchData, medicineName: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Generic / Chemical</label>
                  <input
                    type="text"
                    placeholder="Composition"
                    value={newBatchData.genericName}
                    onChange={(e) => setNewBatchData({ ...newBatchData, genericName: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="Pharma Brand"
                    value={newBatchData.manufacturer}
                    onChange={(e) => setNewBatchData({ ...newBatchData, manufacturer: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BT-2024-01"
                    value={newBatchData.batchNumber}
                    onChange={(e) => setNewBatchData({ ...newBatchData, batchNumber: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBatchData.quantity || ""}
                    onChange={(e) => setNewBatchData({ ...newBatchData, quantity: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Purchase (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newBatchData.purchasePrice || ""}
                    onChange={(e) => setNewBatchData({ ...newBatchData, purchasePrice: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">MRP / Sell (₹) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={newBatchData.sellingPrice || ""}
                    onChange={(e) => setNewBatchData({ ...newBatchData, sellingPrice: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddBatchOpen(false)}
                  className="rounded border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#0F766E] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59]"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
