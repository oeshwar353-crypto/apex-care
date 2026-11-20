import { BatchItem, Invoice, PharmacyProfile, UserSettings } from "./types";

export const initialPharmacyProfile: PharmacyProfile = {
  name: "",
  ownerName: "",
  email: "",
  phone: "",
  licenseNumber: "",
  address: "",
  city: "",
  pharmacyType: "standalone",
  storeSize: "medium",
};

export const initialUserSettings: UserSettings = {
  displayName: "Pharmacist",
  email: "",
  role: "Pharmacist Admin",
  defaultTaxPercent: 5.0,
  tablePageSize: 10,
  lowStockAlertDays: 90,
  theme: "light",
};

export const initialBatches: BatchItem[] = [];

export const initialInvoices: Invoice[] = [];
