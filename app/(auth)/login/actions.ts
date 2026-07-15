"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, LoginSchema } from "./schema";

export async function loginAction(data: LoginSchema) {
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    const supabase = await createClient();
    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Fetch user's role from public.profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    return { success: true, user: authData.user, role: profile?.role || "CLIENT" };
  } catch (err: any) {
    const isFetchFailed = err?.message?.toLowerCase().includes("fetch failed");
    const errorMessage = isFetchFailed
      ? "Failed to connect to the authentication server. Please check your internet connection or try again later."
      : (err.message || "An unexpected error occurred.");
    return { success: false, error: errorMessage };
  }
}
