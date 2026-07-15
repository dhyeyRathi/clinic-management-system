"use server";

import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema, ResetPasswordSchema } from "./schema";

export async function resetPasswordAction(data: ResetPasswordSchema) {
  const validation = resetPasswordSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    const supabase = await createClient();
    
    // Update the password of the currently authenticated user
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    const isFetchFailed = err?.message?.toLowerCase().includes("fetch failed");
    const errorMessage = isFetchFailed
      ? "Failed to connect to the authentication server. Please check your internet connection or try again later."
      : (err.message || "An unexpected error occurred.");
    return { success: false, error: errorMessage };
  }
}
