import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssignmentsClient from "./AssignmentsClient";

export type Assignment = {
  id: string;
  area_of_duty_id: string;
  scheduled_date: string;
  end_date: string | null;
  shift_id: string | null;
  rotation_id: string | null;
  shifts: { name: string } | null;
  rotations: { name: string; inclusive_days: number[] | null } | null;
  status: "scheduled" | "completed" | "missed" | "cancel_requested" | "cancelled";
  notes: string | null;
  cancellation_reason: string | null;
  areas_of_duty: { name: string } | null;
};

export default async function StudentAssignmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("assignments")
    .select(
      "id, area_of_duty_id, shift_id, rotation_id, scheduled_date, end_date, status, notes, cancellation_reason, areas_of_duty(name), shifts(name), rotations(name, inclusive_days)"
    )
    .eq("student_id", user.id)
    .order("scheduled_date", { ascending: false });

  const assignments: Assignment[] = (data ?? []) as unknown as Assignment[];

  const open = assignments.filter((a) => a.status === "scheduled" || a.status === "cancel_requested");
  const past = assignments.filter((a) => a.status !== "scheduled" && a.status !== "cancel_requested");

  return <AssignmentsClient open={open} past={past} />;
}

