import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planner Profile | Doctor Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DoctorProfileClient from "./components/DoctorProfileClient";

export default async function DoctorProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch doctor user profile including specialized fields
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      name,
      phone,
      email,
      avatar_url,
      doctor_profiles (
        id,
        specialization,
        qualifications,
        consultation_fee,
        availability,
        doctor_details (
          story
        )
      )
    `)
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <div className="p-6 text-center text-muted">
        Doctor account records not found.
      </div>
    );
  }

  const rawDocProfile = Array.isArray(profile.doctor_profiles)
    ? profile.doctor_profiles[0]
    : profile.doctor_profiles;

  const rawDetails = rawDocProfile?.doctor_details;
  const docDetails = Array.isArray(rawDetails) ? rawDetails[0] : rawDetails;

  const formattedProfile = {
    id: profile.id,
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    avatar_url: profile.avatar_url,
    doctor_profiles: rawDocProfile ? {
      ...rawDocProfile,
      story: docDetails?.story || "",
    } : null,
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Roster Profile Settings</h1>
        <p className="text-muted text-sm mt-1">
          Manage clinical qualifications, consultation billing rates, contact lines, and weekly availability slots.
        </p>
      </div>

      <DoctorProfileClient profile={formattedProfile as any} />
    </div>
  );
}
