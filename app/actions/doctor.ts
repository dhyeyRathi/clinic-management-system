"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

// 1. Update Consultation Status / Notes
export async function updateConsultationAction(
  appointmentId: string,
  status: "CHECKED_IN" | "COMPLETED",
  notes?: string
): Promise<ActionResponse> {
  if (!appointmentId || !status) {
    return { success: false, error: "Appointment ID and status are required." };
  }

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    // Retrieve doctor profile ID and consultation fee details
    const { data: doctorProfile } = await supabase
      .from("doctor_profiles")
      .select("id, consultation_fee, specialization, profiles(name)")
      .eq("user_id", user.id)
      .single();

    if (!doctorProfile) {
      return { success: false, error: "Doctor profile not found." };
    }

    // Fetch before data for logs and invoice generation details
    const { data: beforeData } = await supabase
      .from("appointments")
      .select("status, notes, client_id, scheduled_at")
      .eq("id", appointmentId)
      .eq("doctor_id", doctorProfile.id)
      .single();

    if (!beforeData) {
      return { success: false, error: "Appointment not found or not assigned to you." };
    }

    const updateFields: any = { status };
    if (notes !== undefined) {
      updateFields.notes = notes;
    }
    if (status === "CHECKED_IN") {
      updateFields.checked_in_at = new Date().toISOString();
    } else if (status === "COMPLETED") {
      updateFields.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update(updateFields)
      .eq("id", appointmentId)
      .eq("doctor_id", doctorProfile.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // If status is transitioning to COMPLETED, auto-create a consultation invoice
    if (status === "COMPLETED" && beforeData.status !== "COMPLETED") {
      const fee = Number(doctorProfile.consultation_fee) || 0;
      if (fee > 0) {
        try {
          const adminSupabase = supabase;
          const invoiceNo = "INV-" + Date.now().toString().slice(-8);

          const { data: invoice, error: invoiceError } = await adminSupabase
            .from("invoices")
            .insert({
              invoice_no: invoiceNo,
              client_id: beforeData.client_id,
              doctor_id: doctorProfile.id,
              subtotal: fee,
              tax: 0.00,
              discount: 0.00,
              total: fee,
              payment_status: "UNPAID",
              created_by: user.id,
            })
            .select("id")
            .single();

          if (invoiceError) {
            console.error("Auto-invoice generation failed:", invoiceError.message);
          } else if (invoice) {
            const doctorName = (doctorProfile.profiles as any)?.name || "Practitioner";
            const { error: itemError } = await adminSupabase
              .from("invoice_items")
              .insert({
                invoice_id: invoice.id,
                item_type: "CONSULTATION",
                description: `Consultation with Dr. ${doctorName} (${doctorProfile.specialization || "Specialist"})`,
                unit_price: fee,
                quantity: 1,
                total_price: fee,
              });

            if (itemError) {
              console.error("Auto-invoice line item generation failed:", itemError.message);
            }

            // Auto-generate invoice PDF & Upload to Cloudinary
            try {
              const { data: clientInfo } = await adminSupabase
                .from("client_profiles")
                .select("client_code, profiles(name)")
                .eq("id", beforeData.client_id)
                .single();

              const clientName = (clientInfo?.profiles as any)?.name || "Patient";
              const clientCode = clientInfo?.client_code || "Unknown MRN";

              const pdfBuffer = generateInvoicePdfBuffer({
                invoice_no: invoiceNo,
                client_name: clientName,
                client_code: clientCode,
                subtotal: fee,
                tax: 0.00,
                discount: 0.00,
                total: fee,
                items: [{
                  item_type: "CONSULTATION",
                  description: `Consultation with Dr. ${doctorName} (${doctorProfile.specialization || "Specialist"})`,
                  unit_price: fee,
                  quantity: 1,
                  total_price: fee,
                }],
                created_at: new Date().toISOString(),
              });

              const uploadResult = await new Promise<any>((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                  { folder: "pdfs/client_invoices", resource_type: "raw" },
                  (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                  }
                ).end(pdfBuffer);
              });

              if (uploadResult?.secure_url) {
                await adminSupabase
                  .from("invoices")
                  .update({ pdf_url: uploadResult.secure_url })
                  .eq("id", invoice.id);
              }
            } catch (pdfErr) {
              console.error("Failed to auto-generate and upload doctor consultation invoice PDF:", pdfErr);
            }
          }
        } catch (invoiceErr) {
          console.error("Auto-invoice execution flow crashed:", invoiceErr);
        }
      }
    }

    // Log action
    await supabase.rpc("log_activity", {
      p_action: `DOCTOR_APPOINTMENT_${status}`,
      p_entity_type: "appointment",
      p_entity_id: appointmentId,
      p_before_data: { status: beforeData.status, notes: beforeData.notes },
      p_after_data: updateFields,
    });

    // Revalidate paths to update cache and reflect new billings/revenue on all roles
    revalidatePath("/doctor/appointments");
    revalidatePath("/doctor");
    revalidatePath("/manager/finance");
    revalidatePath("/manager/analytics");
    revalidatePath("/manager");
    revalidatePath("/client/invoices");
    revalidatePath("/client");
    revalidatePath("/receptionist/invoices");
    revalidatePath("/receptionist");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update consultation." };
  }
}

// 2. Issue Clinical Report + Recommend Lab Tests
export async function issueClinicalReportAction(formData: FormData): Promise<ActionResponse> {
  const clientId = formData.get("clientId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const pdfFile = formData.get("pdf") as File | null;

  if (!clientId || !title || !description) {
    return { success: false, error: "Client, title and clinical summary are required." };
  }

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const { data: doctorProfile } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!doctorProfile) {
      return { success: false, error: "Doctor profile not found." };
    }

    // Compulsory file upload to Cloudinary under folder pdfs/reports
    if (!pdfFile || pdfFile.size === 0) {
      return { success: false, error: "Compulsory clinical report PDF file must be uploaded." };
    }

    let pdfUrl = "";
    try {
      const bytes = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "pdfs/reports", resource_type: "raw" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      pdfUrl = uploadResult.secure_url;
    } catch (err: any) {
      console.error("Cloudinary report upload failed:", err);
      return { success: false, error: "Failed to upload report PDF to Cloudinary." };
    }

    // Insert report row
    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        client_id: clientId,
        doctor_id: doctorProfile.id,
        title,
        description,
        file_url: pdfUrl,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Log action
    await supabase.rpc("log_activity", {
      p_action: "ISSUE_CLINICAL_REPORT",
      p_entity_type: "report",
      p_entity_id: report.id,
      p_after_data: { client_id: clientId, title, description, file_url: pdfUrl },
    });

    revalidatePath("/doctor/reports");
    revalidatePath("/client/reports");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to issue clinical report." };
  }
}

export async function updateDoctorProfileAction(formData: FormData): Promise<ActionResponse> {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const specialization = formData.get("specialization") as string;
  const qualifications = formData.get("qualifications") as string;
  const consultationFeeStr = formData.get("consultationFee") as string;
  const availabilityJsonStr = formData.get("availability") as string;
  const biography = formData.get("biography") as string;
  const avatarFile = formData.get("avatar") as File | null;

  if (!name || !specialization || !qualifications || !consultationFeeStr) {
    return { success: false, error: "Please fill in all required fields." };
  }

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    // Upload avatar to Cloudinary if provided
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
        console.error("Cloudinary avatar upload failed:", err);
        return { success: false, error: "Failed to upload avatar image." };
      }
    }

    const { data: oldProfile } = await supabase
      .from("profiles")
      .select("name, phone, avatar_url")
      .eq("id", user.id)
      .single();

    const { data: oldDocProfile } = await supabase
      .from("doctor_profiles")
      .select("id, specialization, qualifications, consultation_fee, availability")
      .eq("user_id", user.id)
      .single();

    if (!oldDocProfile) {
      return { success: false, error: "Doctor profile not found." };
    }

    // Update public.profiles
    const profileUpdates: any = { name, phone: phone || null };
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

    // Parse availability
    let availabilityArray = [];
    try {
      availabilityArray = JSON.parse(availabilityJsonStr || "[]");
    } catch (e) {
      return { success: false, error: "Invalid availability schedule format." };
    }

    const fee = parseFloat(consultationFeeStr);

    // Update public.doctor_profiles
    const { error: docError } = await supabase
      .from("doctor_profiles")
      .update({
        specialization,
        qualifications,
        consultation_fee: fee,
        availability: availabilityArray,
      })
      .eq("user_id", user.id);

    if (docError) {
      return { success: false, error: docError.message };
    }

    // Upsert story in doctor_details table
    if (biography !== null && biography !== undefined) {
      const { error: storyError } = await supabase
        .from("doctor_details")
        .upsert({
          doctor_profile_id: oldDocProfile.id,
          story: biography,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "doctor_profile_id"
        });

      if (storyError) {
        return { success: false, error: storyError.message };
      }
    }

    // Log action
    await supabase.rpc("log_activity", {
      p_action: "UPDATE_DOCTOR_PROFILE",
      p_entity_type: "doctor",
      p_entity_id: user.id,
      p_before_data: { ...oldProfile, ...oldDocProfile },
      p_after_data: { name, phone, specialization, qualifications, consultationFee: fee, availability: availabilityArray, avatar_url: avatarUrl || oldProfile?.avatar_url, biography },
    });

    revalidatePath("/doctor/profile");
    revalidatePath("/doctor");
    revalidatePath("/client/doctors");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile." };
  }
}
