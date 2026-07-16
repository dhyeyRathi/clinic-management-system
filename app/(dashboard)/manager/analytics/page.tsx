import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinic Analytics | Manager Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import AnalyticsClient from "./components/AnalyticsClient";

async function getAnalyticsData() {
  const supabase = await createClient();

  const [
    { data: invoicesData },
    { data: staffData },
    { data: resourcesData },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("total, payment_status, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("role")
      .in("role", ["DOCTOR", "RECEPTIONIST", "LAB_MANAGER"]),
    supabase
      .from("staff_resources")
      .select("category, status"),
  ]);

  return {
    invoices: invoicesData || [],
    staff: staffData || [],
    resources: resourcesData || [],
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-heading">Clinic Analytics</h1>
        <p className="text-muted text-sm mt-1">
          Perform administrative evaluation on collected revenue, department resource allocations, and staff workloads.
        </p>
      </div>

      {/* Charts Console */}
      <AnalyticsClient data={data} />
    </div>
  );
}
