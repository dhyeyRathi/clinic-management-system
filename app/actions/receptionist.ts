"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

// 1. Register Client (SignUp client profile + credentials)
export async function receptionistRegisterClientAction(
  name: string,
  email: string,
  phone: string,
  gender: "MALE" | "FEMALE" | "OTHER",
  dateOfBirth?: string,
  address?: string,
  emergencyContact?: string
): Promise<ActionResponse> {
  if (!name || !email || !gender) {
    return { success: false, error: "Name, email and gender are required." };
  }

  try {
    const supabase = await createClient();

    // Verify current user is RECEPTIONIST or MANAGER
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "RECEPTIONIST" && profile?.role !== "MANAGER") {
      return { success: false, error: "Permission denied." };
    }

    // Register auth account
    const dummyPassword = Math.random().toString(36).slice(-10) + "Aa1!";
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: dummyPassword,
      options: {
        data: {
          name,
          role: "CLIENT",
          gender,
        },
      },
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }

    const clientId = authData.user?.id;
    if (!clientId) {
      return { success: false, error: "Failed to create client auth profile." };
    }

    // Update profiles phone number
    await supabase
      .from("profiles")
      .update({ phone: phone || null })
      .eq("id", clientId);

    // Update client profile details
    const { error: clientProfileError } = await supabase
      .from("client_profiles")
      .update({
        date_of_birth: dateOfBirth || null,
        address: address || null,
        emergency_contact: emergencyContact || null,
      })
      .eq("user_id", clientId);

    if (clientProfileError) {
      console.error("Client profile parameters insert error:", clientProfileError.message);
    }

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "RECEPTIONIST_REGISTER_CLIENT",
      p_entity_type: "client",
      p_entity_id: clientId,
      p_after_data: { name, email, phone, gender, dateOfBirth },
    });

    revalidatePath("/receptionist/clients");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to register client." };
  }
}

// 2. Manage Appointment Status (confirm, reject, cancel, check in)
export async function receptionistManageAppointmentAction(
  appointmentId: string,
  status: "CONFIRMED" | "REJECTED" | "CANCELLED" | "CHECKED_IN" | "NO_SHOW"
): Promise<ActionResponse> {
  if (!appointmentId || !status) {
    return { success: false, error: "Appointment ID and status are required." };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: beforeData } = await supabase
      .from("appointments")
      .select("status")
      .eq("id", appointmentId)
      .single();

    const updateFields: any = { status };
    if (status === "CHECKED_IN") {
      updateFields.checked_in_at = new Date().toISOString();
    } else if (status === "CONFIRMED") {
      updateFields.confirmed_by = user?.id;
    }

    const { error } = await supabase
      .from("appointments")
      .update(updateFields)
      .eq("id", appointmentId);

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase.rpc("log_activity", {
      p_action: `RECEPTIONIST_APPOINTMENT_${status}`,
      p_entity_type: "appointment",
      p_entity_id: appointmentId,
      p_before_data: beforeData,
      p_after_data: { status },
    });

    revalidatePath("/receptionist/appointments");
    revalidatePath("/receptionist");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to manage appointment." };
  }
}

// 3. Book Desk Appointment
export async function receptionistBookAppointmentAction(
  clientProfileId: string,
  doctorId: string,
  scheduledAt: string,
  mode: "IN_PERSON" | "VIRTUAL",
  reason: string
): Promise<ActionResponse> {
  if (!clientProfileId || !doctorId || !scheduledAt || !reason) {
    return { success: false, error: "Please fill in all required fields." };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        client_id: clientProfileId,
        doctor_id: doctorId,
        scheduled_at: scheduledAt,
        status: "CONFIRMED", // Desk bookings are auto confirmed
        mode,
        reason,
        created_by: user?.id,
        confirmed_by: user?.id,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase.rpc("log_activity", {
      p_action: "RECEPTIONIST_BOOK_APPOINTMENT",
      p_entity_type: "appointment",
      p_entity_id: appointment.id,
      p_after_data: { client_id: clientProfileId, doctor_id: doctorId, scheduled_at: scheduledAt, mode, reason },
    });

    revalidatePath("/receptionist/appointments");
    revalidatePath("/receptionist");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to book appointment." };
  }
}

// 4. Create Invoice + Items
export async function receptionistCreateInvoiceAction(
  clientProfileId: string,
  subtotal: number,
  tax: number,
  discount: number,
  total: number,
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL" | "NOT_STARTED" | "PENDING_APPROVAL",
  paymentMethod: "CASH" | "CARD" | "ONLINE" | "INSURANCE" | null,
  items: Array<{
    item_type: "CONSULTATION" | "LAB_TEST" | "MEDICINE" | "OTHER";
    description: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }>,
  doctorId?: string
): Promise<ActionResponse> {
  if (!clientProfileId || items.length === 0) {
    return { success: false, error: "Client selection and billing items are required." };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Generate unique invoice number
    const invoiceNo = "INV-" + Date.now().toString().slice(-8);

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_no: invoiceNo,
        client_id: clientProfileId,
        doctor_id: doctorId || null,
        subtotal,
        tax,
        discount,
        total,
        payment_status: paymentStatus,
        payment_method: paymentMethod || null,
        created_by: user?.id,
      })
      .select("id")
      .single();

    if (invoiceError) {
      return { success: false, error: invoiceError.message };
    }

    // Insert items
    const itemsToInsert = items.map((itm) => ({
      invoice_id: invoice.id,
      item_type: itm.item_type,
      description: itm.description,
      unit_price: itm.unit_price,
      quantity: itm.quantity,
      total_price: itm.total_price,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Failed to insert invoice items:", itemsError.message);
    }

    // Auto-generate invoice PDF & Upload to Cloudinary
    try {
      const { data: clientInfo } = await supabase
        .from("client_profiles")
        .select("client_code, profiles(name)")
        .eq("id", clientProfileId)
        .single();

      const clientName = (clientInfo?.profiles as any)?.name || "Patient";
      const clientCode = clientInfo?.client_code || "Unknown MRN";

      const pdfBuffer = generateInvoicePdfBuffer({
        invoice_no: invoiceNo,
        client_name: clientName,
        client_code: clientCode,
        subtotal,
        tax,
        discount,
        total,
        items,
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
        await supabase
          .from("invoices")
          .update({ pdf_url: uploadResult.secure_url })
          .eq("id", invoice.id);
      }
    } catch (pdfErr) {
      console.error("Failed to auto-generate and upload invoice PDF:", pdfErr);
    }

    await supabase.rpc("log_activity", {
      p_action: "RECEPTIONIST_CREATE_INVOICE",
      p_entity_type: "invoice",
      p_entity_id: invoice.id,
      p_after_data: { invoice_no: invoiceNo, total, payment_status: paymentStatus },
    });

    revalidatePath("/receptionist/invoices");
    revalidatePath("/client/invoices");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create invoice." };
  }
}
