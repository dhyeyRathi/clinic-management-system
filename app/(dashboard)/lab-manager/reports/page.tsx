import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LabReportsUploadClient from "./components/LabReportsUploadClient";

export default async function LabReportsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch all patient profiles
  const { data: patients } = await supabase
    .from("client_profiles")
    .select(`
      id,
      client_code,
      profiles:user_id (
        name,
        email,
        role
      )
    `);

  // Fetch all lab test types (active and inactive)
  const { data: testTypes } = await supabase
    .from("lab_test_types")
    .select("id, name, description, status")
    .order("name", { ascending: true });

  // Map to clean format and filter to only show actual CLIENTS
  const mappedPatients = (patients || [])
    .filter((p: any) => {
      const profileInfo = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return profileInfo?.role === "CLIENT";
    })
    .map((p: any) => {
      const profileInfo = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return {
        id: p.id,
        clientCode: p.client_code,
        name: profileInfo?.name || "Unknown Patient",
        email: profileInfo?.email || "",
      };
    });

  const mappedTestTypes = (testTypes || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    description: t.description || "",
    status: t.status,
  }));

  return (
    <LabReportsUploadClient 
      patients={mappedPatients} 
      testTypes={mappedTestTypes} 
    />
  );
}
