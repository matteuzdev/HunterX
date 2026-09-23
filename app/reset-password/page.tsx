import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Command } from "lucide-react";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 text-sm font-black text-slate-900"><Command className="size-4" /> HunterX</Link>
        <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-slate-500"><ArrowLeft className="size-3.5" /> Login</Link>
      </div>
      <div className="grid min-h-[calc(100vh-5rem)] place-items-center px-5 pb-20">
        <ResetPasswordForm />
      </div>
    </main>
  );
}
