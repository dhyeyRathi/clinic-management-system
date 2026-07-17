"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema, RegisterSchema } from "./schema";

export async function registerAction(data: RegisterSchema) {

    const validation = registerSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    try {
        const supabase = await createClient();


        const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    name: data.name,
                    role: "CLIENT"
                }
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, user: authData.user };
    } catch (err: any) {
        const isFetchFailed = err?.message?.toLowerCase().includes("fetch failed");
        const errorMessage = isFetchFailed
            ? "Failed to connect to the authentication server. Please check your internet connection or try again later."
            : (err.message || "An unexpected error occurred.");
        return { success: false, error: errorMessage };
    }
}
