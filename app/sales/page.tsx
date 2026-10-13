"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Printer,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  Receipt,
  Download,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { usePharmacy } from "@/lib/pharmacy-context";
import { Invoice, PaymentMethod } from "@/lib/types";
import { formatINR, formatDate, formatDateTime } from "@/lib/calculations";

export default function SalesHistoryPage() {
  const { invoices, refundInvoice, profile } = usePharmacy();

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7d" | "30d">("all");

  const [sortField, setSortField] = useState<"date" | "total">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Selected invoice for detail modal & print
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [refundConfirmInvoice, setRefundConfirmInvoice] = useState<Invoice | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return invoices
      .filter((inv) => {
        // Search
        const q = searchTerm.toLowerCase();
        const matches =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          (inv.customerPhone && inv.customerPhone.includes(q));

        if (!matches) return false;

        // Payment Filter
        if (paymentFilter !== "all" && inv.paymentMethod !== paymentFilter) return false;

        // Status Filter
        if (statusFilter !== "all" && inv.paymentStatus !== statusFilter) return false;

        // Date Filter
        if (dateFilter === "today") {
          if (!inv.date.startsWith(todayStr)) return false;
        } else if (dateFilter === "7d") {
          const invDate = new Date(inv.date);
          const diffDays = (now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 7) return false;
        } else if (dateFilter === "30d") {
          const invDate = new Date(inv.date);
          const diffDays = (now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 30) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === "date") {
          comp = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortField === "total") {
          comp = a.totalAmount - b.totalAmount;
        }
        return sortOrder === "desc" ? -comp : comp;
      });
  }, [invoices, searchTerm, paymentFilter, statusFilter, dateFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  // Aggregate stats
  const totalRevenue = useMemo(() => {
    return filteredInvoices
      .filter((i) => i.paymentStatus === "Completed")
      .reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [filteredInvoices]);

  const handlePrint = () => {
    window.print();
  };

  const handleExecuteRefund = () => {
    if (refundConfirmInvoice) {
      refundInvoice(refundConfirmInvoice.id);
      setRefundConfirmInvoice(null);
      if (activeInvoice?.id === refundConfirmInvoice.id) {
        setActiveInvoice({ ...activeInvoice, paymentStatus: "Refunded" });
      }
    }
  };

  return (
    <AppShell pageTitle="Sales Invoices & Transaction History">
      <div className="space-y-5">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <span className="text-xs font-semibold text-[#64748B]">Filtered Sales Volume</span>
            <div className="mt-1 text-xl font-bold text-[#1F2937]">
              {filteredInvoices.length} <span className="text-xs font-normal text-[#64748B]">invoices</span>
            </div>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <span className="text-xs font-semibold text-[#64748B]">Total Revenue (Filtered)</span>
            <div className="mt-1 text-xl font-bold text-[#0F766E]">
              {formatINR(totalRevenue)}
            </div>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#64748B]">Average Bill Size</span>
              <div className="mt-1 text-xl font-bold text-[#1F2937]">
                {filteredInvoices.length > 0
                  ? formatINR(totalRevenue / Math.max(1, filteredInvoices.length))
                  : "₹0.00"}
              </div>
            </div>
            <Link
              href="/billing"
              className="rounded bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59]"
            >
              + New Sale
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search invoice number (INV-...), patient name, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-[#E2E8F0] pl-9 pr-4 py-2 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5 rounded border border-[#E2E8F0] bg-[#F8FAFC] p-1 text-xs">
              <button
                onClick={() => setDateFilter("all")}
                className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                  dateFilter === "all" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter("today")}
                className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                  dateFilter === "today" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter("7d")}
                className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                  dateFilter === "7d" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
                }`}
              >
                Last 7d
              </button>
              <button
                onClick={() => setDateFilter("30d")}
                className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                  dateFilter === "30d" ? "bg-white text-[#0F766E] shadow-xs" : "text-[#64748B]"
                }`}
              >
                Last 30d
              </button>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-[#E2E8F0] pt-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-[#64748B]">
              <Filter className="h-3.5 w-3.5" /> Filter by:
            </span>

            {/* Payment Method */}
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
            >
              <option value="all">All Payment Modes</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Refunded">Refunded / Returned</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B]">
                  <th className="py-3 px-3">Invoice Number</th>
                  <th
                    onClick={() => {
                      if (sortField === "date") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else {
                        setSortField("date");
                        setSortOrder("desc");
                      }
                    }}
                    className="py-3 px-3 cursor-pointer hover:text-[#1F2937]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date & Time</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Customer / Patient</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th
                    onClick={() => {
                      if (sortField === "total") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else {
                        setSortField("total");
                        setSortOrder("desc");
                      }
                    }}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#1F2937]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Amount (₹)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#64748B]">
                      <Receipt className="mx-auto mb-2 h-7 w-7 text-[#94A3B8]" />
                      No sales records matching the chosen filters.
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-mono font-semibold text-[#0F766E]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-[#64748B]">
                        {formatDateTime(inv.date)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1F2937]">{inv.customerName}</div>
                        {inv.customerPhone && (
                          <div className="text-[10px] text-[#94A3B8]">{inv.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-medium">
                        {inv.items.length}
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#475569]">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#1F2937]">
                        {formatINR(inv.totalAmount)}
                      </td>
                      <td className="py-3 px-3">
                        {inv.paymentStatus === "Completed" ? (
                          <span className="inline-flex items-center gap-1 rounded border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-semibold text-[#15803D]">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-[#FECACA] bg-[#FEF2F2] px-2 py-0.5 text-[10px] font-semibold text-[#B91C1C]">
                            <XCircle className="h-3 w-3" />
                            Refunded
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setActiveInvoice(inv)}
                          className="inline-flex items-center gap-1 rounded border border-[#0F766E] bg-[#F0FDFA] px-2.5 py-1 text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[#E2E8F0] px-4 py-3 text-xs">
            <span className="text-[#64748B]">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded border border-[#E2E8F0] px-2.5 py-1 text-[#4B5563] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded border border-[#E2E8F0] px-2.5 py-1 text-[#4B5563] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Details Dialog */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] shadow-2xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#0F766E]" />
                <h3 className="text-xs font-bold text-[#1F2937]">
                  Tax Invoice Details: {activeInvoice.invoiceNumber}
                </h3>
              </div>
              <button onClick={() => setActiveInvoice(null)} className="text-[#64748B] hover:text-[#1F2937]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5" id="printable-invoice">
              {/* Store & Header */}
              <div className="text-center border-b border-[#E2E8F0] pb-3 mb-3">
                <h2 className="text-sm font-bold text-[#1F2937] uppercase">{profile.name}</h2>
                <p className="text-[11px] text-[#64748B]">{profile.address}, {profile.city}</p>
                <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                  DL No: {profile.licenseNumber} • Phone: {profile.phone}
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B]">Invoice: </span>
                  <span className="font-mono font-bold text-[#1F2937]">{activeInvoice.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B]">Timestamp: </span>
                  <span className="font-medium text-[#1F2937]">{formatDateTime(activeInvoice.date)}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">Patient / Buyer: </span>
                  <span className="font-medium text-[#1F2937]">{activeInvoice.customerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B]">Mode: </span>
                  <span className="font-bold text-[#0F766E]">{activeInvoice.paymentMethod}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[10px] font-semibold text-[#64748B] text-left">
                      <th className="py-1">Medicine & Generic</th>
                      <th className="py-1 text-center">Batch</th>
                      <th className="py-1 text-right">Qty</th>
                      <th className="py-1 text-right">Rate</th>
                      <th className="py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {activeInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 pr-1">
                          <div className="font-semibold text-[#1F2937]">{it.medicineName}</div>
                          <div className="text-[10px] text-[#64748B]">{it.genericName}</div>
                        </td>
                        <td className="py-2 text-center text-[10px] font-mono text-[#64748B]">
                          {it.batchNumber}
                        </td>
                        <td className="py-2 text-right font-medium">{it.quantity}</td>
                        <td className="py-2 text-right text-[#64748B]">{formatINR(it.unitPrice)}</td>
                        <td className="py-2 text-right font-bold text-[#1F2937]">{formatINR(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-[#E2E8F0] pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Subtotal:</span>
                  <span>{formatINR(activeInvoice.subtotal)}</span>
                </div>
                {activeInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-[#15803D]">
                    <span>Discount ({activeInvoice.discountPercent}%):</span>
                    <span>- {formatINR(activeInvoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#64748B]">
                  <span>GST ({activeInvoice.taxPercent}%):</span>
                  <span>{formatINR(activeInvoice.taxAmount)}</span>
                </div>
                <div className="border-t border-[#E2E8F0] pt-2 flex justify-between font-bold text-sm text-[#1F2937]">
                  <span>Total Amount Paid:</span>
                  <span className="text-[#0F766E]">{formatINR(activeInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3">
              {activeInvoice.paymentStatus === "Completed" ? (
                <button
                  onClick={() => setRefundConfirmInvoice(activeInvoice)}
                  className="flex items-center gap-1.5 rounded border border-[#B91C1C] px-3 py-1.5 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Process Refund & Restock</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-[#B91C1C]">Refunded / Restocked</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveInvoice(null)}
                  className="rounded border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Close
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded bg-[#0F766E] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#115E59]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundConfirmInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-xl">
            <h3 className="text-sm font-bold text-[#1F2937]">Confirm Return & Stock Restoration</h3>
            <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
              Refunding invoice <span className="font-mono font-bold text-[#1F2937]">{refundConfirmInvoice.invoiceNumber}</span> will restore all {refundConfirmInvoice.items.reduce((a, b) => a + b.quantity, 0)} units back into their respective inventory batches and mark this invoice as Refunded.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setRefundConfirmInvoice(null)}
                className="rounded border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#64748B]"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRefund}
                className="rounded bg-[#B91C1C] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#991B1B]"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
