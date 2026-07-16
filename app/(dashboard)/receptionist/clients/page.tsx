import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Patients | Receptionist Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReceptionistClientsClient from "./components/ReceptionistClientsClient";

export default async function ClientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all registered clients and demographics
  const { data: clients } = await supabase
    .from("client_profiles")
    .select(`
      id,
      client_code,
      date_of_birth,
      gender,
      address,
      emergency_contact,
      profiles!inner (
        name,
        email,
        phone,
        avatar_url,
        status,
        role
      )
    `)
    .eq("profiles.role", "CLIENT")
    .order("created_at", { ascending: false });

  const formattedClients = (clients || []).map((c: any) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    return {
      id: c.id,
      client_code: c.client_code,
      date_of_birth: c.date_of_birth,
      gender: c.gender,
      address: c.address,
      emergency_contact: c.emergency_contact,
      name: profile?.name || "Unknown Patient",
      email: profile?.email || "",
      phone: profile?.phone || "",
      avatar_url: profile?.avatar_url || null,
      status: profile?.status || "ACTIVE",
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Client Directory</h1>
        <p className="text-muted text-sm mt-1">
          Register new patients to the clinic database and manage active records.
        </p>
      </div>

      <ReceptionistClientsClient initialClients={formattedClients} />
    </div>
  );
}
