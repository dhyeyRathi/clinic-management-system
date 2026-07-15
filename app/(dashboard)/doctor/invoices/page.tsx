import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DoctorInvoicesClient from "./components/DoctorInvoicesClient";

export default async function DoctorInvoicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the doctor's profile to verify and filter
  const { data: doctorProfile } = await supabase
    .from("doctor_profiles")
    .select("id, specialization, profiles(name)")
    .eq("user_id", user.id)
    .single();

  if (!doctorProfile) {
    return (
      <div className="p-6 text-center text-muted">
        Doctor profile not found.
      </div>
    );
  }

  const doctorName = (doctorProfile.profiles as any)?.name || "";

  // Use the normal client since Doctor now has RLS select policy
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_no,
      doctor_id,
      subtotal,
      tax,
      discount,
      total,
      payment_status,
      payment_method,
      created_at,
      created_by,
      pdf_url,
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

  // Filter invoices to only show invoices created by this doctor, assigned to this doctor, or that contain a consultation item for this doctor
  const doctorInvoices = (invoices || [])
    .filter((inv: any) => {
      // 1. Explicitly assigned to this doctor
      if (inv.doctor_id === doctorProfile.id) return true;

      // 2. Created by this doctor
      if (inv.created_by === user.id) return true;
      
      // 3. Contains a consultation item referring to this doctor
      const hasDocItem = inv.invoice_items?.some((item: any) => {
        const descLower = item.description.toLowerCase();
        return (
          item.item_type === "CONSULTATION" &&
          (descLower.includes(doctorProfile.specialization.toLowerCase()) ||
           (doctorName && descLower.includes(doctorName.toLowerCase())))
        );
      });
      return hasDocItem;
    })
    .map((inv: any) => {
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
        pdf_url: inv.pdf_url,
        client: {
          client_code: clientInfo?.client_code || "Unknown MRN",
          name: innerClientUser?.name || "Unknown Patient",
        },
        invoice_items: inv.invoice_items || [],
      };
    });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Billing & Invoices</h1>
        <p className="text-muted text-sm mt-1">
          Review consultation invoices generated for your appointments.
        </p>
      </div>

      <DoctorInvoicesClient invoices={doctorInvoices} />
    </div>
  );
}
