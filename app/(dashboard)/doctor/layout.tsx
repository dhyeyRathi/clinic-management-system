import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DoctorSidebar } from "@/components/layout/DoctorSidebar";

export default async function DoctorLayout({
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
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "DOCTOR") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DoctorSidebar
        userName={profile?.name ?? "Doctor"}
        userEmail={user.email}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
