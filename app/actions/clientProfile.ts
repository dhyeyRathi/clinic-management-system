"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function updateClientProfileAction(formData: FormData): Promise<ActionResponse> {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const gender = formData.get("gender") as "MALE" | "FEMALE" | "OTHER";
  const address = formData.get("address") as string;
  const emergencyContact = formData.get("emergencyContact") as string;
  const avatarFile = formData.get("avatar") as File | null;

  if (!name || !gender) {
    return { success: false, error: "Name and Gender are required fields." };
  }

  try {
    const supabase = await createClient();

    // Get current auth user
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
            { folder: "images/clients" },
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

    const { data: oldClientProfile } = await supabase
      .from("client_profiles")
      .select("date_of_birth, gender, address, emergency_contact")
      .eq("user_id", user.id)
      .single();

    // 1. Update public.profiles
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

    // 2. Update public.client_profiles
    const { error: clientError } = await supabase
      .from("client_profiles")
      .update({
        date_of_birth: dateOfBirth || null,
        gender,
        address: address || null,
        emergency_contact: emergencyContact || null,
      })
      .eq("user_id", user.id);

    if (clientError) {
      return { success: false, error: clientError.message };
    }

    // Log the update activity
    await supabase.rpc("log_activity", {
      p_action: "UPDATE_PROFILE",
      p_entity_type: "client",
      p_entity_id: user.id,
      p_before_data: { ...oldProfile, ...oldClientProfile },
      p_after_data: { name, phone, dateOfBirth, gender, address, emergencyContact, avatar_url: avatarUrl || oldProfile?.avatar_url },
    });

    revalidatePath("/client/profile");
    revalidatePath("/client");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile." };
  }
}
