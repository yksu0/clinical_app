import { createClient } from "@/lib/supabase/server";
import RotationsClient from "./RotationsClient";

export default async function RotationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rotations")
    .select("id, name, start_date, end_date, inclusive_days")
    .order("start_date", { ascending: false });

  return <RotationsClient rotations={data ?? []} />;
}
