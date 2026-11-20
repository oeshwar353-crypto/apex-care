"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
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
import { createClient, isSupabaseConfigured } from "./supabase/client";
import { useAuth } from "./auth-context";

interface PharmacyContextType {
  isInitialized: boolean;
  isRealtimeConnected: boolean;
  batches: BatchItem[];
  invoices: Invoice[];
  profile: PharmacyProfile;
  settings: UserSettings;
  cart: CartItem[];
  // Inventory actions
  addBatch: (batch: Omit<BatchItem, "id" | "createdAt">) => Promise<void>;
  updateBatch: (id: string, updates: Partial<BatchItem>) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  adjustStock: (id: string, deltaQuantity: number, reason?: string) => Promise<void>;
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
  }) => Promise<{ success: boolean; invoice?: Invoice; error?: string }>;
  // Invoices
  refundInvoice: (invoiceId: string) => Promise<void>;
  // Settings & Profile
  updateProfile: (profile: Partial<PharmacyProfile>) => Promise<void>;
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
  BATCHES: "pharmacy_batches_v2",
  INVOICES: "pharmacy_invoices_v2",
  PROFILE: "pharmacy_profile_v2",
  SETTINGS: "pharmacy_settings_v2",
  CART: "pharmacy_cart_v2",
};

// Database mappers
function mapBatchFromDb(row: any): BatchItem {
  return {
    id: row.id,
    medicineId: row.medicine_id,
    medicineName: row.medicine_name,
    genericName: row.generic_name || "",
    category: row.category || "Analgesics & Pain",
    manufacturer: row.manufacturer || "",
    batchNumber: row.batch_number,
    quantity: Number(row.quantity) || 0,
    purchasePrice: Number(row.purchase_price) || 0,
    sellingPrice: Number(row.selling_price) || 0,
    expiryDate: row.expiry_date,
    reorderThreshold: Number(row.reorder_threshold) || 10,
    createdAt: row.created_at ? row.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

function mapInvoiceFromDb(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    date: row.date,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || undefined,
    items: typeof row.items === "string" ? JSON.parse(row.items) : row.items || [],
    subtotal: Number(row.subtotal) || 0,
    discountPercent: Number(row.discount_percent) || 0,
    discountAmount: Number(row.discount_amount) || 0,
    taxPercent: Number(row.tax_percent) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paymentMethod: row.payment_method || "Cash",
    paymentStatus: row.payment_status || "Completed",
    cashierName: row.cashier_name || "Pharmacist",
    notes: row.notes || undefined,
  };
}

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabaseUser, user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const [batches, setBatches] = useState<BatchItem[]>(initialBatches);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [profile, setProfile] = useState<PharmacyProfile>(initialPharmacyProfile);
  const [settings, setSettings] = useState<UserSettings>(initialUserSettings);
  const [cart, setCart] = useState<CartItem[]>([]);

  const supabaseRef = useRef(createClient());
  const userIdRef = useRef<string | null>(null);

  // Sync ref with current auth state
  userIdRef.current = supabaseUser?.id || null;

  // 1. Initial Data Loading & Realtime Subscription
  useEffect(() => {
    let channel: any = null;
    const supabase = supabaseRef.current;
    const isConfigured = isSupabaseConfigured();

    async function loadData() {
      if (isConfigured && supabase && supabaseUser?.id) {
        try {
          const uid = supabaseUser.id;

          // A. Fetch profile
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", uid)
            .maybeSingle();

          if (dbProfile) {
            setProfile({
              name: dbProfile.pharmacy_name || initialPharmacyProfile.name,
              ownerName: dbProfile.owner_name || initialPharmacyProfile.ownerName,
              email: dbProfile.email || supabaseUser.email || initialPharmacyProfile.email,
              phone: dbProfile.phone || initialPharmacyProfile.phone,
              licenseNumber: dbProfile.license_number || initialPharmacyProfile.licenseNumber,
              address: dbProfile.address || initialPharmacyProfile.address,
              city: dbProfile.city || initialPharmacyProfile.city,
              pharmacyType: (dbProfile.pharmacy_type as any) || initialPharmacyProfile.pharmacyType,
              storeSize: (dbProfile.store_size as any) || initialPharmacyProfile.storeSize,
            });
          }

          // B. Fetch batches
          const { data: dbBatches } = await supabase
            .from("inventory_batches")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false });

          if (dbBatches && dbBatches.length > 0) {
            setBatches(dbBatches.map(mapBatchFromDb));
          } else {
            // Fresh account with no batches saved yet in Supabase
            // Use initial clean starting batch
            setBatches(initialBatches);
          }

          // C. Fetch invoices
          const { data: dbInvoices } = await supabase
            .from("invoices")
            .select("*")
            .eq("user_id", uid)
            .order("date", { ascending: false });

          if (dbInvoices) {
            setInvoices(dbInvoices.map(mapInvoiceFromDb));
          }

          // D. Setup Supabase Realtime Channel
          channel = supabase
            .channel(`realtime-pharmacy-${uid}`)
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "inventory_batches", filter: `user_id=eq.${uid}` },
              (payload) => {
                if (payload.eventType === "INSERT") {
                  const item = mapBatchFromDb(payload.new);
                  setBatches((prev) => [item, ...prev.filter((b) => b.id !== item.id)]);
                } else if (payload.eventType === "UPDATE") {
                  const updated = mapBatchFromDb(payload.new);
                  setBatches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
                } else if (payload.eventType === "DELETE") {
                  setBatches((prev) => prev.filter((b) => b.id !== (payload.old as any).id));
                }
              }
            )
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "invoices", filter: `user_id=eq.${uid}` },
              (payload) => {
                if (payload.eventType === "INSERT") {
                  const inv = mapInvoiceFromDb(payload.new);
                  setInvoices((prev) => [inv, ...prev.filter((i) => i.id !== inv.id)]);
                } else if (payload.eventType === "UPDATE") {
                  const updated = mapInvoiceFromDb(payload.new);
                  setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                }
              }
            )
            .on(
              "postgres_changes",
              { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
              (payload) => {
                const p = payload.new;
                setProfile((prev) => ({
                  ...prev,
                  name: p.pharmacy_name || prev.name,
                  ownerName: p.owner_name || prev.ownerName,
                  email: p.email || prev.email,
                  phone: p.phone || prev.phone,
                  licenseNumber: p.license_number || prev.licenseNumber,
                  address: p.address || prev.address,
                  city: p.city || prev.city,
                  pharmacyType: p.pharmacy_type || prev.pharmacyType,
                  storeSize: p.store_size || prev.storeSize,
                }));
              }
            )
            .subscribe((status) => {
              setIsRealtimeConnected(status === "SUBSCRIBED");
            });
        } catch (e) {
          console.error("Error loading real-time data from Supabase:", e);
        } finally {
          setIsInitialized(true);
        }
      } else {
        // Fallback for demo mode / offline storage
        try {
          const storedBatches = localStorage.getItem(STORAGE_KEYS.BATCHES);
          const storedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
          const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
          const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

          if (storedBatches) setBatches(JSON.parse(storedBatches));
          if (storedInvoices) setInvoices(JSON.parse(storedInvoices));
          if (storedProfile) setProfile(JSON.parse(storedProfile));
          if (storedSettings) setSettings(JSON.parse(storedSettings));
        } catch (e) {
          console.warn("Storage load error:", e);
        } finally {
          setIsInitialized(true);
        }
      }
    }

    loadData();

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabaseUser]);

  // Persist demo state changes in localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {}
  }, [batches, invoices, profile, settings, cart, isInitialized]);

  // Inventory CRUD with Supabase Realtime persistence
  const addBatch = async (batchData: Omit<BatchItem, "id" | "createdAt">) => {
    const newBatch: BatchItem = {
      ...batchData,
      id: `batch-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      quantity: Math.max(0, Number(batchData.quantity) || 0),
      purchasePrice: Math.max(0, Number(batchData.purchasePrice) || 0),
      sellingPrice: Math.max(0, Number(batchData.sellingPrice) || 0),
      reorderThreshold: Math.max(0, Number(batchData.reorderThreshold) || 10),
    };

    // Optimistic UI update
    setBatches((prev) => [newBatch, ...prev]);

    // Persist to Supabase if authenticated
    const supabase = supabaseRef.current;
    const uid = userIdRef.current;
    if (supabase && uid) {
      try {
        await supabase.from("inventory_batches").insert({
          id: newBatch.id,
          user_id: uid,
          medicine_id: newBatch.medicineId,
          medicine_name: newBatch.medicineName,
          generic_name: newBatch.genericName,
          category: newBatch.category,
          manufacturer: newBatch.manufacturer,
          batch_number: newBatch.batchNumber,
          quantity: newBatch.quantity,
          purchase_price: newBatch.purchasePrice,
          selling_price: newBatch.sellingPrice,
          expiry_date: newBatch.expiryDate,
          reorder_threshold: newBatch.reorderThreshold,
        });
      } catch (err) {
        console.error("Failed to insert batch into Supabase:", err);
      }
    }
  };

  const updateBatch = async (id: string, updates: Partial<BatchItem>) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          ...updates,
          quantity: updates.quantity !== undefined ? Math.max(0, Number(updates.quantity)) : b.quantity,
          purchasePrice:
            updates.purchasePrice !== undefined ? Math.max(0, Number(updates.purchasePrice)) : b.purchasePrice,
          sellingPrice:
            updates.sellingPrice !== undefined ? Math.max(0, Number(updates.sellingPrice)) : b.sellingPrice,
        };
      })
    );

    const supabase = supabaseRef.current;
    const uid = userIdRef.current;
    if (supabase && uid) {
      const dbUpdates: any = {};
      if (updates.medicineName) dbUpdates.medicine_name = updates.medicineName;
      if (updates.genericName !== undefined) dbUpdates.generic_name = updates.genericName;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.manufacturer !== undefined) dbUpdates.manufacturer = updates.manufacturer;
      if (updates.batchNumber) dbUpdates.batch_number = updates.batchNumber;
      if (updates.quantity !== undefined) dbUpdates.quantity = Math.max(0, Number(updates.quantity));
      if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = Math.max(0, Number(updates.purchasePrice));
      if (updates.sellingPrice !== undefined) dbUpdates.selling_price = Math.max(0, Number(updates.sellingPrice));
      if (updates.expiryDate) dbUpdates.expiry_date = updates.expiryDate;
      if (updates.reorderThreshold !== undefined) dbUpdates.reorder_threshold = Number(updates.reorderThreshold);

      try {
        await supabase.from("inventory_batches").update(dbUpdates).eq("id", id).eq("user_id", uid);
      } catch (err) {
        console.error("Failed to update batch in Supabase:", err);
      }
    }
  };

  const deleteBatch = async (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
    setCart((prev) => prev.filter((item) => item.batchId !== id));

    const supabase = supabaseRef.current;
    const uid = userIdRef.current;
    if (supabase && uid) {
      try {
        await supabase.from("inventory_batches").delete().eq("id", id).eq("user_id", uid);
      } catch (err) {
        console.error("Failed to delete batch from Supabase:", err);
      }
    }
  };

  const adjustStock = async (id: string, deltaQuantity: number) => {
    let finalQty = 0;
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        finalQty = Math.max(0, b.quantity + deltaQuantity);
        return { ...b, quantity: finalQty };
      })
    );

    const supabase = supabaseRef.current;
    const uid = userIdRef.current;
    if (supabase && uid) {
      try {
        await supabase
          .from("inventory_batches")
          .update({ quantity: finalQty })
          .eq("id", id)
          .eq("user_id", uid);
      } catch (err) {
        console.error("Failed to adjust stock in Supabase:", err);
      }
    }
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

  const checkoutCart = async (params: {
    customerName: string;
    customerPhone?: string;
    paymentMethod: "Cash" | "UPI" | "Card";
    discountPercent?: number;
    notes?: string;
  }) => {
    if (cart.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Verify stock availability
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
      cashierName: user?.displayName || settings.displayName,
      notes: params.notes,
    };

    // Deduct stock locally
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

    // Real-time synchronization to Supabase
    const supabase = supabaseRef.current;
    const uid = userIdRef.current;
    if (supabase && uid) {
      try {
        // 1. Insert invoice
        await supabase.from("invoices").insert({
          id: newInvoice.id,
          user_id: uid,
          invoice_number: newInvoice.invoiceNumber,
          date: newInvoice.date,
          customer_name: newInvoice.customerName,
          customer_phone: newInvoice.customerPhone,
          items: newInvoice.items,
          subtotal: newInvoice.subtotal,
          discount_percent: newInvoice.discountPercent,
          discount_amount: newInvoice.discountAmount,
          tax_percent: newInvoice.taxPercent,
          tax_amount: newInvoice.taxAmount,
          total_amount: newInvoice.totalAmount,
          payment_method: newInvoice.paymentMethod,
          payment_status: newInvoice.paymentStatus,
          cashier_name: newInvoice.cashierName,
          notes: newInvoice.notes,
        });

        // 2. Decrement stock on Supabase for each sold item
        for (const item of newInvoice.items) {
          const currentBatch = batches.find((b) => b.id === item.batchId);
          if (currentBatch) {
            const nextQty = Math.max(0, currentBatch.quantity - item.quantity);
            await supabase
              .from("inventory_batches")
              .update({ quantity: nextQty })
              .eq("id", item.batchId)
              .eq("user_id", uid);
          }
        }
      } catch (err) {
        console.error("Failed to sync invoice to Supabase:", err);
      }
    }

    return { success: true, invoice: newInvoice };
  };

  const refundInvoice = async (invoiceId: string) => {
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

    // Sync refund to Supabase
    const supabase = supabaseRef.current;
    const uid = userIdRef.current;
    if (supabase && uid) {
      try {
        await supabase
          .from("invoices")
          .update({ payment_status: "Refunded" })
          .eq("id", invoiceId)
          .eq("user_id", uid);

        for (const item of inv.items) {
          const currentBatch = batches.find((b) => b.id === item.batchId);
          if (currentBatch) {
            await supabase
              .from("inventory_batches")
              .update({ quantity: currentBatch.quantity + item.quantity })
              .eq("id", item.batchId)
              .eq("user_id", uid);
          }
        }
      } catch (err) {
        console.error("Failed to refund invoice in Supabase:", err);
      }
    }
  };

  const updateProfile = async (newProfile: Partial<PharmacyProfile>) => {
    setProfile((prev) => ({ ...prev, ...newProfile }));

    const supabase = supabaseRef.current;
    const uid = userIdRef.current;
    if (supabase && uid) {
      try {
        await supabase
          .from("profiles")
          .upsert({
            id: uid,
            pharmacy_name: newProfile.name,
            owner_name: newProfile.ownerName,
            email: newProfile.email,
            phone: newProfile.phone,
            license_number: newProfile.licenseNumber,
            address: newProfile.address,
            city: newProfile.city,
            pharmacy_type: newProfile.pharmacyType,
            store_size: newProfile.storeSize,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.error("Failed to update profile in Supabase:", err);
      }
    }
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
      const unitsSold = salesMap.get(summary.name.toLowerCase()) || 0;
      const leadTimeDays = 5;
      const dailyVelocity = unitsSold > 0 ? unitsSold / 30 : 0.5;
      const forecastDemandNext30Days = Math.max(1, Math.round(dailyVelocity * 30));
      const leadTimeDemand = Math.round(dailyVelocity * leadTimeDays);
      const safetyStock = Math.max(5, Math.round(dailyVelocity * 7));

      const rawSuggested = leadTimeDemand + safetyStock - summary.totalQuantity;
      const suggestedReorderQty = Math.max(0, rawSuggested);

      let recommendationStatus: "Immediate Reorder" | "Order Soon" | "Adequate Stock" | "Overstocked" = "Adequate Stock";
      let rationale = "";

      if (summary.totalQuantity === 0) {
        recommendationStatus = "Immediate Reorder";
        rationale = "Product is completely out of stock with active patient inquiries.";
      } else if (suggestedReorderQty > 15) {
        recommendationStatus = "Immediate Reorder";
        rationale = `Available stock (${summary.totalQuantity}) falls below lead time buffer (${safetyStock} safety).`;
      } else if (suggestedReorderQty > 0) {
        recommendationStatus = "Order Soon";
        rationale = `Current velocity (${dailyVelocity.toFixed(1)}/day) projects stock depletion in ${Math.round(summary.totalQuantity / Math.max(0.1, dailyVelocity))} days.`;
      } else if (summary.totalQuantity > (forecastDemandNext30Days * 2.5)) {
        recommendationStatus = "Overstocked";
        rationale = "Current stock exceeds 2.5 months of projected demand; avoid replenishment orders.";
      } else {
        recommendationStatus = "Adequate Stock";
        rationale = "Inventory levels are healthy for the projected 30-day run rate.";
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
        confidence: unitsSold > 5 ? "High (Based on 30-day velocity)" : "Medium",
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
        isRealtimeConnected,
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
