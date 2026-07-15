"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";

import { jsPDF } from "jspdf";

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

    // Get file buffer (either uploaded file or generated mock PDF)
    let buffer: Buffer;
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      // Auto-generate a beautiful mock lab report PDF
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 102, 204);
      doc.text("CLINICAL DIAGNOSTIC REPORT", 20, 30);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, 190, 35);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      
      doc.text(`Patient Name: ${patientName}`, 20, 50);
      doc.text(`Patient ID: ${clientId}`, 20, 58);
      doc.text(`Report Date: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, 20, 66);
      doc.text(`Status: Completed`, 20, 74);
      
      doc.setFont("helvetica", "bold");
      doc.text("Test Details:", 20, 90);
      doc.setFont("helvetica", "normal");
      doc.text(`Test Name: ${title}`, 20, 98);
      
      doc.setFont("helvetica", "bold");
      doc.text("Description / Comments:", 20, 114);
      doc.setFont("helvetica", "normal");
      const splitDesc = doc.splitTextToSize(description || "Diagnostic report successfully issued.", 170);
      doc.text(splitDesc, 20, 122);
      
      doc.setFont("helvetica", "bold");
      doc.text("Diagnostic Result:", 20, 160);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 128, 0); // Green color
      doc.text("NORMAL / NEGATIVE", 20, 168);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text("This is an electronically generated mock report from Clinic Management System.", 20, 260);
      
      const pdfArrayBuffer = doc.output("arraybuffer");
      buffer = Buffer.from(pdfArrayBuffer);
    }

    // Upload to Cloudinary
    let fileUrl = "";
    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { 
            folder: "pdfs/lab_reports", 
            public_id: customPublicId,
            resource_type: "raw" // Must use raw for PDF to download correctly
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
        doctor_id: null, // Issued by lab manager, so no doctor_id
        title,
        description: description || null,
        file_url: fileUrl,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Log activity
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
