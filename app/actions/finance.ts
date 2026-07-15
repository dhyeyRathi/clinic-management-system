"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  paymentStatus: "UNPAID" | "PAID" | "PARTIAL" | "REFUNDED",
  paymentMethod?: "CASH" | "CARD" | "ONLINE" | "INSURANCE"
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

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

    revalidatePath("/manager/finance");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
