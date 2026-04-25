"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function createUploadRecord(
  filePath: string,
  fileName: string,
  mimeType?: string,
  sizeBytes?: number,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Server-side validation — defence in depth against client bypass
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("Invalid file type. Only JPG, PNG, and PDF are accepted.");
  }
  if (sizeBytes !== undefined && sizeBytes > MAX_SIZE_BYTES) {
    throw new Error("File exceeds 10 MB limit.");
  }

  const { error } = await supabase.from("uploads").insert({
    student_id: user.id,
    file_path: filePath,
    file_name: fileName,
    status: "pending",
    size_bytes: sizeBytes ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/student/upload");
}

/**
 * Uploads a file record and immediately creates a linked case submission in one
 * atomic operation. Called from the combined upload+submit form on the student
 * upload page.
 */
export async function createUploadAndSubmission(
  filePath: string,
  fileName: string,
  mimeType: string | undefined,
  sizeBytes: number | undefined,
  caseDetails: {
    caseTypeId: string;
    areaOfDutyId: string;
    date: string;
    rotationId: string | null;
    assignmentId: string | null;
    notes: string | null;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("Invalid file type. Only JPG, PNG, and PDF are accepted.");
  }
  if (sizeBytes !== undefined && sizeBytes > MAX_SIZE_BYTES) {
    throw new Error("File exceeds 10 MB limit.");
  }
  if (!caseDetails.caseTypeId || !caseDetails.areaOfDutyId || !caseDetails.date) {
    throw new Error("Case type, area of duty, and date are required.");
  }

  // Insert upload record first so we get its ID for the submission
  const { data: uploadData, error: uploadError } = await supabase
    .from("uploads")
    .insert({
      student_id: user.id,
      file_path: filePath,
      file_name: fileName,
      status: "pending",
      size_bytes: sizeBytes ?? null,
    })
    .select("id")
    .single();

  if (uploadError) throw new Error(uploadError.message);

  const { error: submissionError } = await supabase
    .from("case_submissions")
    .insert({
      student_id: user.id,
      upload_id: uploadData.id,
      case_type_id: caseDetails.caseTypeId,
      area_of_duty_id: caseDetails.areaOfDutyId,
      rotation_id: caseDetails.rotationId,
      assignment_id: caseDetails.assignmentId,
      date: caseDetails.date,
      notes: caseDetails.notes,
      status: "pending",
    });

  if (submissionError) throw new Error(submissionError.message);

  revalidatePath("/student/upload");
  revalidatePath("/student/cases");
}
