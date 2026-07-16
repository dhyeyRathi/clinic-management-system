import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | Manager Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StaffGenericProfileClient from "@/components/profile/StaffGenericProfileClient";

export default async function ManagerProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, phone, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <div className="p-6 text-center text-muted">
        Account records not found.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Profile Settings</h1>
        <p className="text-muted text-sm mt-1">
          Manage your account contact coordinates and profile credentials.
        </p>
      </div>

      <StaffGenericProfileClient profile={profile} />
    </div>
  );
}
