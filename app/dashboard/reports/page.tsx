import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ReportsClient } from "./ReportsClient";

export const metadata: Metadata = { title: "Traffic Reports — Promptwatch" };

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return <ReportsClient />;
}
