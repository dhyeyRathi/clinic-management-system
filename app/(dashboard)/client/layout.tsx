import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientSidebar } from "@/components/layout/ClientSidebar";

export default async function ClientLayout({
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

  if (profile?.role !== "CLIENT") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ClientSidebar
        userName={profile?.name ?? "Client"}
        userEmail={user.email}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
