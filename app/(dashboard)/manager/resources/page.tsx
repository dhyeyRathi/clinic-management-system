import { createClient } from "@/lib/supabase/server";
import ResourcesClient from "./components/ResourcesClient";

async function getResources() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load staff resources:", error.message);
    return [];
  }

  return data || [];
}

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-heading">Resource Configurations</h1>
        <p className="text-muted text-sm mt-1">
          Allocate rooms, diagnostic equipment, and track operational statuses across clinic wards.
        </p>
      </div>

      {/* Interactive Resources Desk */}
      <ResourcesClient initialResources={resources} />
    </div>
  );
}
