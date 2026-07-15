import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReceptionistInvoicesClient from "./components/ReceptionistInvoicesClient";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all invoices with items and client details
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
      client_profiles (
        client_code,
        profiles (
          name
        )
      ),
      invoice_items (
        id,
        item_type,
        description,
        unit_price,
        quantity,
        total_price
      )
    `)
    .order("created_at", { ascending: false });

  // Fetch active clients list for new invoice creation
  const { data: clients } = await supabase
    .from("client_profiles")
    .select(`
      id,
      client_code,
      profiles!inner (
        name,
        status,
        role
      )
    `)
    .eq("profiles.status", "ACTIVE")
    .eq("profiles.role", "CLIENT")
    .order("name", { referencedTable: "profiles", ascending: true });

  // Format invoices relations safely
  const formattedInvoices = (invoices || []).map((inv: any) => {
    const clientProfile = inv.client_profiles;
    const clientInfo = Array.isArray(clientProfile) ? clientProfile[0] : clientProfile;
    const clientUser = clientInfo?.profiles;
    const innerClientUser = Array.isArray(clientUser) ? clientUser[0] : clientUser;

    return {
      id: inv.id,
      invoice_no: inv.invoice_no,
      subtotal: inv.subtotal,
      tax: inv.tax,
      discount: inv.discount,
      total: inv.total,
      payment_status: inv.payment_status,
      payment_method: inv.payment_method,
      created_at: inv.created_at,
      client: {
        id: clientInfo?.id || "",
        client_code: clientInfo?.client_code || "Unknown MRN",
        name: innerClientUser?.name || "Unknown Patient",
      },
      invoice_items: inv.invoice_items || [],
    };
  });

  // Format clients dropdown list
  const formattedClients = (clients || []).map((c: any) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    return {
      id: c.id,
      client_code: c.client_code,
      name: profile?.name || "Unknown Patient",
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Billing Desk</h1>
        <p className="text-muted text-sm mt-1">
          Generate medical bills, calculate taxes/discounts, and print invoices.
        </p>
      </div>

      <ReceptionistInvoicesClient
        invoices={formattedInvoices}
        clients={formattedClients}
      />
    </div>
  );
}
