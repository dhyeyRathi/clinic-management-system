"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function uploadLabReportAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const clientId = formData.get("clientId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const file = formData.get("file") as File | null;

  if (!clientId || !title) {
    return { success: false, error: "Please select a patient and a report type." };
  }

  if (!file || file.size === 0) {
    return { success: false, error: "Please upload a valid diagnostic report file." };
  }

  try {
    const supabase = await createClient();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    // Verify current user is LAB_MANAGER
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "LAB_MANAGER") {
      return { success: false, error: "Unauthorized. Only Lab Managers can upload lab reports." };
    }

    // Fetch patient info for naming
    const { data: patientData } = await supabase
      .from("client_profiles")
      .select(`
        client_code,
        profiles:user_id (
          name
        )
      `)
      .eq("id", clientId)
      .single();

    const profileInfo = Array.isArray(patientData?.profiles) ? patientData.profiles[0] : patientData?.profiles;
    const patientName = profileInfo?.name || "Patient";

    // Sanitize name and build a unique public ID
    const sanitizedName = patientName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const customPublicId = `${sanitizedName}_${clientId}_${Date.now()}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    let fileUrl = "";
    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: "pdfs/lab_reports",
            public_id: customPublicId,
            resource_type: "raw"
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      fileUrl = uploadResult.secure_url;
    } catch (err: any) {
      console.error("Cloudinary lab report upload failed:", err);
      return { success: false, error: "Failed to upload report to Cloudinary." };
    }

    // Insert into reports table
    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        client_id: clientId,
        doctor_id: null,
        title,
        description: description || null,
        file_url: fileUrl,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }


    await supabase.rpc("log_activity", {
      p_action: "ISSUE_LAB_REPORT",
      p_entity_type: "report",
      p_entity_id: report.id,
      p_after_data: { client_id: clientId, title, description, file_url: fileUrl },
    });

    revalidatePath("/client/reports");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
