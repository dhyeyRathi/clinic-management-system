import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finance Ledger | Manager Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import FinanceClient from "./components/FinanceClient";

async function getInvoices() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      client:client_profiles(
        client_code,
        profile:profiles(name)
      ),
      invoice_items(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load invoices list:", error.message);
    return [];
  }

  return data || [];
}

export default async function FinancePage() {
  const invoices = await getInvoices();

  // Calculate totals
  const totalRevenue = invoices
    .filter((inv) => inv.payment_status === "PAID")
    .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

  const pendingRevenue = invoices
    .filter((inv) => inv.payment_status === "UNPAID" || inv.payment_status === "PARTIAL")
    .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-heading">Finance & Billing</h1>
        <p className="text-muted text-sm mt-1">
          Review patient invoice sheets, calculate revenue collection, and track payment receipts.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold text-muted uppercase">Total Collected Revenue</span>
          <p className="text-3xl font-extrabold text-success">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold text-muted uppercase">Outstanding / Pending Revenue</span>
          <p className="text-3xl font-extrabold text-warning">${pendingRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold text-muted uppercase">Total Generated Invoices</span>
          <p className="text-3xl font-extrabold text-primary">{invoices.length}</p>
        </div>
      </div>

      {/* Interactive Invoices Desk */}
      <FinanceClient initialInvoices={invoices} />
    </div>
  );
}
