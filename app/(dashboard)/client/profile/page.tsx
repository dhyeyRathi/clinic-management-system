import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./components/ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch full patient profile including demographic fields
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      name,
      phone,
      email,
      avatar_url,
      client_profiles (
        id,
        client_code,
        date_of_birth,
        gender,
        address,
        emergency_contact
      )
    `)
    .eq("id", user.id)
    .single();

  const formattedProfile = profile
    ? {
        ...profile,
        client_profiles: Array.isArray(profile.client_profiles)
          ? profile.client_profiles[0]
          : profile.client_profiles,
      }
    : null;

  if (!formattedProfile) {
    return (
      <div className="p-6 text-center text-muted">
        Client details not found.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Personal Profile</h1>
        <p className="text-muted text-sm mt-1">
          Manage your contact credentials, address location, and demographic metrics.
        </p>
      </div>

      <ProfileClient profile={formattedProfile as any} />
    </div>
  );
}
