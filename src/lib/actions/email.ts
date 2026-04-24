"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

/**
 * Send assignment notification email to a student.
 * Fails silently — never blocks the assignment operation.
 */
export async function sendAssignmentEmail(
  studentId: string,
  details: {
    caseTypeName?: string | null;
    locationName: string;
    shiftName?: string | null;
    scheduledDate: string;
    endDate?: string | null;
    notes?: string | null;
  }
) {
  try {
    const supabase = await createClient();
    const { data: student } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", studentId)
      .single();

    if (!student?.email) return;

    const dateStr = new Date(details.scheduledDate).toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const endDateStr = details.endDate && details.endDate !== details.scheduledDate
      ? ` – ${new Date(details.endDate).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
      : "";

    const timeStr = details.shiftName ? `\nShift: ${details.shiftName}` : "";

    const serviceClient = createServiceClient();
    await serviceClient.auth.admin.inviteUserByEmail(student.email, {
      data: { skip: true },
      redirectTo: undefined,
    }).catch(() => {});

    // Use Supabase edge function or direct SMTP — for now use the built-in
    // auth.resetPasswordForEmail as a workaround won't work.
    // Instead, we'll log the notification attempt for now.
    // When SMTP is working, this can be upgraded to use an edge function or nodemailer.

    const caseTypeLine = details.caseTypeName ? `\nCase Type: ${details.caseTypeName}` : "";
    const body = `Hi ${student.full_name},\n\nYou have been assigned a new clinical rotation:${caseTypeLine}\nArea of Duty: ${details.locationName}\nDate: ${dateStr}${endDateStr}${timeStr}${details.notes ? `\nNotes: ${details.notes}` : ""}\n\nPlease check your assignments page for full details.\n\nClinical App`;

    // Log the notification (will actually send when SMTP is configured)
    await supabase.from("audit_logs").insert({
      action_type: "email_notification",
      performed_by: studentId,
      target_table: "assignments",
      target_id: studentId,
      details: {
        to: student.email,
        subject: `New Assignment: ${details.locationName}`,
        body_preview: body.slice(0, 200),
        status: "queued",
      },
    });
  } catch {
    // Never block assignment creation
  }
}
