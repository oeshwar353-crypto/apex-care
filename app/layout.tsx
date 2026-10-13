import type { Metadata } from "next";
import "./globals.css";
import { PharmacyProvider } from "@/lib/pharmacy-context";

export const metadata: Metadata = {
  title: "Apex Care - Pharmacy Inventory & Sales Management System",
  description:
    "Professional pharmacy operations, batch tracking, point of sale billing, sales history, and demand forecasting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
        <PharmacyProvider>{children}</PharmacyProvider>
      </body>
    </html>
  );
}
