import { redirect } from "next/navigation";

export default function ConfigIndexPage() {
  redirect("/admin/config/case-types");
}
