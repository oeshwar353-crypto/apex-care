"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  BatchItem,
  CartItem,
  DemandPrediction,
  Invoice,
  MedicineSummary,
  PharmacyProfile,
  UserSettings,
} from "./types";
import {
  initialBatches,
  initialInvoices,
  initialPharmacyProfile,
  initialUserSettings,
} from "./mock-data";
import { calculateBilling, generateInvoiceNumber, getExpiryStatus, getStockStatus } from "./calculations";

interface PharmacyContextType {
  isInitialized: boolean;
  batches: BatchItem[];
  invoices: Invoice[];
  profile: PharmacyProfile;
  settings: UserSettings;
  cart: CartItem[];
  // Inventory actions
  addBatch: (batch: Omit<BatchItem, "id" | "createdAt">) => void;
  updateBatch: (id: string, updates: Partial<BatchItem>) => void;
  deleteBatch: (id: string) => void;
  adjustStock: (id: string, deltaQuantity: number, reason?: string) => void;
  // Billing / Cart actions
  addToCart: (batch: BatchItem, quantity?: number) => boolean;
  updateCartQuantity: (batchId: string, quantity: number) => void;
  removeFromCart: (batchId: string) => void;
  clearCart: () => void;
  checkoutCart: (params: {
    customerName: string;
    customerPhone?: string;
    paymentMethod: "Cash" | "UPI" | "Card";
    discountPercent?: number;
    notes?: string;
  }) => { success: boolean; invoice?: Invoice; error?: string };
  // Invoices
  refundInvoice: (invoiceId: string) => void;
  // Settings & Profile
  updateProfile: (profile: Partial<PharmacyProfile>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetToDemoData: () => void;
  // Aggregated helpers
  medicineSummaries: MedicineSummary[];
  demandPredictions: DemandPrediction[];
  // Stats
  kpiStats: {
    todaySales: number;
    todayInvoicesCount: number;
    totalProductsCount: number;
    totalBatchesCount: number;
    lowStockCount: number;
    expiringBatchesCount: number;
    expiredBatchesCount: number;
  };
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BATCHES: "pharmacy_batches_v1",
  INVOICES: "pharmacy_invoices_v1",
  PROFILE: "pharmacy_profile_v1",
  SETTINGS: "pharmacy_settings_v1",
  CART: "pharmacy_cart_v1",
};

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [batches, setBatches] = useState<BatchItem[]>(initialBatches);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [profile, setProfile] = useState<PharmacyProfile>(initialPharmacyProfile);
  const [settings, setSettings] = useState<UserSettings>(initialUserSettings);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const storedBatches = localStorage.getItem(STORAGE_KEYS.BATCHES);
      const storedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
      const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const storedCart = localStorage.getItem(STORAGE_KEYS.CART);

      if (storedBatches) {
        setBatches(JSON.parse(storedBatches));
      }
      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices));
      }
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (e) {
      console.warn("Failed to read demo data from localStorage:", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to persist demo state:", e);
    }
  }, [batches, invoices, profile, settings, cart, isInitialized]);

  // Inventory CRUD
  const addBatch = (batchData: Omit<BatchItem, "id" | "createdAt">) => {
    const newBatch: BatchItem = {
      ...batchData,
      id: `batch-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      quantity: Math.max(0, Number(batchData.quantity) || 0),
      purchasePrice: Math.max(0, Number(batchData.purchasePrice) || 0),
      sellingPrice: Math.max(0, Number(batchData.sellingPrice) || 0),
      reorderThreshold: Math.max(0, Number(batchData.reorderThreshold) || 10),
    };
    setBatches((prev) => [newBatch, ...prev]);
  };

  const updateBatch = (id: string, updates: Partial<BatchItem>) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          ...updates,
          quantity: updates.quantity !== undefined ? Math.max(0, Number(updates.quantity)) : b.quantity,
          purchasePrice:
            updates.purchasePrice !== undefined
              ? Math.max(0, Number(updates.purchasePrice))
              : b.purchasePrice,
          sellingPrice:
            updates.sellingPrice !== undefined
              ? Math.max(0, Number(updates.sellingPrice))
              : b.sellingPrice,
        };
      })
    );
  };

  const deleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
    setCart((prev) => prev.filter((item) => item.batchId !== id));
  };

  const adjustStock = (id: string, deltaQuantity: number) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const newQty = Math.max(0, b.quantity + deltaQuantity);
        return { ...b, quantity: newQty };
      })
    );
  };

  // Cart & POS
  const addToCart = (batch: BatchItem, quantity: number = 1): boolean => {
    if (batch.quantity <= 0) return false;

    setCart((prev) => {
      const existing = prev.find((i) => i.batchId === batch.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, batch.quantity);
        return prev.map((item) =>
          item.batchId === batch.id
            ? {
                ...item,
                quantity: nextQty,
                availableStock: batch.quantity,
                total: nextQty * item.unitPrice,
              }
            : item
        );
      } else {
        const initialQty = Math.min(quantity, batch.quantity);
        const newItem: CartItem = {
          batchId: batch.id,
          medicineId: batch.medicineId,
          medicineName: batch.medicineName,
          genericName: batch.genericName,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          unitPrice: batch.sellingPrice,
          quantity: initialQty,
          availableStock: batch.quantity,
          total: initialQty * batch.sellingPrice,
        };
        return [...prev, newItem];
      }
    });
    return true;
  };

  const updateCartQuantity = (batchId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(batchId);
      return;
    }
    const batch = batches.find((b) => b.id === batchId);
    const maxQty = batch ? batch.quantity : 9999;
    const cappedQty = Math.min(quantity, maxQty);

    setCart((prev) =>
      prev.map((item) =>
        item.batchId === batchId
          ? {
              ...item,
              quantity: cappedQty,
              total: cappedQty * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeFromCart = (batchId: string) => {
    setCart((prev) => prev.filter((i) => i.batchId !== batchId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const checkoutCart = (params: {
    customerName: string;
    customerPhone?: string;
    paymentMethod: "Cash" | "UPI" | "Card";
    discountPercent?: number;
    notes?: string;
  }) => {
    if (cart.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Verify stock availability for all items
    for (const item of cart) {
      const b = batches.find((x) => x.id === item.batchId);
      if (!b || b.quantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.medicineName} (${b ? b.quantity : 0} available).`,
        };
      }
    }

    const { subtotal, discountAmount, taxAmount, totalAmount } = calculateBilling(
      cart,
      params.discountPercent || 0,
      settings.defaultTaxPercent
    );

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(invoices.length + 1),
      date: new Date().toISOString(),
      customerName: params.customerName.trim() || "Walk-in Customer",
      customerPhone: params.customerPhone?.trim() || undefined,
      items: cart.map((i) => ({
        batchId: i.batchId,
        medicineName: i.medicineName,
        genericName: i.genericName,
        batchNumber: i.batchNumber,
        expiryDate: i.expiryDate,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        total: i.total,
      })),
      subtotal,
      discountPercent: params.discountPercent || 0,
      discountAmount,
      taxPercent: settings.defaultTaxPercent,
      taxAmount,
      totalAmount,
      paymentMethod: params.paymentMethod,
      paymentStatus: "Completed",
      cashierName: settings.displayName,
      notes: params.notes,
    };

    // Deduct stock atomic update
    setBatches((prev) =>
      prev.map((b) => {
        const soldItem = cart.find((c) => c.batchId === b.id);
        if (soldItem) {
          return {
            ...b,
            quantity: Math.max(0, b.quantity - soldItem.quantity),
          };
        }
        return b;
      })
    );

    // Add invoice to history
    setInvoices((prev) => [newInvoice, ...prev]);

    // Clear cart
    setCart([]);

    return { success: true, invoice: newInvoice };
  };

  const refundInvoice = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv || inv.paymentStatus === "Refunded") return;

    // Restore stock
    setBatches((prev) =>
      prev.map((b) => {
        const refundedItem = inv.items.find((it) => it.batchId === b.id);
        if (refundedItem) {
          return { ...b, quantity: b.quantity + refundedItem.quantity };
        }
        return b;
      })
    );

    // Update invoice status
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, paymentStatus: "Refunded" } : i))
    );
  };

  const updateProfile = (newProfile: Partial<PharmacyProfile>) => {
    setProfile((prev) => ({ ...prev, ...newProfile }));
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToDemoData = () => {
    setBatches(initialBatches);
    setInvoices(initialInvoices);
    setProfile(initialPharmacyProfile);
    setSettings(initialUserSettings);
    setCart([]);
    try {
      localStorage.clear();
    } catch {}
  };

  // Aggregated medicine summaries (grouping batches by medicine)
  const medicineSummaries = useMemo<MedicineSummary[]>(() => {
    const map = new Map<string, BatchItem[]>();
    batches.forEach((b) => {
      const key = b.medicineName.toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });

    const summaries: MedicineSummary[] = [];
    map.forEach((bList) => {
      const first = bList[0];
      const totalQty = bList.reduce((acc, curr) => acc + curr.quantity, 0);
      const lowestPrice = Math.min(...bList.map((b) => b.sellingPrice));
      const sortedByExpiry = [...bList].sort(
        (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
      const earliestExpiry = sortedByExpiry[0]?.expiryDate || "";
      const threshold = Math.max(...bList.map((b) => b.reorderThreshold));

      summaries.push({
        id: first.medicineId,
        name: first.medicineName,
        genericName: first.genericName,
        category: first.category,
        manufacturer: first.manufacturer,
        totalQuantity: totalQty,
        lowestSellingPrice: lowestPrice,
        batches: bList,
        earliestExpiry,
        stockStatus: getStockStatus(totalQty, threshold),
        expiryStatus: getExpiryStatus(earliestExpiry, settings.lowStockAlertDays),
      });
    });

    return summaries.sort((a, b) => a.name.localeCompare(b.name));
  }, [batches, settings.lowStockAlertDays]);

  // Demand predictions
  const demandPredictions = useMemo<DemandPrediction[]>(() => {
    // Count units sold in past invoices for each medicine name
    const salesMap = new Map<string, number>();
    invoices.forEach((inv) => {
      if (inv.paymentStatus === "Completed") {
        inv.items.forEach((item) => {
          const key = item.medicineName.toLowerCase();
          salesMap.set(key, (salesMap.get(key) || 0) + item.quantity);
        });
      }
    });

    return medicineSummaries.map((summary) => {
      const unitsSold = (salesMap.get(summary.name.toLowerCase()) || 0) + 12; // baseline + actual sold
      const leadTimeDays = 5; // standard supplier delivery
      const dailyVelocity = unitsSold / 30;
      const forecastDemandNext30Days = Math.round(dailyVelocity * 30);
      const leadTimeDemand = Math.round(dailyVelocity * leadTimeDays);
      const safetyStock = Math.max(10, Math.round(dailyVelocity * 7)); // 7 days safety buffer

      // Formula: max(0, leadTimeDemand + safetyStock - currentStock)
      const rawSuggested = leadTimeDemand + safetyStock - summary.totalQuantity;
      const suggestedReorderQty = Math.max(0, rawSuggested);

      let recommendationStatus: "Immediate Reorder" | "Order Soon" | "Adequate Stock" | "Overstocked" = "Adequate Stock";
      let rationale = "";

      if (summary.totalQuantity === 0) {
        recommendationStatus = "Immediate Reorder";
        rationale = "Product is completely out of stock with ongoing patient demand.";
      } else if (suggestedReorderQty > 20) {
        recommendationStatus = "Immediate Reorder";
        rationale = `Available stock (${summary.totalQuantity}) falls below lead time (${leadTimeDays}d) + safety requirement (${safetyStock}).`;
      } else if (suggestedReorderQty > 0) {
        recommendationStatus = "Order Soon";
        rationale = `Current velocity (${dailyVelocity.toFixed(1)}/day) projects depletion within ${Math.round(summary.totalQuantity / Math.max(0.1, dailyVelocity))} days.`;
      } else if (summary.totalQuantity > (forecastDemandNext30Days * 2.5)) {
        recommendationStatus = "Overstocked";
        rationale = `Current stock exceeds 2.5 months of projected demand; avoid placing replenishment orders.`;
      } else {
        recommendationStatus = "Adequate Stock";
        rationale = `Inventory levels are well-balanced for the projected 30-day run rate.`;
      }

      const expiryRisk = summary.expiryStatus === "expired" ? "High" : summary.expiryStatus === "expiring-soon" ? "Medium" : "Low";

      return {
        medicineId: summary.id,
        medicineName: summary.name,
        genericName: summary.genericName,
        category: summary.category,
        currentStock: summary.totalQuantity,
        unitsSoldPast30Days: unitsSold,
        forecastDemandNext30Days,
        leadTimeDays,
        safetyStock,
        suggestedReorderQty,
        expiryRisk,
        recommendationStatus,
        rationale,
        confidence: unitsSold > 15 ? "High (Based on 30-day velocity)" : "Medium",
      };
    });
  }, [medicineSummaries, invoices]);

  // Key KPI stats
  const kpiStats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayInvoices = invoices.filter(
      (inv) => inv.date.startsWith(todayStr) && inv.paymentStatus === "Completed"
    );
    const todaySales = todayInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const lowStockCount = batches.filter(
      (b) => b.quantity > 0 && b.quantity <= b.reorderThreshold
    ).length;

    const expiringBatchesCount = batches.filter(
      (b) => getExpiryStatus(b.expiryDate, settings.lowStockAlertDays) === "expiring-soon"
    ).length;

    const expiredBatchesCount = batches.filter(
      (b) => getExpiryStatus(b.expiryDate) === "expired"
    ).length;

    return {
      todaySales,
      todayInvoicesCount: todayInvoices.length,
      totalProductsCount: medicineSummaries.length,
      totalBatchesCount: batches.length,
      lowStockCount,
      expiringBatchesCount,
      expiredBatchesCount,
    };
  }, [invoices, batches, medicineSummaries, settings.lowStockAlertDays]);

  return (
    <PharmacyContext.Provider
      value={{
        isInitialized,
        batches,
        invoices,
        profile,
        settings,
        cart,
        addBatch,
        updateBatch,
        deleteBatch,
        adjustStock,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        checkoutCart,
        refundInvoice,
        updateProfile,
        updateSettings,
        resetToDemoData,
        medicineSummaries,
        demandPredictions,
        kpiStats,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export function usePharmacy() {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error("usePharmacy must be used within a PharmacyProvider");
  }
  return context;
}
