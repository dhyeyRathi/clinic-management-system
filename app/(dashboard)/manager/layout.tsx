import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ManagerSidebar } from "@/components/layout/ManagerSidebar";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("MANAGER LAYOUT CHECK - User:", user ? user.email : "NO USER");

  if (!user) {
    console.log("MANAGER LAYOUT - No user found, redirecting to /login");
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  console.log("MANAGER LAYOUT CHECK - Profile:", profile, "Error:", error);

  if (profile?.role !== "MANAGER") {
    console.log("MANAGER LAYOUT - Role is not MANAGER, redirecting to /login. Profile role:", profile?.role);
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ManagerSidebar
        userName={profile?.name ?? "Manager"}
        userEmail={user.email}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
