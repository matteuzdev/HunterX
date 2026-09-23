import { redirect } from "next/navigation";
import { OAuthConsent } from "@/components/oauth-consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>;
}) {
  const params = await searchParams;
  const authorizationId = String(params.authorization_id || "").trim();

  if (!authorizationId) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07101f] p-5 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[.04] p-7 text-center">
          <h1 className="text-xl font-black">Autorização inválida</h1>
          <p className="mt-2 text-sm text-slate-400">O pedido OAuth não contém um authorization_id válido.</p>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    const next = `/oauth/authorize?authorization_id=${encodeURIComponent(authorizationId)}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return <OAuthConsent authorizationId={authorizationId} />;
}
