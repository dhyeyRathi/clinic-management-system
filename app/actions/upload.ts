"use server";

import { cloudinary } from "@/lib/cloudinary";

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export type CloudinaryFolder =
  | "doctor_photos"
  | "resource_photos"
  | "prescriptions"
  | "client_invoices"
  | "lab_test_results";

export async function uploadFileAction(
  formData: FormData,
  folder: CloudinaryFolder
): Promise<UploadResponse> {
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file was provided for upload." };
  }

  // Basic validation: max 5MB, must be image or PDF
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Only JPG, PNG, WEBP images, and PDF files are allowed.",
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File size exceeds the 5MB limit." };
  }

  // Map input folder to actual Cloudinary cloud folder hierarchy
  const folderMap: Record<CloudinaryFolder, string> = {
    doctor_photos: "images/doctors",
    resource_photos: "images/resources",
    prescriptions: "pdfs/prescriptions",
    client_invoices: "pdfs/client_invoices",
    lab_test_results: "pdfs/lab_test_results",
  };
  const targetFolder = folderMap[folder];

  try {
    // Convert File object to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload via stream to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: targetFolder,
          resource_type: "auto", // Automatically detect if it's an image or document/PDF
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Write buffer to stream
      uploadStream.end(buffer);
    });

    return { success: true, url: result.secure_url };
  } catch (error: any) {
    console.error("Cloudinary upload failed:", error);
    return {
      success: false,
      error: error.message || "Failed to upload file to Cloudinary.",
    };
  }
}
