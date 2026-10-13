export type MedicineCategory =
  | "Antibiotics"
  | "Analgesics & Pain"
  | "Antidiabetics"
  | "Cardiovascular"
  | "Respiratory"
  | "Gastrointestinal"
  | "Vitamins & Minerals"
  | "Dermatological"
  | "Pediatric"
  | "Endocrine & Thyroid";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";
export type ExpiryStatus = "good" | "expiring-soon" | "expired";

export interface BatchItem {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: MedicineCategory;
  manufacturer: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string; // YYYY-MM-DD
  reorderThreshold: number;
  createdAt: string;
}

export interface MedicineSummary {
  id: string;
  name: string;
  genericName: string;
  category: MedicineCategory;
  manufacturer: string;
  totalQuantity: number;
  lowestSellingPrice: number;
  batches: BatchItem[];
  earliestExpiry: string;
  stockStatus: StockStatus;
  expiryStatus: ExpiryStatus;
}

export interface CartItem {
  batchId: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  total: number;
}

export type PaymentMethod = "Cash" | "UPI" | "Card";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  customerName: string;
  customerPhone?: string;
  items: {
    batchId: string;
    medicineName: string;
    genericName: string;
    batchNumber: string;
    expiryDate: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "Completed" | "Refunded";
  cashierName: string;
  notes?: string;
}

export interface PharmacyProfile {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  address: string;
  city: string;
  pharmacyType: "standalone" | "doctor-associated";
  storeSize: "small" | "medium" | "large";
}

export interface UserSettings {
  displayName: string;
  email: string;
  role: string;
  defaultTaxPercent: number;
  tablePageSize: number;
  lowStockAlertDays: number;
  theme: "light" | "dark";
}

export interface DemandPrediction {
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: MedicineCategory;
  currentStock: number;
  unitsSoldPast30Days: number;
  forecastDemandNext30Days: number;
  leadTimeDays: number;
  safetyStock: number;
  suggestedReorderQty: number;
  expiryRisk: "Low" | "Medium" | "High";
  recommendationStatus: "Immediate Reorder" | "Order Soon" | "Adequate Stock" | "Overstocked";
  rationale: string;
  confidence: "High (Based on 30-day velocity)" | "Medium" | "Low (Sparse sales history)";
}
