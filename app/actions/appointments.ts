"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function bookAppointmentAction(
  doctorProfileId: string,
  scheduledAt: string,
  reason: string,
  mode: "IN_PERSON" | "VIRTUAL"
): Promise<ActionResponse> {
  if (!doctorProfileId || !scheduledAt || !reason || !mode) {
    return { success: false, error: "Please provide all required fields." };
  }

  try {
    const supabase = await createClient();

    // Get current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    // Resolve client profile id
    const { data: clientProfile, error: clientErr } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (clientErr || !clientProfile) {
      return { success: false, error: "Patient profile not found." };
    }

    // Insert appointment
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        client_id: clientProfile.id,
        doctor_id: doctorProfileId,
        scheduled_at: scheduledAt,
        status: "PENDING",
        reason,
        mode,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "BOOK_APPOINTMENT",
      p_entity_type: "appointment",
      p_entity_id: appointment.id,
      p_after_data: { doctor_id: doctorProfileId, scheduled_at: scheduledAt, reason, mode },
    });

    revalidatePath("/client/appointments");
    revalidatePath("/client");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to book appointment." };
  }
}

export async function cancelAppointmentAction(appointmentId: string): Promise<ActionResponse> {
  if (!appointmentId) {
    return { success: false, error: "Appointment ID is required." };
  }

  try {
    const supabase = await createClient();

    // Get current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    // Resolve client profile id to verify ownership via RLS or explicit check
    const { data: clientProfile, error: clientErr } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (clientErr || !clientProfile) {
      return { success: false, error: "Patient profile not found." };
    }

    // Get before data for logging
    const { data: beforeData } = await supabase
      .from("appointments")
      .select("status, scheduled_at, doctor_id")
      .eq("id", appointmentId)
      .eq("client_id", clientProfile.id)
      .single();

    if (!beforeData) {
      return { success: false, error: "Appointment not found or not owned by you." };
    }

    // Update appointment status to CANCELLED
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "CANCELLED" })
      .eq("id", appointmentId)
      .eq("client_id", clientProfile.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "CANCEL_APPOINTMENT",
      p_entity_type: "appointment",
      p_entity_id: appointmentId,
      p_before_data: beforeData,
      p_after_data: { status: "CANCELLED" },
    });

    revalidatePath("/client/appointments");
    revalidatePath("/client");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to cancel appointment." };
  }
}
