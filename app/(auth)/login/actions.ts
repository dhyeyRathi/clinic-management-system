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

    return { success: true, user: authData.user };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
