import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvoicesClient from "./components/InvoicesClient";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get patient's client profile ID
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!clientProfile) {
    return (
      <div className="p-6 text-center text-muted">
        Client profile not found.
      </div>
    );
  }

  // Fetch client's invoices with items
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_no,
      subtotal,
      tax,
      discount,
      total,
      payment_status,
      payment_method,
      created_at,
      pdf_url,
      invoice_items (
        id,
        item_type,
        description,
        unit_price,
        quantity,
        total_price
      )
    `)
    .eq("client_id", clientProfile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Billing & Invoices</h1>
        <p className="text-muted text-sm mt-1">
          Review your medical bills, payment statuses, and invoice item breakdowns.
        </p>
      </div>

      <InvoicesClient initialInvoices={invoices || []} />
    </div>
  );
}
