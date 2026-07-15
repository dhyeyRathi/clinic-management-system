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

async function getResourceRequests() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resource_requests")
    .select(`
      id,
      quantity,
      reason,
      status,
      admin_notes,
      created_at,
      staff_resources (
        id,
        name,
        resource_code
      ),
      profiles (
        name,
        role
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load resource requests:", error.message);
    return [];
  }

  return (data || []).map((req: any) => {
    const resource = Array.isArray(req.staff_resources) ? req.staff_resources[0] : req.staff_resources;
    const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;

    return {
      id: req.id,
      quantity: req.quantity,
      reason: req.reason,
      status: req.status,
      admin_notes: req.admin_notes,
      created_at: req.created_at,
      resource: {
        id: resource?.id || "",
        name: resource?.name || "Unknown Resource",
        resource_code: resource?.resource_code || "N/A",
      },
      requester: {
        name: profile?.name || "Unknown Staff",
        role: profile?.role || "STAFF",
      },
    };
  });
}

export default async function ResourcesPage() {
  const resources = await getResources();
  const requests = await getResourceRequests();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Resource Configurations</h1>
        <p className="text-muted text-sm mt-1">
          Allocate rooms, diagnostic equipment, and track operational statuses across clinic wards.
        </p>
      </div>

      <ResourcesClient
        initialResources={resources}
        initialRequests={requests}
      />
    </div>
  );
}
