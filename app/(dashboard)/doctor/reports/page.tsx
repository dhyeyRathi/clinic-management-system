import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Reports Publisher | Doctor Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DoctorReportsClient from "./components/DoctorReportsClient";

export default async function ReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get doctor's profile ID
  const { data: doctorProfile } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!doctorProfile) {
    return (
      <div className="p-6 text-center text-muted">
        Doctor profile details not found.
      </div>
    );
  }

  // Fetch only clients who have had at least one appointment with this specific doctor
  const { data: clientAppointments } = await supabase
    .from("appointments")
    .select(`
      client_profiles!inner (
        id,
        client_code,
        profiles!inner (
          name,
          email,
          status
        )
      )
    `)
    .eq("doctor_id", doctorProfile.id)
    .eq("client_profiles.profiles.status", "ACTIVE");

  // Filter unique clients
  const uniqueClientsMap = new Map<string, any>();
  (clientAppointments || []).forEach((app: any) => {
    const cp = app.client_profiles;
    const clientInfo = Array.isArray(cp) ? cp[0] : cp;
    if (clientInfo && !uniqueClientsMap.has(clientInfo.id)) {
      const profile = Array.isArray(clientInfo.profiles) ? clientInfo.profiles[0] : clientInfo.profiles;
      uniqueClientsMap.set(clientInfo.id, {
        id: clientInfo.id,
        client_code: clientInfo.client_code,
        name: profile?.name || "Unknown Patient",
        email: profile?.email || "",
      });
    }
  });

  const formattedClients = Array.from(uniqueClientsMap.values());

  // Fetch active lab test types catalog to let doctor select recommendations
  const { data: labTests } = await supabase
    .from("lab_test_types")
    .select("id, name, price")
    .eq("status", "ACTIVE")
    .order("name", { ascending: true });

  // Fetch past reports issued by this doctor
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      id,
      title,
      description,
      file_url,
      created_at,
      client_profiles (
        client_code,
        profiles (
          name
        )
      )
    `)
    .eq("doctor_id", doctorProfile.id)
    .order("created_at", { ascending: false });

  // Format past reports
  const formattedReports = (reports || []).map((rep: any) => {
    const clientProfile = rep.client_profiles;
    const clientInfo = Array.isArray(clientProfile) ? clientProfile[0] : clientProfile;
    const clientUser = clientInfo?.profiles;
    const innerClientUser = Array.isArray(clientUser) ? clientUser[0] : clientUser;

    return {
      id: rep.id,
      title: rep.title,
      description: rep.description,
      file_url: rep.file_url,
      created_at: rep.created_at,
      client_name: innerClientUser?.name || "Unknown Patient",
      client_code: clientInfo?.client_code || "Unknown MRN",
    };
  });



  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Clinical Reports Portal</h1>
        <p className="text-muted text-sm mt-1">
          Issue new clinical summaries, write diagnoses, recommend catalog lab tests, and upload secure PDFs.
        </p>
      </div>

      <DoctorReportsClient
        clients={formattedClients}
        labTests={labTests || []}
        initialReports={formattedReports}
      />
    </div>
  );
}
