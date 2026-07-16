import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnostics Catalog | Lab Manager Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LabManagerTestsClient from "./components/LabManagerTestsClient";

export default async function LabManagerTestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all lab tests from catalog
  const { data: tests } = await supabase
    .from("lab_test_types")
    .select("id, name, description, price, status, image_url")
    .order("name", { ascending: true });

  const formattedTests = (tests || []).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description || "",
    price: Number(t.price),
    status: t.status,
    image_url: t.image_url || null,
  }));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Lab Test Catalog</h1>
        <p className="text-muted text-sm mt-1">
          Review clinic laboratory tests and manage availability status for clients and front desk bookings.
        </p>
      </div>

      <LabManagerTestsClient initialTests={formattedTests} />
    </div>
  );
}
