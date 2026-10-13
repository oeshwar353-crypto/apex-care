"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { usePharmacy } from "@/lib/pharmacy-context";
import { BatchItem, MedicineCategory, StockStatus, ExpiryStatus } from "@/lib/types";
import { formatINR, formatDate, getDaysUntilExpiry, getExpiryStatus, getStockStatus } from "@/lib/calculations";
import { validateBatchForm } from "@/lib/validation";

export default function InventoryPage() {
  const { batches, addBatch, updateBatch, deleteBatch, adjustStock, settings } = usePharmacy();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("all");
  const [expiryStatusFilter, setExpiryStatusFilter] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<"name" | "quantity" | "price" | "expiry">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = settings.tablePageSize || 10;

  // Modals & Drawers state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalBatch, setEditModalBatch] = useState<BatchItem | null>(null);
  const [deleteConfirmBatch, setDeleteConfirmBatch] = useState<BatchItem | null>(null);
  const [adjustStockBatch, setAdjustStockBatch] = useState<BatchItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");
  const [viewDetailsBatch, setViewDetailsBatch] = useState<BatchItem | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    medicineName: "",
    genericName: "",
    category: "Antibiotics" as MedicineCategory,
    manufacturer: "",
    batchNumber: "",
    quantity: 50,
    purchasePrice: 40,
    sellingPrice: 65,
    expiryDate: "2027-12-31",
    reorderThreshold: 15,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const categories: MedicineCategory[] = [
    "Antibiotics",
    "Analgesics & Pain",
    "Antidiabetics",
    "Cardiovascular",
    "Respiratory",
    "Gastrointestinal",
    "Vitamins & Minerals",
    "Dermatological",
    "Pediatric",
    "Endocrine & Thyroid",
  ];

  // Filter and sort batches
  const filteredBatches = useMemo(() => {
    return batches
      .filter((b) => {
        // Search term check
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          b.medicineName.toLowerCase().includes(term) ||
          b.genericName.toLowerCase().includes(term) ||
          b.batchNumber.toLowerCase().includes(term) ||
          b.manufacturer.toLowerCase().includes(term);

        if (!matchesSearch) return false;

        // Category filter
        if (categoryFilter !== "all" && b.category !== categoryFilter) return false;

        // Stock status filter
        const stockStatus = getStockStatus(b.quantity, b.reorderThreshold);
        if (stockStatusFilter !== "all" && stockStatus !== stockStatusFilter) return false;

        // Expiry status filter
        const expiryStatus = getExpiryStatus(b.expiryDate, settings.lowStockAlertDays);
        if (expiryStatusFilter !== "all" && expiryStatus !== expiryStatusFilter) return false;

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === "name") {
          comp = a.medicineName.localeCompare(b.medicineName);
        } else if (sortField === "quantity") {
          comp = a.quantity - b.quantity;
        } else if (sortField === "price") {
          comp = a.sellingPrice - b.sellingPrice;
        } else if (sortField === "expiry") {
          comp = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        }
        return sortOrder === "asc" ? comp : -comp;
      });
  }, [batches, searchTerm, categoryFilter, stockStatusFilter, expiryStatusFilter, sortField, sortOrder, settings.lowStockAlertDays]);

  // Paginated records
  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1;
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setFormData({
      medicineName: "",
      genericName: "",
      category: "Antibiotics",
      manufacturer: "",
      batchNumber: "",
      quantity: 50,
      purchasePrice: 40,
      sellingPrice: 65,
      expiryDate: "2027-12-31",
      reorderThreshold: 15,
    });
    setFormErrors({});
    setAddModalOpen(true);
  };

  const handleOpenEdit = (batch: BatchItem) => {
    setEditModalBatch(batch);
    setFormData({
      medicineName: batch.medicineName,
      genericName: batch.genericName,
      category: batch.category,
      manufacturer: batch.manufacturer,
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      purchasePrice: batch.purchasePrice,
      sellingPrice: batch.sellingPrice,
      expiryDate: batch.expiryDate,
      reorderThreshold: batch.reorderThreshold,
    });
    setFormErrors({});
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateBatchForm(formData);
    if (!result.isValid) {
      setFormErrors(result.errors);
      return;
    }

    addBatch({
      medicineId: `med-${Date.now()}`,
      medicineName: formData.medicineName.trim(),
      genericName: formData.genericName.trim() || formData.medicineName.trim(),
      category: formData.category,
      manufacturer: formData.manufacturer.trim() || "Standard Pharma",
      batchNumber: formData.batchNumber.trim(),
      quantity: Number(formData.quantity),
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      expiryDate: formData.expiryDate,
      reorderThreshold: Number(formData.reorderThreshold),
    });

    setAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalBatch) return;

    const result = validateBatchForm(formData);
    if (!result.isValid) {
      setFormErrors(result.errors);
      return;
    }

    updateBatch(editModalBatch.id, {
      medicineName: formData.medicineName.trim(),
      genericName: formData.genericName.trim(),
      category: formData.category,
      manufacturer: formData.manufacturer.trim(),
      batchNumber: formData.batchNumber.trim(),
      quantity: Number(formData.quantity),
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      expiryDate: formData.expiryDate,
      reorderThreshold: Number(formData.reorderThreshold),
    });

    setEditModalBatch(null);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmBatch) {
      deleteBatch(deleteConfirmBatch.id);
      setDeleteConfirmBatch(null);
    }
  };

  const handleApplyStockAdjustment = () => {
    if (!adjustStockBatch) return;
    const delta = adjustType === "add" ? adjustAmount : -adjustAmount;
    adjustStock(adjustStockBatch.id, delta);
    setAdjustStockBatch(null);
  };

  return (
    <AppShell pageTitle="Inventory & Batch Management" onOpenAddMedicine={handleOpenAdd}>
      <div className="space-y-5">
        {/* Top Control Bar: Search & Filters */}
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search brand, generic salt, batch number, or manufacturer..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-[#E2E8F0] bg-[#FFFFFF] pl-9 pr-4 py-2 text-xs text-[#1F2937] placeholder-[#94A3B8] outline-none focus:border-[#0F766E]"
              />
            </div>

            {/* Actions: Add Batch Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 rounded bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#115E59]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Medicine Batch</span>
              </button>
            </div>
          </div>

          {/* Filter Dropdowns Bar */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-[#E2E8F0] pt-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-[#64748B]">
              <Filter className="h-3.5 w-3.5" /> Filters:
            </span>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
            >
              <option value="all">All Therapeutic Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Stock Status Filter */}
            <select
              value={stockStatusFilter}
              onChange={(e) => {
                setStockStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in-stock">In Stock (Sufficient)</option>
              <option value="low-stock">Low Stock (At / Below Min)</option>
              <option value="out-of-stock">Out of Stock (Zero Units)</option>
            </select>

            {/* Expiry Status Filter */}
            <select
              value={expiryStatusFilter}
              onChange={(e) => {
                setExpiryStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1F2937] outline-none focus:border-[#0F766E]"
            >
              <option value="all">All Expiry Windows</option>
              <option value="good">Adequate Shelf Life (&gt;90d)</option>
              <option value="expiring-soon">Expiring Soon (Within 90d)</option>
              <option value="expired">Expired (Requires Disposal)</option>
            </select>

            {/* Reset Filters */}
            {(searchTerm || categoryFilter !== "all" || stockStatusFilter !== "all" || expiryStatusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStockStatusFilter("all");
                  setExpiryStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="text-[11px] font-medium text-[#0F766E] hover:underline"
              >
                Clear all filters
              </button>
            )}

            <div className="ml-auto text-[11px] text-[#64748B]">
              Showing <span className="font-semibold text-[#1F2937]">{filteredBatches.length}</span> batches
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B]">
                  <th
                    onClick={() => {
                      if (sortField === "name") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else {
                        setSortField("name");
                        setSortOrder("asc");
                      }
                    }}
                    className="py-3 px-3 cursor-pointer hover:text-[#1F2937]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Medicine & Composition</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Batch #</th>
                  <th
                    onClick={() => {
                      if (sortField === "quantity") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else {
                        setSortField("quantity");
                        setSortOrder("asc");
                      }
                    }}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#1F2937]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Stock Qty</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Purchase (₹)</th>
                  <th
                    onClick={() => {
                      if (sortField === "price") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else {
                        setSortField("price");
                        setSortOrder("asc");
                      }
                    }}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#1F2937]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>MRP / Sell (₹)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      if (sortField === "expiry") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else {
                        setSortField("expiry");
                        setSortOrder("asc");
                      }
                    }}
                    className="py-3 px-3 cursor-pointer hover:text-[#1F2937]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Expiry Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Stock Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {paginatedBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-[#64748B]">
                      <Boxes className="mx-auto mb-2 h-8 w-8 text-[#94A3B8]" />
                      No medicine batches match your search criteria or filter.
                    </td>
                  </tr>
                ) : (
                  paginatedBatches.map((batch) => {
                    const stockStatus = getStockStatus(batch.quantity, batch.reorderThreshold);
                    const expiryStatus = getExpiryStatus(batch.expiryDate, settings.lowStockAlertDays);
                    const daysLeft = getDaysUntilExpiry(batch.expiryDate);

                    return (
                      <tr key={batch.id} className="hover:bg-[#F8FAFC]">
                        {/* Medicine Name */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-[#1F2937]">{batch.medicineName}</div>
                          <div className="text-[11px] text-[#64748B]">{batch.genericName}</div>
                          <div className="text-[10px] text-[#94A3B8]">{batch.manufacturer}</div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3">
                          <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#475569]">
                            {batch.category}
                          </span>
                        </td>

                        {/* Batch Number */}
                        <td className="py-2.5 px-3 font-mono text-[11px] font-medium text-[#334155]">
                          {batch.batchNumber}
                        </td>

                        {/* Available Quantity */}
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`font-semibold text-xs ${
                              batch.quantity === 0
                                ? "text-[#B91C1C]"
                                : batch.quantity <= batch.reorderThreshold
                                ? "text-[#B45309]"
                                : "text-[#1F2937]"
                            }`}
                          >
                            {batch.quantity}
                          </span>
                          <div className="text-[10px] text-[#94A3B8]">
                            Min: {batch.reorderThreshold}
                          </div>
                        </td>

                        {/* Purchase Price */}
                        <td className="py-2.5 px-3 text-right text-[#64748B]">
                          {formatINR(batch.purchasePrice)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-2.5 px-3 text-right font-medium text-[#0F766E]">
                          {formatINR(batch.sellingPrice)}
                        </td>

                        {/* Expiry Date */}
                        <td className="py-2.5 px-3">
                          <div className="text-xs text-[#1F2937]">{formatDate(batch.expiryDate)}</div>
                          <div className="text-[10px]">
                            {daysLeft < 0 ? (
                              <span className="font-semibold text-[#B91C1C]">Expired ({Math.abs(daysLeft)}d ago)</span>
                            ) : daysLeft <= 90 ? (
                              <span className="font-semibold text-[#B45309]">Expires in {daysLeft}d</span>
                            ) : (
                              <span className="text-[#64748B]">{daysLeft} days left</span>
                            )}
                          </div>
                        </td>

                        {/* Stock Status Badge */}
                        <td className="py-2.5 px-3">
                          {stockStatus === "out-of-stock" ? (
                            <span className="inline-flex items-center rounded border border-[#FECACA] bg-[#FEF2F2] px-2 py-0.5 text-[10px] font-semibold text-[#B91C1C]">
                              Out of Stock
                            </span>
                          ) : stockStatus === "low-stock" ? (
                            <span className="inline-flex items-center rounded border border-[#FDE68A] bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#B45309]">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-semibold text-[#15803D]">
                              In Stock
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setViewDetailsBatch(batch)}
                              title="View Batch Details"
                              className="rounded p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setAdjustStockBatch(batch);
                                setAdjustAmount(10);
                                setAdjustType("add");
                              }}
                              title="Quick Stock Adjustment"
                              className="rounded p-1 text-[#0F766E] hover:bg-[#F0FDFA]"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(batch)}
                              title="Edit Batch"
                              className="rounded p-1 text-[#4B5563] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmBatch(batch)}
                              title="Delete Batch"
                              className="rounded p-1 text-[#B91C1C] hover:bg-[#FEE2E2]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E2E8F0] px-4 py-3 text-xs gap-2">
            <span className="text-[#64748B]">
              Page <span className="font-semibold text-[#1F2937]">{currentPage}</span> of{" "}
              <span className="font-semibold text-[#1F2937]">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded border border-[#E2E8F0] px-2.5 py-1 text-xs text-[#4B5563] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    currentPage === p
                      ? "bg-[#0F766E] text-white"
                      : "border border-[#E2E8F0] text-[#4B5563] hover:bg-[#F8FAFC]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded border border-[#E2E8F0] px-2.5 py-1 text-xs text-[#4B5563] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Medicine Batch Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#1F2937]">Add Medicine Batch to Inventory</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-[#64748B] hover:text-[#1F2937]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                  {formErrors.medicineName && (
                    <p className="mt-1 text-[11px] text-[#B91C1C]">{formErrors.medicineName}</p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Generic Name / Composition</label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MedicineCategory })}
                    className="w-full rounded border border-[#E2E8F0] bg-white px-3 py-2 outline-none focus:border-[#0F766E]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Batch Number *</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                  {formErrors.batchNumber && (
                    <p className="mt-1 text-[11px] text-[#B91C1C]">{formErrors.batchNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                  {formErrors.quantity && (
                    <p className="mt-1 text-[11px] text-[#B91C1C]">{formErrors.quantity}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Selling Price / MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                  {formErrors.sellingPrice && (
                    <p className="mt-1 text-[11px] text-[#B91C1C]">{formErrors.sellingPrice}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                  {formErrors.expiryDate && (
                    <p className="mt-1 text-[11px] text-[#B91C1C]">{formErrors.expiryDate}</p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Reorder Safety Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderThreshold}
                    onChange={(e) => setFormData({ ...formData, reorderThreshold: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded border border-[#E2E8F0] px-3.5 py-1.5 text-xs text-[#64748B] hover:bg-[#F8FAFC]"
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

      {/* Edit Medicine Batch Modal */}
      {editModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#1F2937]">Edit Medicine Batch: {editModalBatch.batchNumber}</h3>
              <button onClick={() => setEditModalBatch(null)} className="text-[#64748B] hover:text-[#1F2937]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Generic Name</label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Batch Number *</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderThreshold}
                    onChange={(e) => setFormData({ ...formData, reorderThreshold: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-3 py-2 outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
                <button
                  type="button"
                  onClick={() => setEditModalBatch(null)}
                  className="rounded border border-[#E2E8F0] px-3.5 py-1.5 text-xs text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#0F766E] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustStockBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-xl">
            <h3 className="text-sm font-bold text-[#1F2937]">Stock Quantity Adjustment</h3>
            <p className="mt-1 text-xs text-[#64748B]">
              Adjust stock for <span className="font-semibold text-[#1F2937]">{adjustStockBatch.medicineName}</span> (Batch: {adjustStockBatch.batchNumber})
            </p>

            <div className="mt-3 rounded border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs">
              Current Available Quantity: <span className="font-bold text-[#0F766E]">{adjustStockBatch.quantity} units</span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("add")}
                    className={`flex items-center justify-center gap-1.5 rounded border py-1.5 text-xs font-semibold ${
                      adjustType === "add"
                        ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]"
                        : "border-[#E2E8F0] text-[#64748B]"
                    }`}
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Receive / Add (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("subtract")}
                    className={`flex items-center justify-center gap-1.5 rounded border py-1.5 text-xs font-semibold ${
                      adjustType === "subtract"
                        ? "border-[#B91C1C] bg-[#FEF2F2] text-[#B91C1C]"
                        : "border-[#E2E8F0] text-[#64748B]"
                    }`}
                  >
                    <MinusCircle className="h-3.5 w-3.5" />
                    <span>Deduct / Damage (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Quantity to Adjust</label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-1.5 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="rounded bg-[#F1F5F9] p-2 text-[11px] text-[#475569]">
                Resulting stock will be:{" "}
                <span className="font-bold text-[#1F2937]">
                  {adjustType === "add"
                    ? adjustStockBatch.quantity + adjustAmount
                    : Math.max(0, adjustStockBatch.quantity - adjustAmount)}{" "}
                  units
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setAdjustStockBatch(null)}
                className="rounded border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyStockAdjustment}
                className="rounded bg-[#0F766E] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59]"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-xl">
            <h3 className="text-sm font-bold text-[#1F2937]">Delete Medicine Batch?</h3>
            <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to remove batch <span className="font-mono font-bold text-[#1F2937]">{deleteConfirmBatch.batchNumber}</span> of{" "}
              <span className="font-semibold text-[#1F2937]">{deleteConfirmBatch.medicineName}</span>? This will permanently delete this batch record from the inventory catalog.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmBatch(null)}
                className="rounded border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded bg-[#B91C1C] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#991B1B]"
              >
                Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Batch Details Side Drawer */}
      {viewDetailsBatch && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-md bg-[#FFFFFF] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">{viewDetailsBatch.medicineName}</h3>
                  <span className="text-xs text-[#64748B]">{viewDetailsBatch.genericName}</span>
                </div>
                <button onClick={() => setViewDetailsBatch(null)} className="text-[#64748B] hover:text-[#1F2937]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Batch Identification:</span>
                    <span className="font-mono font-bold text-[#1F2937]">{viewDetailsBatch.batchNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Manufacturer:</span>
                    <span className="font-medium text-[#1F2937]">{viewDetailsBatch.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Therapeutic Category:</span>
                    <span className="font-medium text-[#0F766E]">{viewDetailsBatch.category}</span>
                  </div>
                </div>

                <div className="border border-[#E2E8F0] rounded p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Stock Available:</span>
                    <span className="font-bold text-[#1F2937]">{viewDetailsBatch.quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Purchase Cost:</span>
                    <span>{formatINR(viewDetailsBatch.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Retail Selling Price:</span>
                    <span className="font-bold text-[#0F766E]">{formatINR(viewDetailsBatch.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Gross Margin:</span>
                    <span className="font-semibold text-[#15803D]">
                      {viewDetailsBatch.sellingPrice > 0
                        ? `${Math.round(
                            ((viewDetailsBatch.sellingPrice - viewDetailsBatch.purchasePrice) /
                              viewDetailsBatch.sellingPrice) *
                              100
                          )}%`
                        : "0%"}
                    </span>
                  </div>
                </div>

                <div className="border border-[#E2E8F0] rounded p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Expiry Date:</span>
                    <span className="font-medium">{formatDate(viewDetailsBatch.expiryDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Days Remaining:</span>
                    <span className="font-medium">{getDaysUntilExpiry(viewDetailsBatch.expiryDate)} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Reorder Alert Level:</span>
                    <span>{viewDetailsBatch.reorderThreshold} units</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-4 mt-6">
              <button
                onClick={() => setViewDetailsBatch(null)}
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
