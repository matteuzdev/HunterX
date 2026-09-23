import { LandingPage } from "@/components/landing-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getClaims() : { data: null };
  return <LandingPage hasSession={Boolean(data?.claims)} />;
}
