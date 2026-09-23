import { createClient } from "@supabase/supabase-js";
import { crawlWebsite } from "./crawler.mjs";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no worker.");
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const batchSize = Math.min(Math.max(Number(process.env.WORKER_BATCH_SIZE || 3), 1), 10);
const pollMs = Math.max(Number(process.env.WORKER_POLL_MS || 10000), 2000);
const runOnce = process.env.RUN_ONCE === "true";

async function completeJob(job, result) {
  const { data: business } = await supabase
    .from("business_directory")
    .select("email,socials,website")
    .eq("id", job.business_id)
    .maybeSingle();

  const currentSocials = business?.socials && typeof business.socials === "object" ? business.socials : {};
  const email = business?.email || result.emails?.[0] || "";

  await supabase
    .from("business_directory")
    .update({
      email,
      socials: { ...currentSocials, ...(result.socials || {}) },
      website: business?.website || job.url,
      last_crawled_at: new Date().toISOString(),
      crawl_status: "done",
      raw: { crawl: result },
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.business_id);

  await supabase
    .from("crawl_jobs")
    .update({
      status: "done",
      finished_at: new Date().toISOString(),
      last_error: "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);
}

async function failJob(job, error) {
  const message = error instanceof Error ? error.message : String(error);

  await supabase
    .from("crawl_jobs")
    .update({
      status: job.attempts >= 3 ? "failed" : "queued",
      scheduled_at: new Date(Date.now() + Math.min(job.attempts, 5) * 60_000).toISOString(),
      last_error: message.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (job.business_id) {
    await supabase
      .from("business_directory")
      .update({ crawl_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", job.business_id);
  }
}

async function tick() {
  const { data: jobs, error } = await supabase.rpc("claim_crawl_jobs", { p_limit: batchSize });
  if (error) throw error;
  if (!jobs?.length) return 0;

  await Promise.all(jobs.map(async (job) => {
    try {
      const result = await crawlWebsite(job.url, {
        browserFallback: process.env.ENABLE_BROWSER_FALLBACK !== "false",
      });
      await completeJob(job, result);
    } catch (error) {
      await failJob(job, error);
    }
  }));

  return jobs.length;
}

while (true) {
  const processed = await tick();
  if (runOnce) break;
  if (!processed) await new Promise((resolve) => setTimeout(resolve, pollMs));
}
