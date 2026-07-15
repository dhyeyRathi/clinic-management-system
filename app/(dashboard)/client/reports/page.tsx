import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReportsClient from "./components/ReportsClient";

export default async function ReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get client's client profile ID
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

  // Fetch client's reports with doctor info
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      id,
      title,
      description,
      file_url,
      created_at,
      doctor_profiles (
        profiles (
          name
        )
      )
    `)
    .eq("client_id", clientProfile.id)
    .order("created_at", { ascending: false });

  // Format reports doctor name mapping
  const formattedReports = (reports || []).map((rep: any) => {
    const docProfile = Array.isArray(rep.doctor_profiles)
      ? rep.doctor_profiles[0]
      : rep.doctor_profiles;

    const innerProfile = docProfile
      ? (Array.isArray(docProfile.profiles) ? docProfile.profiles[0] : docProfile.profiles)
      : null;

    return {
      id: rep.id,
      title: rep.title,
      description: rep.description,
      file_url: rep.file_url,
      created_at: rep.created_at,
      doctor_name: innerProfile?.name ? `Dr. ${innerProfile.name}` : "Clinic Staff",
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">My Reports</h1>
        <p className="text-muted text-sm mt-1">
          Access your diagnostic lab results, prescription reports, and doctor clinical summaries.
        </p>
      </div>

      <ReportsClient initialReports={formattedReports} />
    </div>
  );
}
