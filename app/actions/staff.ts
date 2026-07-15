"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendStaffWelcomeEmail } from "@/lib/email";
import { cloudinary } from "@/lib/cloudinary";

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
  const avatarFile = formData.get("avatar") as File | null;

  // Doctor specific fields
  const specialization = formData.get("specialization") as string;
  const qualifications = formData.get("qualifications") as string;
  const feeStr = formData.get("consultationFee") as string;

  if (!name || !email || !password || !role) {
    return { success: false, error: "Please fill in all required fields." };
  }

  // Guard: Doctor photo is compulsory
  if (role === "DOCTOR" && (!avatarFile || avatarFile.size === 0)) {
    return { success: false, error: "Facial photo is compulsory for doctor accounts." };
  }

  try {
    let avatarUrl = "";
    if (avatarFile && avatarFile.size > 0) {
      try {
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "images/doctors" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        avatarUrl = uploadResult.secure_url;
      } catch (err: any) {
        console.error("Cloudinary upload failed:", err);
        return { success: false, error: "Failed to upload doctor photo to Cloudinary." };
      }
    }

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

    // 1.5. Update profile: avatar_url + must_change_password flag
    const profileUpdate: Record<string, any> = { must_change_password: true };
    if (avatarUrl) profileUpdate.avatar_url = avatarUrl;

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);

    if (profileError) {
      console.error("Failed to update profile:", profileError);
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

    // 3. Log the activity in the audit logs
    const { error: logError } = await supabase.rpc("log_activity", {
      p_action: "CREATE_STAFF",
      p_entity_type: "staff",
      p_entity_id: userId,
      p_after_data: { name, email, role, specialization, qualifications, consultationFee: feeStr ? parseFloat(feeStr) : 0 },
    });
    if (logError) {
      console.error("Failed to write activity log:", logError.message);
    }

    // 4. Send welcome email via Supabase Edge Function using configured SMTP/Resend
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const { data: fnData, error: fnErr } = await supabase.functions.invoke("send-onboarding-email", {
        body: {
          to: email,
          name,
          role,
          temporaryPassword: password,
          loginLink: `${siteUrl}/login`,
        },
      });

      if (fnErr) {
        console.error("Welcome email edge function failed:", fnErr.message);
      } else {
        console.log("Welcome email sent via Edge Function successfully:", fnData);
      }
    } catch (emailErr: any) {
      // Email failure is non-fatal — staff account still created
      console.error("Welcome email failed to invoke:", emailErr.message);
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

    // 1. Fetch current status for before_data log
    const { data: beforeProfile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single();

    // 2. Perform status update
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    // 3. Log the status update activity
    const { error: logError } = await supabase.rpc("log_activity", {
      p_action: "UPDATE_STAFF_STATUS",
      p_entity_type: "staff",
      p_entity_id: userId,
      p_before_data: { status: beforeProfile?.status || "UNKNOWN" },
      p_after_data: { status },
    });
    if (logError) {
      console.error("Failed to write activity log:", logError.message);
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

export async function updateStaffProfileAction(formData: FormData): Promise<ActionResponse> {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const avatarFile = formData.get("avatar") as File | null;

  if (!name) {
    return { success: false, error: "Name is required." };
  }

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    let avatarUrl = "";
    if (avatarFile && avatarFile.size > 0) {
      try {
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "images/staff" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        avatarUrl = uploadResult.secure_url;
      } catch (err: any) {
        console.error("Cloudinary upload failed:", err);
        return { success: false, error: "Failed to upload avatar image to Cloudinary." };
      }
    }

    // Fetch before state for logs
    const { data: oldProfile } = await supabase
      .from("profiles")
      .select("name, phone, avatar_url")
      .eq("id", user.id)
      .single();

    const profileUpdates: any = {
      name,
      phone: phone || null,
    };
    if (avatarUrl) {
      profileUpdates.avatar_url = avatarUrl;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // Log the update activity
    await supabase.rpc("log_activity", {
      p_action: "UPDATE_STAFF_PROFILE",
      p_entity_type: "staff",
      p_entity_id: user.id,
      p_before_data: oldProfile,
      p_after_data: { name, phone, avatar_url: avatarUrl || oldProfile?.avatar_url },
    });

    revalidatePath("/manager/profile");
    revalidatePath("/receptionist/profile");
    revalidatePath("/lab-manager/profile");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile." };
  }
}
