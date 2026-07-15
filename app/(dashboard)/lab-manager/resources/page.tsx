import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StaffResourcesClient from "@/components/resources/StaffResourcesClient";

export default async function LabManagerResourcesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all resources (read only access for lab manager)
  const { data: resources } = await supabase
    .from("staff_resources")
    .select(`
      id,
      name,
      resource_code,
      category,
      location,
      quantity,
      available_quantity,
      status,
      manufacturer,
      serial_number,
      warranty_until,
      image_url
    `)
    .order("created_at", { ascending: false });

  // Fetch requests made by this lab manager
  const { data: requests } = await supabase
    .from("resource_requests")
    .select(`
      id,
      quantity,
      reason,
      status,
      admin_notes,
      created_at,
      staff_resources (
        name,
        resource_code
      )
    `)
    .eq("requester_id", user.id)
    .order("created_at", { ascending: false });

  const formattedResources = (resources || []).map((r) => ({
    id: r.id,
    name: r.name,
    resource_code: r.resource_code,
    category: r.category,
    location: r.location || "General Clinic",
    quantity: Number(r.quantity),
    available_quantity: Number(r.available_quantity),
    status: r.status,
    manufacturer: r.manufacturer || "",
    serial_number: r.serial_number || "",
    warranty_until: r.warranty_until || null,
    image_url: r.image_url || null,
  }));

  const formattedRequests = (requests || []).map((req: any) => {
    const resource = Array.isArray(req.staff_resources) ? req.staff_resources[0] : req.staff_resources;
    return {
      id: req.id,
      quantity: req.quantity,
      reason: req.reason,
      status: req.status,
      admin_notes: req.admin_notes,
      created_at: req.created_at,
      resource: {
        name: resource?.name || "Unknown Resource",
        resource_code: resource?.resource_code || "N/A",
      },
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Resource Inventory</h1>
        <p className="text-muted text-sm mt-1">
          Monitor clinical assets, room statuses, diagnostics equipment and submit allocation requests.
        </p>
      </div>

      <StaffResourcesClient
        resources={formattedResources}
        requests={formattedRequests}
      />
    </div>
  );
}
