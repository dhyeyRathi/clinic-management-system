import { createClient } from "@/lib/supabase/server";
import StaffListClient from "./components/StaffListClient";

async function getStaffMembers() {
  const supabase = await createClient();

  // Fetch all staff members (excluding managers and clients)
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      doctor_profiles:doctor_profiles(*)
    `)
    .in("role", ["DOCTOR", "RECEPTIONIST", "LAB_MANAGER"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load staff list:", error.message);
    return [];
  }

  return data || [];
}

export default async function StaffManagementPage() {
  const staff = await getStaffMembers();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Staff Configuration</h1>
          <p className="text-muted text-sm mt-1">
            Register and manage profiles, roles, and status for clinic staff.
          </p>
        </div>
      </div>

      {/* Staff Management Console */}
      <StaffListClient initialStaff={staff} />
    </div>
  );
}
