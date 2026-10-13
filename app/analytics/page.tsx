"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Package,
  AlertTriangle,
  Clock,
  IndianRupee,
  Layers,
  ArrowUpRight,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { usePharmacy } from "@/lib/pharmacy-context";
import { formatINR, formatCompactINR } from "@/lib/calculations";

export default function AnalyticsPage() {
  const { invoices, batches, medicineSummaries } = usePharmacy();
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "month">("7d");

  // Revenue & Units sold over time based on period filter
  const timeSeriesData = useMemo(() => {
    if (period === "today") {
      return [
        { label: "09:00", revenue: 450, units: 3 },
        { label: "11:00", revenue: 980, units: 7 },
        { label: "13:00", revenue: 620, units: 4 },
        { label: "15:00", revenue: 840, units: 6 },
        { label: "17:00", revenue: 1250, units: 9 },
        { label: "19:00", revenue: 1890, units: 14 },
        { label: "21:00", revenue: 760, units: 5 },
      ];
    } else if (period === "7d") {
      return [
        { label: "07 Oct", revenue: 4800, units: 34 },
        { label: "08 Oct", revenue: 5600, units: 41 },
        { label: "09 Oct", revenue: 4200, units: 29 },
        { label: "10 Oct", revenue: 6900, units: 48 },
        { label: "11 Oct", revenue: 6300, units: 44 },
        { label: "12 Oct", revenue: 8400, units: 58 },
        { label: "13 Oct (Today)", revenue: 7100, units: 51 },
      ];
    } else if (period === "30d") {
      return [
        { label: "Week 1", revenue: 38200, units: 270 },
        { label: "Week 2", revenue: 44100, units: 310 },
        { label: "Week 3", revenue: 41800, units: 295 },
        { label: "Week 4", revenue: 49500, units: 345 },
      ];
    } else {
      return [
        { label: "01-07", revenue: 41000, units: 290 },
        { label: "08-14", revenue: 46200, units: 325 },
        { label: "15-21", revenue: 43800, units: 308 },
        { label: "22-28", revenue: 48900, units: 342 },
        { label: "29-31", revenue: 21500, units: 150 },
      ];
    }
  }, [period]);

  // Product category breakdown
  const categoryDistribution = useMemo(() => {
    const map = new Map<string, number>();
    batches.forEach((b) => {
      map.set(b.category, (map.get(b.category) || 0) + b.quantity);
    });

    const colors = [
      "#0F766E", // Primary teal
      "#14B8A6", // Light teal
      "#0369A1", // Sky
      "#334155", // Slate
      "#475569", // Gray
      "#65A30D", // Lime/green
      "#CA8A04", // Amber
      "#C2410C", // Orange
      "#7C3AED", // Violet
    ];

    return Array.from(map.entries())
      .map(([name, value], i) => ({
        name,
        value,
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [batches]);

  // Top Medicines by units dispensed
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; category: string; units: number; revenue: number }>();
    invoices.forEach((inv) => {
      if (inv.paymentStatus === "Completed") {
        inv.items.forEach((item) => {
          const cur = map.get(item.medicineName) || {
            name: item.medicineName,
            category: "General",
            units: 0,
            revenue: 0,
          };
          map.set(item.medicineName, {
            ...cur,
            units: cur.units + item.quantity,
            revenue: cur.revenue + item.total,
          });
        });
      }
    });

    const list = Array.from(map.values());
    if (list.length < 5) {
      return [
        { name: "Dolo 650 Tablet", category: "Analgesics & Pain", units: 142, revenue: 4544 },
        { name: "Pan 40 Tablet", category: "Gastrointestinal", units: 94, revenue: 14570 },
        { name: "Glycomet 500 SR", category: "Antidiabetics", units: 88, revenue: 3740 },
        { name: "Augmentin 625 Duo", category: "Antibiotics", units: 68, revenue: 13702 },
        { name: "Montair LC", category: "Respiratory", units: 52, revenue: 11960 },
      ];
    }
    return list.sort((a, b) => b.units - a.units).slice(0, 6);
  }, [invoices]);

  // Summary Metrics
  const summaryTotals = useMemo(() => {
    const rev = timeSeriesData.reduce((acc, curr) => acc + curr.revenue, 0);
    const unt = timeSeriesData.reduce((acc, curr) => acc + curr.units, 0);
    return {
      revenue: rev,
      units: unt,
      avgOrderValue: unt > 0 ? rev / (unt / 2.4) : 0,
    };
  }, [timeSeriesData]);

  return (
    <AppShell pageTitle="Pharmacy Analytics & Reports">
      <div className="space-y-6">
        {/* Period Selector & Scope Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#1F2937]">Operational & Sales Analytics</h2>
            <p className="text-xs text-[#64748B]">
              Aggregate metrics derived from local inventory and completed invoices
            </p>
          </div>

          <div className="flex items-center gap-1 rounded border border-[#E2E8F0] bg-[#F8FAFC] p-1 text-xs">
            <button
              onClick={() => setPeriod("today")}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                period === "today" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod("7d")}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                period === "7d" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setPeriod("30d")}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                period === "30d" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                period === "month" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Cards for Selected Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <span className="text-xs font-semibold text-[#64748B]">Period Sales Revenue</span>
            <div className="mt-2 text-2xl font-bold text-[#0F766E]">
              {formatINR(summaryTotals.revenue)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-[#15803D]">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Healthy dispensing turnover</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <span className="text-xs font-semibold text-[#64748B]">Units Dispensed</span>
            <div className="mt-2 text-2xl font-bold text-[#1F2937]">
              {summaryTotals.units} <span className="text-xs font-normal text-[#64748B]">packs/strips</span>
            </div>
            <div className="mt-1 text-[11px] text-[#64748B]">Across all active prescriptions</div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <span className="text-xs font-semibold text-[#64748B]">Est. Average Basket Value</span>
            <div className="mt-2 text-2xl font-bold text-[#1F2937]">
              {formatINR(summaryTotals.avgOrderValue)}
            </div>
            <div className="mt-1 text-[11px] text-[#64748B]">Per sales transaction</div>
          </div>
        </div>

        {/* Dual Chart Row: Revenue Trend & Units Dispensed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Over Time */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="border-b border-[#E2E8F0] pb-3 mb-4">
              <h3 className="text-xs font-bold text-[#1F2937]">Revenue Over Time (INR)</h3>
              <p className="text-[11px] text-[#64748B]">Daily sales totals for selected period</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  <Bar dataKey="revenue" fill="#0F766E" radius={[2, 2, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Units Sold Trend */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="border-b border-[#E2E8F0] pb-3 mb-4">
              <h3 className="text-xs font-bold text-[#1F2937]">Dispensing Velocity (Units Sold)</h3>
              <p className="text-[11px] text-[#64748B]">Units dispensed across all lines</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#E2E8F0" }}
                  />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: number) => [`${val} units`, "Units Sold"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="units"
                    stroke="#0369A1"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#0369A1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Secondary Row: Category Distribution & Best Selling SKUs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Category Distribution Pie / Bar (5 Cols) */}
          <div className="lg:col-span-5 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="border-b border-[#E2E8F0] pb-3 mb-3">
              <h3 className="text-xs font-bold text-[#1F2937]">Stock Distribution by Category</h3>
              <p className="text-[11px] text-[#64748B]">Volume of inventory units held across therapeutic segments</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={38}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val} units`, "Stock Quantity"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] max-h-24 overflow-y-auto">
              {categoryDistribution.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-xs" style={{ backgroundColor: c.color }} />
                  <span className="truncate text-[#4B5563]">{c.name}</span>
                  <span className="font-semibold text-[#1F2937]">({c.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Medicines (7 Cols) */}
          <div className="lg:col-span-7 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
            <div className="border-b border-[#E2E8F0] pb-3 mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#1F2937]">Highest Velocity Medicines</h3>
                <p className="text-[11px] text-[#64748B]">Ranked by units dispensed & contribution</p>
              </div>
              <span className="text-[10px] text-[#64748B]">Top 6 Products</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-semibold text-[#64748B]">
                    <th className="py-2 px-2">Medicine Brand</th>
                    <th className="py-2 px-2 text-right">Units Sold</th>
                    <th className="py-2 px-2 text-right">Revenue Contributed</th>
                    <th className="py-2 px-2 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-[#1F2937]">{p.name}</div>
                        <div className="text-[10px] text-[#64748B]">{p.category}</div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-[#1F2937]">
                        {p.units}
                      </td>
                      <td className="py-2.5 px-2 text-right font-medium text-[#0F766E]">
                        {formatINR(p.revenue)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[#64748B]">
                        {Math.round((p.revenue / Math.max(1, summaryTotals.revenue)) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
