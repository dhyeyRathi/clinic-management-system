import React from "react";
import ResetPasswordForm from "./components/ResetPasswordForm";
import InitResetPasswordForm from "./components/InitResetPasswordForm";
import { HeartPulse } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Reset Password - Clinic Management System",
  description: "Set a new password for your Clinic Management System account.",
};

interface PageProps {
  searchParams: Promise<{ flow?: string; first_login?: string }>;
}

const ResetPasswordPage = async ({ searchParams }: PageProps) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password");
  }

  const { flow, first_login } = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "CLIENT";

  if (flow !== "recovery" && first_login !== "true") {
    const dashboards: Record<string, string> = {
      CLIENT: "/client",
      DOCTOR: "/doctor",
      RECEPTIONIST: "/receptionist",
      LAB_MANAGER: "/lab-manager",
      MANAGER: "/manager"
    };
    const targetPath = dashboards[role] || "/client";
    redirect(targetPath);
  }

  return (
    <main className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Ambient background blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-secondary/15 rounded-full blur-[120px] -z-10 animate-pulse duration-[6000ms]"></div>

      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="w-12 h-12 bg-primary text-white dark:text-background rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
          <HeartPulse className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-heading leading-tight tracking-tight">
            ClinicFlow
          </h1>
          <span className="text-muted text-xs font-semibold uppercase tracking-wider">
            Medical Portal
          </span>
        </div>
      </div>

      {/* Form Wrapper */}
      <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        {first_login === "true" ? (
          <InitResetPasswordForm role={role} />
        ) : (
          <ResetPasswordForm />
        )}
      </div>
    </main>
  );
};

export default ResetPasswordPage;
