"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";

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
  const imageFile = formData.get("image") as File | null;

  const doctorOrderRequired = formData.get("doctorOrderRequired") === "true";

  if (!name || !priceStr) {
    return { success: false, error: "Name and Price are required fields." };
  }

  // Guard: Thumbnail image is compulsory
  if (!imageFile || imageFile.size === 0) {
    return { success: false, error: "Thumbnail image is compulsory for lab test types." };
  }

  try {
    // Upload image to Cloudinary
    let imageUrl = "";
    try {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "images/lab_Test_types" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      imageUrl = uploadResult.secure_url;
    } catch (err: any) {
      console.error("Cloudinary upload failed for lab test:", err);
      return { success: false, error: "Failed to upload thumbnail to Cloudinary." };
    }

    const supabase = await createClient();
    const price = parseFloat(priceStr);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: testRow, error } = await supabase
      .from("lab_test_types")
      .insert({
        name,
        description,
        price,
        status: status || "ACTIVE",
        image_url: imageUrl,
        created_by: user?.id,
        doctor_order_required: doctorOrderRequired,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "CREATE_LAB_TEST",
      p_entity_type: "lab_test_type",
      p_entity_id: testRow?.id,
      p_after_data: { name, description, price, status: status || "ACTIVE", image_url: imageUrl },
    });

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
  formData: FormData
): Promise<ActionResponse> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const priceStr = formData.get("price") as string;
  const status = formData.get("status") as "ACTIVE" | "INACTIVE";
  const imageFile = formData.get("image") as File | null;

  const doctorOrderRequired = formData.get("doctorOrderRequired") === "true";

  if (!name || !priceStr) {
    return { success: false, error: "Name and Price are required fields." };
  }

  try {
    const supabase = await createClient();
    const price = parseFloat(priceStr);

    // Fetch state before update
    const { data: beforeTest } = await supabase
      .from("lab_test_types")
      .select("name, description, price, status, image_url")
      .eq("id", testId)
      .single();

    // Upload new image if provided
    let imageUrl = beforeTest?.image_url || "";
    if (imageFile && imageFile.size > 0) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "images/lab_Test_types" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        imageUrl = uploadResult.secure_url;
      } catch (err: any) {
        console.error("Cloudinary upload failed on edit:", err);
        return { success: false, error: "Failed to upload new thumbnail to Cloudinary." };
      }
    }

    const { error } = await supabase
      .from("lab_test_types")
      .update({
        name,
        description,
        price,
        status,
        image_url: imageUrl,
        doctor_order_required: doctorOrderRequired,
      })
      .eq("id", testId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "UPDATE_LAB_TEST",
      p_entity_type: "lab_test_type",
      p_entity_id: testId,
      p_before_data: beforeTest,
      p_after_data: { name, description, price, status, image_url: imageUrl },
    });

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

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "TOGGLE_LAB_TEST_STATUS",
      p_entity_type: "lab_test_type",
      p_entity_id: testId,
      p_before_data: { status: currentStatus },
      p_after_data: { status: newStatus },
    });

    revalidatePath("/manager/lab-tests");
    return {success: true};
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function bookLabTestTypeAction(testTypeId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    
    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized." };

    // Resolve client
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select(`
        id,
        client_code,
        profiles:user_id (
          name
        )
      `)
      .eq("user_id", user.id)
      .single();

    if (!clientProfile) return { success: false, error: "Patient profile not found." };

    // Resolve test details
    const { data: testType } = await supabase
      .from("lab_test_types")
      .select("name, price, doctor_order_required")
      .eq("id", testTypeId)
      .single();

    if (!testType) return { success: false, error: "Lab test type not found." };

    if (testType.doctor_order_required) {
      return { success: false, error: "This test requires a doctor's order to be booked." };
    }

    const price = Number(testType.price);
    const invoiceNo = "INV-" + Date.now().toString().slice(-8);

    // Create Invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_no: invoiceNo,
        client_id: clientProfile.id,
        subtotal: price,
        tax: 0,
        discount: 0,
        total: price,
        payment_status: "NOT_STARTED",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (invoiceError) return { success: false, error: invoiceError.message };

    // Create Invoice Item
    const { error: itemError } = await supabase
      .from("invoice_items")
      .insert({
        invoice_id: invoice.id,
        item_type: "LAB_TEST",
        reference_id: testTypeId,
        description: testType.name,
        unit_price: price,
        quantity: 1,
        total_price: price,
      });

    if (itemError) return { success: false, error: itemError.message };

    // Log Activity
    await supabase.rpc("log_activity", {
      p_action: "CLIENT_BOOK_LAB_TEST",
      p_entity_type: "invoice",
      p_entity_id: invoice.id,
      p_after_data: { test_type_id: testTypeId, price },
    });

    revalidatePath("/client/invoices");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
