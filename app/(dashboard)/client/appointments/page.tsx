import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appointments | Client Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppointmentsClient from "./components/AppointmentsClient";

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get patient's client profile ID
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!clientProfile) {
    return (
      <div className="p-6 text-center text-muted">
        Client profile not found.
      </div>
    );
  }

  // Fetch client's appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      status,
      reason,
      mode,
      notes,
      doctor_id,
      doctor_profiles (
        id,
        specialization,
        consultation_fee,
        profiles (
          name,
          avatar_url
        )
      )
    `)
    .eq("client_id", clientProfile.id)
    .order("scheduled_at", { ascending: false });

  // Fetch all active doctors for the booking dropdown
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

  // Format/flatten database relations to match type expectations
  const formattedAppointments = (appointments || []).map((app: any) => {
    const docProfile = Array.isArray(app.doctor_profiles)
      ? app.doctor_profiles[0]
      : app.doctor_profiles;

    const innerProfile = docProfile
      ? (Array.isArray(docProfile.profiles) ? docProfile.profiles[0] : docProfile.profiles)
      : null;

    return {
      ...app,
      doctor_profiles: docProfile
        ? {
            id: docProfile.id,
            specialization: docProfile.specialization,
            consultation_fee: docProfile.consultation_fee,
            profiles: innerProfile
              ? {
                  name: innerProfile.name,
                  avatar_url: innerProfile.avatar_url,
                }
              : null,
          }
        : null,
    };
  }) as any;

  const formattedDoctors = (doctors || []).map((doc: any) => {
    const profile = Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles;
    return {
      id: doc.id,
      specialization: doc.specialization,
      qualifications: doc.qualifications,
      consultation_fee: doc.consultation_fee,
      profiles: profile
        ? {
            name: profile.name,
            avatar_url: profile.avatar_url,
          }
        : { name: "Unknown Doctor", avatar_url: null },
    };
  }) as any;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Appointments</h1>
        <p className="text-muted text-sm mt-1">
          Book new consultations or manage your upcoming and past clinic visits.
        </p>
      </div>

      <AppointmentsClient
        initialAppointments={formattedAppointments}
        doctors={formattedDoctors}
      />
    </div>
  );
}
