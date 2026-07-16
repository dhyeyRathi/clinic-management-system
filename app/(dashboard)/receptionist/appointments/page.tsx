import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appointments Coordinator | Receptionist Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReceptionistAppointmentsClient from "./components/ReceptionistAppointmentsClient";

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all appointments with client and doctor profiles
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      status,
      reason,
      mode,
      notes,
      client_profiles (
        id,
        client_code,
        profiles (
          name
        )
      ),
      doctor_profiles (
        id,
        specialization,
        profiles (
          name
        )
      )
    `)
    .order("scheduled_at", { ascending: false });

  // Fetch active clients list for booking form dropdown
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

  // Fetch active doctors list for booking form dropdown
  const { data: doctors } = await supabase
    .from("doctor_profiles")
    .select(`
      id,
      specialization,
      profiles!inner (
        name,
        status,
        role
      )
    `)
    .eq("profiles.status", "ACTIVE")
    .eq("profiles.role", "DOCTOR")
    .order("name", { referencedTable: "profiles", ascending: true });

  // Format appointments relations safely
  const formattedAppointments = (appointments || []).map((app: any) => {
    const clientProfile = app.client_profiles;
    const clientInfo = Array.isArray(clientProfile) ? clientProfile[0] : clientProfile;
    const clientUser = clientInfo?.profiles;
    const innerClientUser = Array.isArray(clientUser) ? clientUser[0] : clientUser;

    const docProfile = app.doctor_profiles;
    const docInfo = Array.isArray(docProfile) ? docProfile[0] : docProfile;
    const docUser = docInfo?.profiles;
    const innerDocUser = Array.isArray(docUser) ? docUser[0] : docUser;

    return {
      id: app.id,
      scheduled_at: app.scheduled_at,
      status: app.status,
      reason: app.reason,
      mode: app.mode,
      notes: app.notes,
      client: {
        id: clientInfo?.id || "",
        client_code: clientInfo?.client_code || "Unknown MRN",
        name: innerClientUser?.name || "Unknown Patient",
      },
      doctor: {
        id: docInfo?.id || "",
        name: innerDocUser?.name ? `Dr. ${innerDocUser.name}` : "Unknown Doctor",
        specialization: docInfo?.specialization || "General Medicine",
      },
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

  // Format doctors dropdown list
  const formattedDoctors = (doctors || []).map((d: any) => {
    const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
    return {
      id: d.id,
      name: profile?.name ? `Dr. ${profile.name}` : "Unknown Doctor",
      specialization: d.specialization,
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Appointments Desk</h1>
        <p className="text-muted text-sm mt-1">
          Approve online requests, check in active visits, or schedule new appointments at the counter.
        </p>
      </div>

      <ReceptionistAppointmentsClient
        appointments={formattedAppointments}
        clients={formattedClients}
        doctors={formattedDoctors}
      />
    </div>
  );
}
