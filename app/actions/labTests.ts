"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function createLabTestTypeAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const priceStr = formData.get("price") as string;
  const status = formData.get("status") as "ACTIVE" | "INACTIVE";

  if (!name || !priceStr) {
    return { success: false, error: "Name and Price are required fields." };
  }

  try {
    const supabase = await createClient();
    const price = parseFloat(priceStr);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("lab_test_types").insert({
      name,
      description,
      price,
      status: status || "ACTIVE",
      created_by: user?.id,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/manager/lab-tests");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function updateLabTestTypeAction(
  testId: string,
  data: {
    name: string;
    description: string;
    price: number;
    status: "ACTIVE" | "INACTIVE";
  }
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("lab_test_types")
      .update(data)
      .eq("id", testId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/manager/lab-tests");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function toggleLabTestTypeStatusAction(
  testId: string,
  currentStatus: "ACTIVE" | "INACTIVE"
): Promise<ActionResponse> {
  const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("lab_test_types")
      .update({ status: newStatus })
      .eq("id", testId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/manager/lab-tests");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
