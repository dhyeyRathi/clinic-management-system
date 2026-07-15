"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResponse {
  success: boolean;
  error?: string;
  warning?: string;
}

export async function createStaffAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  // Doctor specific fields
  const specialization = formData.get("specialization") as string;
  const qualifications = formData.get("qualifications") as string;
  const feeStr = formData.get("consultationFee") as string;

  if (!name || !email || !password || !role) {
    return { success: false, error: "Please fill in all required fields." };
  }

  try {
    const supabase = await createClient();

    // 1. Call database RPC function to create the auth user safely
    const { data: userId, error: rpcError } = await supabase.rpc(
      "create_staff_member",
      {
        p_email: email,
        p_password: password,
        p_name: name,
        p_role: role,
      }
    );

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    // 2. If the role is DOCTOR, create the supplementary doctor_profile row
    if (role === "DOCTOR") {
      const consultationFee = feeStr ? parseFloat(feeStr) : 0;
      const { error: doctorError } = await supabase
        .from("doctor_profiles")
        .insert({
          user_id: userId,
          specialization: specialization || "General Medicine",
          qualifications: qualifications || "MBBS",
          consultation_fee: consultationFee,
          availability: [], // Empty default template
        });

      if (doctorError) {
        console.error("Failed to initialize doctor profile details:", doctorError);
        return {
          success: true,
          warning: "Staff user created, but doctor details initialization failed.",
        };
      }
    }

    revalidatePath("/manager/staff");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function updateStaffStatusAction(
  userId: string,
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/manager/staff");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
