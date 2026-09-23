import { redirect } from "next/navigation";
import { HunterXApp } from "@/components/hunterx-app";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login?next=/app");

  return <HunterXApp />;
}
