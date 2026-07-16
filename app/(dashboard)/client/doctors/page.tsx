import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Doctors | Client Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DoctorsCatalogClient from "./components/DoctorsCatalogClient";

export default async function DoctorsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all active doctors with their profile info
  const { data: doctors } = await supabase
    .from("doctor_profiles")
    .select(`
      id,
      specialization,
      qualifications,
      consultation_fee,
      profiles!inner (
        name,
        avatar_url,
        status
      )
    `)
    .eq("profiles.status", "ACTIVE");

  // Flatten profiles relation
  const formattedDoctors = (doctors || []).map((doc: any) => {
    const profile = Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles;
    return {
      id: doc.id,
      specialization: doc.specialization,
      qualifications: doc.qualifications,
      consultation_fee: doc.consultation_fee,
      profiles: profile ?? { name: "Unknown", avatar_url: null },
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Available Doctors</h1>
        <p className="text-muted text-sm mt-1">
          Browse our clinical team and book a consultation directly from a doctor's profile card.
        </p>
      </div>

      <DoctorsCatalogClient doctors={formattedDoctors} />
    </div>
  );
}
