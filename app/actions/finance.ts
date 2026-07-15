"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  paymentStatus: "UNPAID" | "PAID" | "PARTIAL" | "REFUNDED" | "NOT_STARTED" | "PENDING_APPROVAL",
  paymentMethod?: "CASH" | "CARD" | "ONLINE" | "INSURANCE"
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // Fetch state before update
    const { data: beforeInvoice } = await supabase
      .from("invoices")
      .select("payment_status, payment_method, invoice_number")
      .eq("id", invoiceId)
      .single();

    const { error } = await supabase
      .from("invoices")
      .update({
        payment_status: paymentStatus,
        payment_method: paymentMethod || null,
      })
      .eq("id", invoiceId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "UPDATE_INVOICE_STATUS",
      p_entity_type: "invoice",
      p_entity_id: invoiceId,
      p_before_data: { payment_status: beforeInvoice?.payment_status, payment_method: beforeInvoice?.payment_method, invoice_number: beforeInvoice?.invoice_number },
      p_after_data: { payment_status: paymentStatus, payment_method: paymentMethod || null },
    });

    revalidatePath("/manager/finance");
    revalidatePath("/receptionist/invoices");
    revalidatePath("/client/invoices");
    revalidatePath("/doctor/invoices");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}


export async function requestPaymentApprovalAction(
  invoiceId: string,
  paymentMethod: "CASH" | "CARD" | "ONLINE" | "INSURANCE"
): Promise<ActionResponse> {
  try {
    const supabaseClient = await createClient();
    const { data: userData } = await supabaseClient.auth.getUser();
    
    if (!userData.user) throw new Error("Unauthorized");
    
    const { data: updated, error } = await supabaseClient
      .from("invoices")
      .update({
        payment_status: "PENDING_APPROVAL",
        payment_method: paymentMethod,
      })
      .eq("id", invoiceId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!updated || updated.length === 0) {
      return { success: false, error: "Unauthorized or invoice not found." };
    }

    revalidatePath("/client/invoices");
    revalidatePath("/receptionist/invoices");
    revalidatePath("/manager/finance");
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function payInvoiceDirectlyAction(
  invoiceId: string,
  paymentMethod: "CASH" | "CARD" | "ONLINE" | "INSURANCE"
): Promise<ActionResponse> {
  try {
    const supabaseClient = await createClient();
    const { data: userData } = await supabaseClient.auth.getUser();
    
    if (!userData.user) throw new Error("Unauthorized");
    
    const { data: updated, error } = await supabaseClient
      .from("invoices")
      .update({
        payment_status: "PAID",
        payment_method: paymentMethod,
      })
      .eq("id", invoiceId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!updated || updated.length === 0) {
      return { success: false, error: "Unauthorized or invoice not found." };
    }

    revalidatePath("/client/invoices");
    revalidatePath("/receptionist/invoices");
    revalidatePath("/manager/finance");
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
