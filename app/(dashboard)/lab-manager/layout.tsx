import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LabManagerSidebar } from "@/components/layout/LabManagerSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LAB MANAGER | DASHBOARD",
};

export default async function LabManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, must_change_password")
    .eq("id", user.id)
    .single();

  if (profile?.must_change_password) {
    redirect("/reset-password?first_login=true");
  }

  if (profile?.role !== "LAB_MANAGER") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <LabManagerSidebar
        userName={profile?.name ?? "Lab Manager"}
        userEmail={user.email}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
