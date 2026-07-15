import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LabTestsClient from "./components/LabTestsClient";

export default async function LabTestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch only active lab test types for client directory
  const { data: tests } = await supabase
    .from("lab_test_types")
    .select("id, name, description, price, image_url")
    .eq("status", "ACTIVE")
    .order("name", { ascending: true });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Lab Tests Catalog</h1>
        <p className="text-muted text-sm mt-1">
          Browse diagnostic, screening, and pathology test packages available at the clinic.
        </p>
      </div>

      <LabTestsClient initialTests={tests || []} />
    </div>
  );
}
