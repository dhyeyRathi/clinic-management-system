"use server";

import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, ForgotPasswordSchema } from "./schema";

export async function forgotPasswordAction(data: ForgotPasswordSchema) {
  const validation = forgotPasswordSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    const supabase = await createClient();
    
    // Construct reset redirect URL
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
