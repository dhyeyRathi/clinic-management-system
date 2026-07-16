import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnostics Catalog | Manager Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import LabTestsClient from "./components/LabTestsClient";

async function getLabTestTypes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lab_test_types")
    .select(`
      *,
      creator:profiles!created_by(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load lab test types:", error.message);
    return [];
  }

  return data || [];
}

export default async function LabTestsPage() {
  const tests = await getLabTestTypes();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-heading">Lab Test Catalog</h1>
        <p className="text-muted text-sm mt-1">
          Configure available diagnostic tests, billing prices, and active catalog statuses.
        </p>
      </div>

      {/* Interactive Catalog Desk */}
      <LabTestsClient initialTests={tests} />
    </div>
  );
}
