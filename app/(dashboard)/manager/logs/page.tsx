import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Logs | Manager Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import LogsClient from "./components/LogsClient";

async function getActivityLogs() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_logs")
    .select(`
      *,
      actor:profiles!activity_logs_actor_user_id_fkey(name, role)
    `)
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("Failed to load activity logs:", error.message);
    return [];
  }

  return data || [];
}

export default async function LogsPage() {
  const logs = await getActivityLogs();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-heading">System Audit Logs</h1>
        <p className="text-muted text-sm mt-1">
          Read-only history of administrative adjustments, catalog changes, and invoice creations.
        </p>
      </div>

      {/* Interactive Logs Table */}
      <LogsClient initialLogs={logs} />
    </div>
  );
}
