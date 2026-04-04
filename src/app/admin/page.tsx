import { redirect } from "next/navigation";

// Temporary — will be replaced by the full dashboard in Phase 8
export default function AdminPage() {
  redirect("/admin/roster");
}
