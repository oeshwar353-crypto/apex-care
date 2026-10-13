"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pill,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Boxes,
  FileCheck2,
  Info,
} from "lucide-react";
import { usePharmacy } from "@/lib/pharmacy-context";
import { BatchItem, MedicineCategory, PharmacyProfile } from "@/lib/types";
import { formatINR } from "@/lib/calculations";

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile, addBatch } = usePharmacy();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 State: Profile
  const [profileData, setProfileData] = useState<PharmacyProfile>({
    name: profile.name || "Apex Care Pharmacy & Druggists",
    ownerName: profile.ownerName || "Dr. Rajesh K. Sharma, B.Pharm",
    email: profile.email || "store@apexcarepharmacy.demo",
    phone: profile.phone || "+91 98201 54321",
    licenseNumber: profile.licenseNumber || "MH-TZ-2024-88492X (Demo License)",
    address: profile.address || "Shop No. 4, Ground Floor, Shanti Heights, Link Road",
    city: profile.city || "Mumbai, Maharashtra 400053",
    pharmacyType: profile.pharmacyType || "standalone",
    storeSize: profile.storeSize || "medium",
  });

  // Step 2 State: Medicines list
  const [medicines, setMedicines] = useState<
    Omit<BatchItem, "id" | "createdAt" | "medicineId">[]
  >([
    {
      medicineName: "Dolo 650 Tablet",
      genericName: "Paracetamol 650mg",
      category: "Analgesics & Pain" as MedicineCategory,
      manufacturer: "Micro Labs Ltd",
      batchNumber: "DL-2024-901",
      quantity: 150,
      purchasePrice: 24.5,
      sellingPrice: 32.0,
      expiryDate: "2027-08-31",
      reorderThreshold: 30,
    },
    {
      medicineName: "Augmentin 625 Duo",
      genericName: "Amoxicillin 500mg + Clavulanic Acid 125mg",
      category: "Antibiotics" as MedicineCategory,
      manufacturer: "GSK",
      batchNumber: "AUG-625-78",
      quantity: 50,
      purchasePrice: 145.0,
      sellingPrice: 201.5,
      expiryDate: "2027-05-30",
      reorderThreshold: 15,
    },
    {
      medicineName: "Pan 40 Tablet",
      genericName: "Pantoprazole Gastro-Resistant 40mg",
      category: "Gastrointestinal" as MedicineCategory,
      manufacturer: "Alkem Laboratories",
      batchNumber: "PAN-40-091",
      quantity: 100,
      purchasePrice: 95.0,
      sellingPrice: 155.0,
      expiryDate: "2027-12-31",
      reorderThreshold: 25,
    },
  ]);

  // Form for adding a new medicine in Step 2
  const [newMed, setNewMed] = useState({
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
  const [newMedError, setNewMedError] = useState("");

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.medicineName.trim()) {
      setNewMedError("Please enter medicine brand name.");
      return;
    }
    if (!newMed.batchNumber.trim()) {
      setNewMedError("Please enter batch number.");
      return;
    }
    if (newMed.sellingPrice < newMed.purchasePrice) {
      setNewMedError("Selling price cannot be less than purchase price.");
      return;
    }

    setMedicines([...medicines, { ...newMed }]);
    setNewMed({
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
    setNewMedError("");
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleCompleteOnboarding = () => {
    // Save profile
    updateProfile(profileData);

    // Save initial medicines
    medicines.forEach((m, idx) => {
      addBatch({
        ...m,
        medicineId: `med-onboard-${idx + 1}`,
      });
    });

    router.push("/dashboard");
  };

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F766E] text-white">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1F2937]">ApexCare Rx Store Setup Wizard</h1>
              <p className="text-xs text-[#64748B]">Complete first-time configuration in 3 structured steps</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-0 text-xs text-[#64748B] bg-white border border-[#E2E8F0] px-3 py-1.5 rounded">
            Step <span className="font-bold text-[#0F766E]">{currentStep}</span> of 3
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          <div
            className={`flex items-center gap-2 rounded-md border p-3 text-xs font-semibold ${
              currentStep === 1
                ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]"
                : currentStep > 1
                ? "border-[#BBF7D0] bg-[#FFFFFF] text-[#15803D]"
                : "border-[#E2E8F0] bg-[#FFFFFF] text-[#94A3B8]"
            }`}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <div className="truncate">1. Pharmacy Profile</div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-md border p-3 text-xs font-semibold ${
              currentStep === 2
                ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]"
                : currentStep > 2
                ? "border-[#BBF7D0] bg-[#FFFFFF] text-[#15803D]"
                : "border-[#E2E8F0] bg-[#FFFFFF] text-[#94A3B8]"
            }`}
          >
            <Boxes className="h-4 w-4 shrink-0" />
            <div className="truncate">2. Initial Inventory</div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-md border p-3 text-xs font-semibold ${
              currentStep === 3
                ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]"
                : "border-[#E2E8F0] bg-[#FFFFFF] text-[#94A3B8]"
            }`}
          >
            <FileCheck2 className="h-4 w-4 shrink-0" />
            <div className="truncate">3. Review & Launch</div>
          </div>
        </div>

        {/* Step 1: Pharmacy Profile */}
        {currentStep === 1 && (
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm">
            <div className="mb-5 border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#1F2937]">Step 1: Pharmacy Business Profile</h2>
              <p className="text-xs text-[#64748B]">Provide registered store, licensing and location information</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Pharmacy / Chemist Name *</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Proprietor / Pharmacist Name *</label>
                <input
                  type="text"
                  value={profileData.ownerName}
                  onChange={(e) => setProfileData({ ...profileData, ownerName: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Official Contact Email *</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Store Telephone / Mobile *</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Drug License / Registration No. *</label>
                <input
                  type="text"
                  value={profileData.licenseNumber}
                  onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
                <span className="text-[10px] text-[#64748B]">Treated as unverified demonstration license</span>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">City & State *</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#374151] mb-1">Complete Store Address *</label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Pharmacy Classification</label>
                <select
                  value={profileData.pharmacyType}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      pharmacyType: e.target.value as "standalone" | "doctor-associated",
                    })
                  }
                  className="w-full rounded border border-[#E2E8F0] bg-white px-3 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
                >
                  <option value="standalone">Standalone Retail Pharmacy</option>
                  <option value="doctor-associated">Clinic / Doctor-Associated Dispensary</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Inventory Scale / Store Size</label>
                <select
                  value={profileData.storeSize}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      storeSize: e.target.value as "small" | "medium" | "large",
                    })
                  }
                  className="w-full rounded border border-[#E2E8F0] bg-white px-3 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
                >
                  <option value="small">Small Retail (Under 500 SKUs)</option>
                  <option value="medium">Medium Dispensary (500 - 2,500 SKUs)</option>
                  <option value="large">Large / High-Volume Chemist (2,500+ SKUs)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 rounded bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#115E59]"
              >
                <span>Continue to Inventory</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Initial Inventory */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Quick add card */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
              <div className="mb-4 border-b border-[#E2E8F0] pb-2">
                <h2 className="text-sm font-bold text-[#1F2937]">Step 2: Enter Starting Medicines</h2>
                <p className="text-xs text-[#64748B]">Add medicines and batches to initialize your opening stock</p>
              </div>

              {newMedError && (
                <div className="mb-3 rounded border border-[#FECACA] bg-[#FEF2F2] p-2.5 text-xs text-[#B91C1C]">
                  {newMedError}
                </div>
              )}

              <form onSubmit={handleAddMedicine} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Brand Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dolo 650"
                    value={newMed.medicineName}
                    onChange={(e) => setNewMed({ ...newMed, medicineName: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-2.5 py-1.5 outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Generic Name / Composition</label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol 650mg"
                    value={newMed.genericName}
                    onChange={(e) => setNewMed({ ...newMed, genericName: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-2.5 py-1.5 outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Category</label>
                  <select
                    value={newMed.category}
                    onChange={(e) => setNewMed({ ...newMed, category: e.target.value as MedicineCategory })}
                    className="w-full rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 outline-none focus:border-[#0F766E]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Batch Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. DL-2024-901"
                    value={newMed.batchNumber}
                    onChange={(e) => setNewMed({ ...newMed, batchNumber: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-2.5 py-1.5 outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Micro Labs Ltd"
                    value={newMed.manufacturer}
                    onChange={(e) => setNewMed({ ...newMed, manufacturer: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-2.5 py-1.5 outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Opening Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={newMed.quantity}
                    onChange={(e) => setNewMed({ ...newMed, quantity: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-2.5 py-1.5 outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newMed.purchasePrice}
                    onChange={(e) => setNewMed({ ...newMed, purchasePrice: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-2.5 py-1.5 outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Selling Price / MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={newMed.sellingPrice}
                    onChange={(e) => setNewMed({ ...newMed, sellingPrice: Number(e.target.value) })}
                    className="w-full rounded border border-[#E2E8F0] px-2.5 py-1.5 outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    value={newMed.expiryDate}
                    onChange={(e) => setNewMed({ ...newMed, expiryDate: e.target.value })}
                    className="w-full rounded border border-[#E2E8F0] px-2.5 py-1.5 outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded border border-[#0F766E] bg-[#F0FDFA] px-3.5 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Medicine to Opening List</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of medicines added so far */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#1F2937]">
                  Configured Stock Items ({medicines.length})
                </h3>
                <span className="text-[11px] text-[#64748B]">Batch-level tracking enabled</span>
              </div>

              {medicines.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#64748B]">
                  No medicines added yet. Use the form above to add your first medicine.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B]">
                        <th className="py-2 px-3">Medicine & Generic</th>
                        <th className="py-2 px-3">Batch</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Sell Price</th>
                        <th className="py-2 px-3">Expiry</th>
                        <th className="py-2 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {medicines.map((m, idx) => (
                        <tr key={idx} className="hover:bg-[#F8FAFC]">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-[#1F2937]">{m.medicineName}</div>
                            <div className="text-[10px] text-[#64748B]">{m.genericName}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">{m.batchNumber}</td>
                          <td className="py-2.5 px-3 text-[#4B5563]">{m.category}</td>
                          <td className="py-2.5 px-3 text-right font-medium">{m.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-[#0F766E]">
                            {formatINR(m.sellingPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-[#64748B]">{m.expiryDate}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleRemoveMedicine(idx)}
                              className="rounded p-1 text-[#B91C1C] hover:bg-[#FEE2E2]"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="mt-6 flex justify-between border-t border-[#E2E8F0] pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 rounded border border-[#E2E8F0] px-3.5 py-2 text-xs font-medium text-[#4B5563] hover:bg-[#F8FAFC]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={medicines.length === 0}
                  className="flex items-center gap-1.5 rounded bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#115E59] disabled:opacity-60"
                >
                  <span>Review Configuration</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Final Confirmation */}
        {currentStep === 3 && (
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm">
            <div className="mb-5 border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#1F2937]">Step 3: Verification & Initial Stock Audit</h2>
              <p className="text-xs text-[#64748B]">Review your pharmacy setup details before launching the terminal</p>
            </div>

            {/* Profile Summary Box */}
            <div className="mb-6 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 mb-3">
                <span className="font-bold text-[#1F2937] uppercase tracking-wider text-[11px]">
                  Pharmacy Profile Information
                </span>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="font-semibold text-[#0F766E] hover:underline"
                >
                  Edit Profile
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-[10px] text-[#64748B]">Pharmacy Name:</div>
                  <div className="font-semibold text-[#1F2937]">{profileData.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B]">Pharmacist / Owner:</div>
                  <div className="font-semibold text-[#1F2937]">{profileData.ownerName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B]">License Number:</div>
                  <div className="font-semibold text-[#1F2937]">{profileData.licenseNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B]">Contact Email:</div>
                  <div className="font-medium text-[#1F2937]">{profileData.email}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B]">Phone:</div>
                  <div className="font-medium text-[#1F2937]">{profileData.phone}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B]">Location:</div>
                  <div className="font-medium text-[#1F2937]">{profileData.city}</div>
                </div>
              </div>
            </div>

            {/* Medicines Summary */}
            <div className="mb-6 rounded-md border border-[#E2E8F0] p-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 mb-3">
                <span className="font-bold text-[#1F2937] uppercase tracking-wider text-[11px]">
                  Initial Stock ({medicines.length} Medicines Ready)
                </span>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="font-semibold text-[#0F766E] hover:underline"
                >
                  Edit Medicines
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B]">
                      <th className="py-1.5 px-2">Medicine</th>
                      <th className="py-1.5 px-2">Batch</th>
                      <th className="py-1.5 px-2 text-right">Quantity</th>
                      <th className="py-1.5 px-2 text-right">Selling Price</th>
                      <th className="py-1.5 px-2">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {medicines.map((m, i) => (
                      <tr key={i}>
                        <td className="py-2 px-2 font-medium">{m.medicineName}</td>
                        <td className="py-2 px-2 font-mono text-[11px]">{m.batchNumber}</td>
                        <td className="py-2 px-2 text-right">{m.quantity}</td>
                        <td className="py-2 px-2 text-right font-medium text-[#0F766E]">
                          {formatINR(m.sellingPrice)}
                        </td>
                        <td className="py-2 px-2 text-[#64748B]">{m.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Demonstration Notice */}
            <div className="mb-6 rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-[#0F766E] shrink-0" />
                <span>
                  All initial inventory and store profile parameters will be synchronized directly into local application memory. You can add more stock or adjust anytime from the Inventory terminal.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between border-t border-[#E2E8F0] pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 rounded border border-[#E2E8F0] px-3.5 py-2 text-xs font-medium text-[#4B5563] hover:bg-[#F8FAFC]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                className="flex items-center gap-2 rounded bg-[#0F766E] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#115E59]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Setup & Launch Pharmacy Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
