"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Phone,
  FileText,
  Boxes,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { usePharmacy } from "@/lib/pharmacy-context";
import { BatchItem, Invoice, PaymentMethod } from "@/lib/types";
import { formatINR, formatDate, formatDateTime, calculateBilling, getExpiryStatus } from "@/lib/calculations";

export default function BillingPage() {
  const {
    batches,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    checkoutCart,
    settings,
    profile,
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Customer & Bill options
  const [customerName, setCustomerName] = useState("Walk-in Patient");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // UI state
  const [checkoutResultInvoice, setCheckoutResultInvoice] = useState<Invoice | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [clearCartConfirm, setClearCartConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Available batches to sell (exclude 0 stock and expired items)
  const availableBatches = useMemo(() => {
    return batches.filter((b) => {
      // Must have stock
      if (b.quantity <= 0) return false;
      // Filter expired batches for safety
      if (getExpiryStatus(b.expiryDate) === "expired") return false;

      if (selectedCategory !== "all" && b.category !== selectedCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        b.medicineName.toLowerCase().includes(q) ||
        b.genericName.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q)
      );
    });
  }, [batches, searchQuery, selectedCategory]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    batches.forEach((b) => set.add(b.category));
    return Array.from(set);
  }, [batches]);

  // Billing math
  const billingSummary = useMemo(() => {
    return calculateBilling(
      cart.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
      discountPercent,
      settings.defaultTaxPercent
    );
  }, [cart, discountPercent, settings.defaultTaxPercent]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutError(null);
    setIsProcessing(true);

    setTimeout(() => {
      const res = checkoutCart({
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        discountPercent,
        notes: notes.trim() || undefined,
      });

      setIsProcessing(false);

      if (res.success && res.invoice) {
        setCheckoutResultInvoice(res.invoice);
        // Reset customer form
        setCustomerName("Walk-in Patient");
        setCustomerPhone("");
        setDiscountPercent(0);
        setNotes("");
      } else {
        setCheckoutError(res.error || "Unable to process invoice. Check available stock.");
      }
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell pageTitle="Point of Sale / Billing Terminal">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Product Catalog & Fast Medicine Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter Header */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Scan barcode, type medicine brand, salt, or batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded border border-[#E2E8F0] bg-[#FFFFFF] pl-9 pr-3 py-2 text-xs text-[#1F2937] placeholder-[#94A3B8] outline-none focus:border-[#0F766E]"
                  autoFocus
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded border border-[#E2E8F0] bg-white px-2.5 py-2 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#64748B]">
              <span>
                Available Medicines in Store:{" "}
                <span className="font-semibold text-[#1F2937]">{availableBatches.length}</span>
              </span>
              <span className="text-[#0F766E] font-medium">Click [+] to add to bill</span>
            </div>
          </div>

          {/* Product Items Grid / Compact List */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm overflow-hidden">
            <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs font-semibold text-[#64748B]">
              Stock Shelf Listing (FIFO Batch Selection)
            </div>

            <div className="divide-y divide-[#F1F5F9] max-h-[560px] overflow-y-auto">
              {availableBatches.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#64748B]">
                  <Boxes className="mx-auto mb-2 h-7 w-7 text-[#94A3B8]" />
                  No matching active batches found. Try searching a generic salt name.
                </div>
              ) : (
                availableBatches.map((batch) => {
                  const inCart = cart.find((i) => i.batchId === batch.id);
                  const isOutOfStock = batch.quantity <= (inCart ? inCart.quantity : 0);

                  return (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-3.5 hover:bg-[#F8FAFC] transition-colors text-xs"
                    >
                      {/* Medicine Info */}
                      <div className="min-w-0 pr-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1F2937] text-xs">
                            {batch.medicineName}
                          </span>
                          <span className="rounded bg-[#F0FDFA] px-1.5 py-0.2 text-[10px] font-semibold text-[#0F766E]">
                            {batch.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5 truncate">
                          {batch.genericName}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-[#94A3B8]">
                          <span>
                            Batch: <span className="font-mono font-medium text-[#475569]">{batch.batchNumber}</span>
                          </span>
                          <span>Exp: {batch.expiryDate}</span>
                          <span>
                            Stock:{" "}
                            <span
                              className={`font-semibold ${
                                batch.quantity <= batch.reorderThreshold ? "text-[#B45309]" : "text-[#1F2937]"
                              }`}
                            >
                              {batch.quantity}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Price & Add to Cart button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-bold text-xs text-[#0F766E]">
                            {formatINR(batch.sellingPrice)}
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">per unit / strip</div>
                        </div>

                        <button
                          onClick={() => addToCart(batch, 1)}
                          disabled={isOutOfStock}
                          className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                            isOutOfStock
                              ? "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed"
                              : "bg-[#0F766E] text-white hover:bg-[#115E59]"
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>{inCart ? `Add (${inCart.quantity})` : "Add"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Bill / Cart & Checkout Panel (5 Cols) */}
        <div id="current-bill-section" className="lg:col-span-5 space-y-4">
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm">
            {/* Bill Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-[#0F766E]" />
                <h3 className="text-xs font-bold text-[#1F2937]">Current Bill Items ({cart.length})</h3>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={() => setClearCartConfirm(true)}
                  className="text-[11px] font-semibold text-[#B91C1C] hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-[#F1F5F9] max-h-64 overflow-y-auto p-2">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#64748B]">
                  <Receipt className="mx-auto mb-2 h-7 w-7 text-[#CBD5E1]" />
                  Cart is empty. Select medicines from the left catalog to add to bill.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.batchId} className="flex items-center justify-between p-2 text-xs">
                    <div className="min-w-0 pr-2 flex-1">
                      <div className="font-semibold text-[#1F2937] truncate">{item.medicineName}</div>
                      <div className="text-[10px] text-[#64748B]">
                        Batch: <span className="font-mono">{item.batchNumber}</span> • {formatINR(item.unitPrice)}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center rounded border border-[#E2E8F0] bg-[#F8FAFC]">
                        <button
                          onClick={() => updateCartQuantity(item.batchId, item.quantity - 1)}
                          className="p-1 text-[#475569] hover:bg-[#E2E8F0]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-xs text-[#1F2937]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.batchId, item.quantity + 1)}
                          disabled={item.quantity >= item.availableStock}
                          className="p-1 text-[#475569] hover:bg-[#E2E8F0] disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="w-16 text-right font-semibold text-[#0F766E]">
                        {formatINR(item.total)}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.batchId)}
                        className="p-1 text-[#94A3B8] hover:text-[#B91C1C]"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Patient & Invoice Parameters */}
            <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                    Customer / Patient Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`flex items-center justify-center gap-1.5 rounded border py-1.5 text-xs font-semibold ${
                      paymentMethod === "UPI"
                        ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]"
                        : "border-[#E2E8F0] bg-white text-[#64748B]"
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Cash")}
                    className={`flex items-center justify-center gap-1.5 rounded border py-1.5 text-xs font-semibold ${
                      paymentMethod === "Cash"
                        ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]"
                        : "border-[#E2E8F0] bg-white text-[#64748B]"
                    }`}
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Card")}
                    className={`flex items-center justify-center gap-1.5 rounded border py-1.5 text-xs font-semibold ${
                      paymentMethod === "Card"
                        ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]"
                        : "border-[#E2E8F0] bg-white text-[#64748B]"
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Card</span>
                  </button>
                </div>
              </div>

              {/* Discount selection */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#4B5563]">Discount Rate:</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscountPercent(d)}
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        discountPercent === d
                          ? "bg-[#0F766E] text-white"
                          : "border border-[#E2E8F0] bg-white text-[#64748B]"
                      }`}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bill Financial Calculation Breakdown */}
            <div className="border-t border-[#E2E8F0] p-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#64748B]">
                <span>Items Subtotal:</span>
                <span className="font-medium text-[#1F2937]">{formatINR(billingSummary.subtotal)}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-[#15803D]">
                  <span>Discount ({discountPercent}%):</span>
                  <span>- {formatINR(billingSummary.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#64748B]">
                <span>
                  GST / Sales Tax ({settings.defaultTaxPercent}%):
                </span>
                <span className="font-medium text-[#1F2937]">{formatINR(billingSummary.taxAmount)}</span>
              </div>

              <div className="border-t border-[#E2E8F0] pt-2 flex items-baseline justify-between">
                <span className="text-sm font-bold text-[#1F2937]">Grand Total (INR):</span>
                <span className="text-lg font-extrabold text-[#0F766E]">
                  {formatINR(billingSummary.totalAmount)}
                </span>
              </div>

              {checkoutError && (
                <div className="mt-2 flex items-center gap-1.5 rounded border border-[#FECACA] bg-[#FEF2F2] p-2 text-xs text-[#B91C1C]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Checkout Action Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded bg-[#0F766E] py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#115E59] disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Receipt className="h-4 w-4" />
                    <span>Complete Sale & Generate Tax Invoice</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-[#94A3B8]">
                Simulated transaction • Stock deducts instantly from batch inventory
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {clearCartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-lg">
            <h3 className="text-sm font-bold text-[#1F2937]">Clear current bill?</h3>
            <p className="mt-2 text-xs text-[#64748B]">
              This will remove all {cart.length} medicines currently in the active billing cart.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setClearCartConfirm(false)}
                className="rounded border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#64748B]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setClearCartConfirm(false);
                }}
                className="rounded bg-[#B91C1C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#991B1B]"
              >
                Clear All Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Receipt Preview Modal */}
      {checkoutResultInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] shadow-2xl max-h-[95vh] flex flex-col">
            {/* Header / Actions */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#15803D]" />
                <h3 className="text-xs font-bold text-[#1F2937]">
                  Invoice Generated: {checkoutResultInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setCheckoutResultInvoice(null)}
                className="text-[#64748B] hover:text-[#1F2937]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt Canvas */}
            <div className="flex-1 overflow-y-auto p-6" id="printable-invoice">
              {/* Receipt Header */}
              <div className="text-center border-b border-[#E2E8F0] pb-4">
                <h2 className="text-base font-bold text-[#1F2937] uppercase">{profile.name}</h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">{profile.address}, {profile.city}</p>
                <div className="mt-1 text-[10px] text-[#64748B] font-mono">
                  Lic No: {profile.licenseNumber} • Phone: {profile.phone}
                </div>
                <div className="mt-2 inline-block rounded border border-[#0F766E] bg-[#F0FDFA] px-2.5 py-0.5 text-[10px] font-bold text-[#0F766E]">
                  OFFICIAL TAX INVOICE / CASH MEMO
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs py-3 border-b border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B]">Invoice: </span>
                  <span className="font-mono font-bold text-[#1F2937]">
                    {checkoutResultInvoice.invoiceNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B]">Date: </span>
                  <span className="font-medium text-[#1F2937]">
                    {formatDateTime(checkoutResultInvoice.date)}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B]">Patient: </span>
                  <span className="font-medium text-[#1F2937]">
                    {checkoutResultInvoice.customerName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B]">Payment: </span>
                  <span className="font-bold text-[#0F766E]">
                    {checkoutResultInvoice.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[10px] font-semibold text-[#64748B] text-left">
                      <th className="py-1">Item & Batch</th>
                      <th className="py-1 text-center">Exp</th>
                      <th className="py-1 text-right">Qty</th>
                      <th className="py-1 text-right">Price</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {checkoutResultInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 pr-1">
                          <div className="font-semibold text-[#1F2937]">{it.medicineName}</div>
                          <div className="text-[10px] text-[#64748B] font-mono">B: {it.batchNumber}</div>
                        </td>
                        <td className="py-2 text-center text-[10px] text-[#64748B]">
                          {it.expiryDate.slice(0, 7)}
                        </td>
                        <td className="py-2 text-right font-medium">{it.quantity}</td>
                        <td className="py-2 text-right text-[#64748B]">{formatINR(it.unitPrice)}</td>
                        <td className="py-2 text-right font-bold text-[#1F2937]">{formatINR(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="border-t border-[#E2E8F0] pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Subtotal:</span>
                  <span>{formatINR(checkoutResultInvoice.subtotal)}</span>
                </div>
                {checkoutResultInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-[#15803D]">
                    <span>Discount ({checkoutResultInvoice.discountPercent}%):</span>
                    <span>- {formatINR(checkoutResultInvoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#64748B]">
                  <span>GST ({checkoutResultInvoice.taxPercent}%):</span>
                  <span>{formatINR(checkoutResultInvoice.taxAmount)}</span>
                </div>
                <div className="border-t border-[#E2E8F0] pt-2 flex justify-between font-bold text-sm text-[#1F2937]">
                  <span>Net Amount Paid:</span>
                  <span className="text-[#0F766E]">{formatINR(checkoutResultInvoice.totalAmount)}</span>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 border-t border-dashed border-[#CBD5E1] pt-3 text-center text-[10px] text-[#94A3B8]">
                Thank you for choosing {profile.name}! Medicines once sold cannot be returned without prescription batch verification.
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3">
              <button
                onClick={() => setCheckoutResultInvoice(null)}
                className="rounded border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#4B5563] hover:bg-[#F8FAFC]"
              >
                Done / Next Bill
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href="/sales"
                  className="rounded border border-[#0F766E] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-[#F0FDFA]"
                >
                  View in Sales History &rarr;
                </Link>
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
      {/* Mobile Floating Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 z-30 lg:hidden rounded-lg border border-[#0F766E] bg-[#0F766E] p-3 text-white shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold">{cart.length} item{cart.length > 1 ? "s" : ""} in Current Bill</div>
            <div className="text-[11px] text-[#CCFBF1]">Total: {formatINR(billingSummary.totalAmount)}</div>
          </div>
          <a
            href="#current-bill-section"
            className="rounded bg-white px-3 py-1.5 text-xs font-bold text-[#0F766E] hover:bg-[#F0FDFA] shadow-sm transition-colors"
          >
            Review & Pay &rarr;
          </a>
        </div>
      )}
    </AppShell>
  );
}
