# ApexCare Rx — Pharmacy Inventory & Sales Management System

A production-style frontend application for retail pharmacies, hospital dispensaries, and pharmacy chains. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Lucide React**, and **Recharts**.

Designed with a **high-contrast white and teal-green (`#0F766E`)** professional design system for fast, distraction-free pharmacy counter operations.

---

## 🌟 Key Features

### 1. Modern Landing Page
- Complete product showcase with live terminal preview card.
- Direct quick links to **Get Started**, **Pharmacist Sign In**, and **Interactive Demo**.
- Highlights FIFO batch management, zero negative stock enforcement, and GST tax rules in INR (`₹`).

### 2. Authentication & Store Onboarding (Frontend Demo)
- **Login Terminal**: 1-click **"Explore Demo Dashboard Directly"** bypass or pre-filled credentials.
- **Store Registration**: Chemist, proprietor, license, and branch registration.
- **3-Step Onboarding Wizard**: Guided setup for store profile, licensing, and opening medicine batches.

### 3. POS Billing Terminal
- Fast barcode & generic composition search.
- Dual-pane layout: Product shelf catalog on the left, live cart and invoice totals on the right.
- Quantity increment/decrement capped to actual batch stock (zero negative stock guarantee).
- Configurable GST tax rates and instant customer discounts.
- Atomic stock deduction and printable official tax invoice receipt.

### 4. Batch & Expiry Inventory Management
- Multi-batch tracking per medicine brand.
- Real-time stock status badges (`In Stock`, `Low Stock`, `Out of Stock`).
- Expiry horizon warnings (<90 days alert, expired quarantine).
- Stock adjustments (+ / -) with audit log notes.
- Complete CRUD operations with reactive state update across all pages.

### 5. Deterministic Demand Predictor
- Transparent inventory replenishment formula based on 30-day dispensing velocity, supplier lead time (5d), and safety buffer (7d):
  $$\text{Suggested Reorder} = \max(0, (\text{Daily Velocity} \times \text{Lead Time}) + \text{Safety Buffer} - \text{Available Stock})$$
- Detailed mathematical rationale drawer for every medicine SKU.

### 6. Sales Invoices & Refunds
- Full sales transaction history with search, date range filters, and payment method filters (UPI, Cash, Card).
- Atomic refund & restock workflow that restores quantities to specific lots.
- Print-ready invoice receipt generator.

### 7. Analytics & Visual Reports
- Solid-color line and bar charts (Recharts) tracking revenue and units dispensed.
- Therapeutic category distribution breakdown.
- Top revenue and high-velocity dispensing medicines.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Custom Teal-Green `#0F766E` Design System)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State & Storage**: React Context + LocalStorage persistence

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/oeshwar353-crypto/apex-care.git

# Navigate to project directory
cd apex-care

# Install dependencies
npm install

# Run the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 License & Demo Notes
This is a frontend-only demonstration system. License credentials, payment checkouts, and customer records operate client-side without storing sensitive user data.
