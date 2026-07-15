"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function createResourceAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const name = formData.get("name") as string;
  const category = formData.get("category") as "EQUIPMENT" | "ROOM" | "OTHER";
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const quantityStr = formData.get("quantity") as string;
  const availableQtyStr = formData.get("available_quantity") as string;
  const status = formData.get("status") as "ACTIVE" | "MAINTENANCE" | "RETIRED";
  const purchaseDateStr = formData.get("purchase_date") as string;
  const purchaseCostStr = formData.get("purchase_cost") as string;
  const manufacturer = formData.get("manufacturer") as string;
  const serialNumber = formData.get("serial_number") as string;
  const warrantyUntilStr = formData.get("warranty_until") as string;
  const imageUrl = formData.get("image_url") as string;

  if (!name || !category) {
    return { success: false, error: "Name and Category are required." };
  }

  try {
    const supabase = await createClient();

    const quantity = quantityStr ? parseInt(quantityStr) : 1;
    const available_quantity = availableQtyStr ? parseInt(availableQtyStr) : quantity;
    const purchase_cost = purchaseCostStr ? parseFloat(purchaseCostStr) : null;
    const purchase_date = purchaseDateStr || null;
    const warranty_until = warrantyUntilStr || null;

    const { data: resourceRow, error } = await supabase
      .from("staff_resources")
      .insert({
        name,
        category,
        description: description || null,
        location: location || null,
        quantity,
        available_quantity,
        status: status || "ACTIVE",
        purchase_date,
        purchase_cost,
        manufacturer: manufacturer || null,
        serial_number: serialNumber || null,
        warranty_until,
        image_url: imageUrl || null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "CREATE_RESOURCE",
      p_entity_type: "resource",
      p_entity_id: resourceRow?.id,
      p_after_data: { name, category, quantity, status: status || "ACTIVE", location },
    });

    revalidatePath("/manager/resources");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function updateResourceAction(
  resourceId: string,
  data: {
    name: string;
    category: "EQUIPMENT" | "ROOM" | "OTHER";
    description: string;
    location: string;
    quantity: number;
    available_quantity: number;
    status: "ACTIVE" | "MAINTENANCE" | "RETIRED";
    purchase_date: string | null;
    purchase_cost: number | null;
    manufacturer: string;
    serial_number: string;
    warranty_until: string | null;
    image_url: string | null;
  }
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // Fetch state before update
    const { data: beforeResource } = await supabase
      .from("staff_resources")
      .select("name, category, quantity, available_quantity, status, location")
      .eq("id", resourceId)
      .single();

    const { error } = await supabase
      .from("staff_resources")
      .update({
        name: data.name,
        category: data.category,
        description: data.description || null,
        location: data.location || null,
        quantity: data.quantity,
        available_quantity: data.available_quantity,
        status: data.status,
        purchase_date: data.purchase_date || null,
        purchase_cost: data.purchase_cost || null,
        manufacturer: data.manufacturer || null,
        serial_number: data.serial_number || null,
        warranty_until: data.warranty_until || null,
        image_url: data.image_url || null,
      })
      .eq("id", resourceId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "UPDATE_RESOURCE",
      p_entity_type: "resource",
      p_entity_id: resourceId,
      p_before_data: beforeResource,
      p_after_data: { name: data.name, category: data.category, quantity: data.quantity, status: data.status, location: data.location },
    });

    revalidatePath("/manager/resources");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function toggleResourceStatusAction(
  resourceId: string,
  status: "ACTIVE" | "MAINTENANCE" | "RETIRED"
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // Fetch state before update
    const { data: beforeResource } = await supabase
      .from("staff_resources")
      .select("status")
      .eq("id", resourceId)
      .single();

    const { error } = await supabase
      .from("staff_resources")
      .update({ status })
      .eq("id", resourceId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "TOGGLE_RESOURCE_STATUS",
      p_entity_type: "resource",
      p_entity_id: resourceId,
      p_before_data: { status: beforeResource?.status },
      p_after_data: { status },
    });

    revalidatePath("/manager/resources");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function deleteResourceAction(
  resourceId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // Fetch details before delete
    const { data: beforeResource } = await supabase
      .from("staff_resources")
      .select("name, category, resource_code")
      .eq("id", resourceId)
      .single();

    const { error } = await supabase
      .from("staff_resources")
      .delete()
      .eq("id", resourceId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "DELETE_RESOURCE",
      p_entity_type: "resource",
      p_entity_id: resourceId,
      p_before_data: beforeResource,
    });

    revalidatePath("/manager/resources");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
