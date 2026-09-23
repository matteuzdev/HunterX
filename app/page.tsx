import { LandingPage, type LandingPlan } from "@/components/landing-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) return <LandingPage plans={[]} />;

  const [auth, planResult] = await Promise.all([
    supabase.auth.getClaims(),
    supabase
      .from("subscription_plans")
      .select("id,name,tagline,price_cents,monthly_tokens,features")
      .eq("active", true)
      .eq("public", true)
      .order("sort_order", { ascending: true }),
  ]);

  const plans: LandingPlan[] = (planResult.data || []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    tagline: String(row.tagline || ""),
    priceCents: Number(row.price_cents || 0),
    monthlyTokens: Number(row.monthly_tokens || 0),
    features: Array.isArray(row.features) ? row.features.map(String) : [],
  }));

  return <LandingPage hasSession={Boolean(auth.data?.claims)} plans={plans} />;
}
