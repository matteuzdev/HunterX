import type { Lead, LeadPriority, LeadTemperature, SearchResult } from "./types";

const provider = (process.env.DATA_PROVIDER || "mock").toLowerCase();

function getApifyToken() {
  return (
    process.env.APIFY_TOKEN ||
    process.env.APIFY_API_TOKEN ||
    process.env.APIFY_API_KEY ||
    ""
  ).trim();
}

function getApifyEnvName() {
  if (process.env.APIFY_TOKEN) return "APIFY_TOKEN";
  if (process.env.APIFY_API_TOKEN) return "APIFY_API_TOKEN";
  if (process.env.APIFY_API_KEY) return "APIFY_API_KEY";
  return "";
}

function digits(value = "") {
  return String(value).replace(/\D/g, "");
}

function normalizeUrl(value = "") {
  if (!value) return "";
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).toString();
  } catch {
    return "";
  }
}

function clampText(value: unknown, max = 160) {
  return String(value ?? "").trim().slice(0, max);
}

export function getRuntimeStatus() {
  const liveReady =
    provider === "apify" ? Boolean(getApifyToken()) :
    provider === "outscraper" ? Boolean(process.env.OUTSCRAPER_API_KEY) :
    false;

  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  return {
    ok: true,
    provider,
    liveReady,
    supabaseReady,
    apifyEnv: provider === "apify" ? getApifyEnvName() : "",
    version: "0.4.2",
  };
}

export function scoreLead(lead: Omit<Lead, "score" | "temperature" | "priority" | "reasons">) {
  let score = 0;
  const reasons: Array<[string, string]> = [];
  const hasSocial = Object.values(lead.socials || {}).some(Boolean);

  if (!lead.website) {
    score += 35;
    reasons.push(["+35", "Sem website"]);
  }
  if (!hasSocial) {
    score += 15;
    reasons.push(["+15", "Sem redes sociais detectadas"]);
  }
  if (!lead.email) {
    score += 10;
    reasons.push(["+10", "Sem e-mail público detectado"]);
  }
  if (lead.phone) {
    score += 15;
    reasons.push(["+15", "Telefone disponível"]);
  }
  if ((lead.rating || 0) >= 4.5) {
    score += 10;
    reasons.push(["+10", "Avaliação forte"]);
  } else if ((lead.rating || 0) >= 4) {
    score += 7;
    reasons.push(["+7", "Boa avaliação"]);
  }
  if ((lead.reviews || 0) >= 20) {
    score += 10;
    reasons.push(["+10", "Volume de avaliações indica operação ativa"]);
  } else if ((lead.reviews || 0) >= 5) {
    score += 5;
    reasons.push(["+5", "Alguma tração local"]);
  }
  if (lead.businessStatus !== "CLOSED_PERMANENTLY") {
    score += 5;
    reasons.push(["+5", "Negócio aparentemente ativo"]);
  }

  score = Math.min(100, score);
  const temperature: LeadTemperature = score >= 80 ? "Quente" : score >= 60 ? "Morno" : "Frio";
  const priority: LeadPriority = score >= 80 ? "Alta" : score >= 60 ? "Média" : "Baixa";
  return { score, temperature, priority, reasons };
}

function seedFrom(text: string) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rng(seed: number) {
  let value = seed || 1;
  return () => ((value = (Math.imul(1664525, value) + 1013904223) >>> 0) / 4294967296);
}

function mockLeads(keyword: string, city: string): Lead[] {
  const random = rng(seedFrom(`${keyword}:${city}`));
  const suffixes = [
    "Prime", "Central", "Imperial", "Ideal", "Nordeste", "Real", "Master", "Nova Era", "São Lucas", "Vértice",
    "Elite", "Mais", "Ponto Certo", "Aliança", "Boa Vista", "Fortaleza", "Premium", "União", "Brasil", "Conecta",
  ];
  const streets = ["Av. Principal", "Rua das Flores", "Av. Brasil", "Rua do Comércio", "Av. Central", "Rua São José"];

  return suffixes.map((suffix, index) => {
    const hasWebsite = random() > 0.62;
    const hasEmail = hasWebsite && random() > 0.52;
    const hasSocial = random() > 0.48;
    const rating = Number((3.7 + random() * 1.25).toFixed(1));
    const reviews = Math.floor(3 + random() * 190);
    const area = 20 + Math.floor(random() * 79);
    const phone = `55${area}9${String(10000000 + Math.floor(random() * 89999999))}`;
    const slug = `${keyword}-${suffix}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
    const base = {
      id: `mock-${seedFrom(slug + city + index)}`,
      name: `${keyword.split(/\s+/).map(word => word ? word[0].toLocaleUpperCase("pt-BR") + word.slice(1) : word).join(" ")} ${suffix}`,
      category: keyword,
      city,
      address: `${streets[index % streets.length]}, ${80 + index * 37} — ${city}`,
      phone,
      website: hasWebsite ? `https://www.${slug}.com.br` : "",
      email: hasEmail ? `contato@${slug}.com.br` : "",
      rating,
      reviews,
      businessStatus: "OPERATIONAL",
      socials: (hasSocial ? { instagram: `https://instagram.com/${slug.replaceAll("-", "")}` } : {}) as Record<string, string>,
      source: "mock" as const,
    };
    return { ...base, ...scoreLead(base) };
  });
}


function mapApify(item: Record<string, unknown>, keyword: string, city: string, index: number): Lead {
  const location = (item.location || {}) as Record<string, unknown>;
  const contacts = (item.contacts || item.contactDetails || {}) as Record<string, unknown>;
  const contactEmails = Array.isArray(contacts.emails) ? contacts.emails : [];
  const itemEmails = Array.isArray(item.emails) ? item.emails : [];
  const email = String(itemEmails[0] || contactEmails[0] || item.email || contacts.email || "");
  const website = normalizeUrl(String(item.website || ""));
  const phone = digits(String(item.phoneUnformatted || item.phone || ""));
  const socialLinks = Array.isArray(item.socialMedia) ? item.socialMedia : [];
  const socialText = socialLinks.map(value => String(value)).join(" ");

  const findSocial = (domain: string) => {
    const direct = socialLinks.find(value => String(value).includes(domain));
    if (direct) return String(direct);
    const key = domain.split(".")[0];
    return String(item[key] || contacts[key] || (socialText.includes(domain) ? socialText : ""));
  };

  const permanentlyClosed = Boolean(item.permanentlyClosed);
  const temporarilyClosed = Boolean(item.temporarilyClosed);
  const base = {
    id: String(item.placeId || item.cid || `apify-${index}-${seedFrom(String(item.title || "") + String(item.address || ""))}`),
    name: String(item.title || item.name || "Empresa"),
    category: String(item.categoryName || (Array.isArray(item.categories) ? item.categories[0] : "") || keyword),
    city: String(item.city || city),
    address: String(item.address || ""),
    phone,
    website,
    email,
    rating: Number(item.totalScore || item.rating || 0),
    reviews: Number(item.reviewsCount || item.reviews || 0),
    businessStatus: permanentlyClosed ? "CLOSED_PERMANENTLY" : temporarilyClosed ? "CLOSED_TEMPORARILY" : "OPERATIONAL",
    socials: {
      instagram: findSocial("instagram.com"),
      facebook: findSocial("facebook.com"),
      linkedin: findSocial("linkedin.com"),
      tiktok: findSocial("tiktok.com"),
      whatsapp: findSocial("wa.me") || findSocial("whatsapp.com"),
    },
    latitude: Number(location.lat || item.latitude || 0) || undefined,
    longitude: Number(location.lng || item.longitude || 0) || undefined,
    source: "apify" as const,
  };
  return { ...base, ...scoreLead(base) };
}

async function searchApify(keyword: string, city: string): Promise<Lead[]> {
  const token = getApifyToken();
  if (!token) throw new Error("Token da Apify não configurado");

  const response = await fetch(
    "https://api.apify.com/v2/actors/compass~crawler-google-places/run-sync-get-dataset-items?clean=true",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        searchStringsArray: [keyword],
        locationQuery: `${city}, Brasil`,
        maxCrawledPlacesPerSearch: 20,
        language: "pt-BR",
        skipClosedPlaces: true,
        scrapePlaceDetailPage: false,
        scrapeContacts: false,
        maxReviews: 0,
      }),
      signal: AbortSignal.timeout(55000),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Apify HTTP ${response.status}${body ? `: ${body.slice(0, 180)}` : ""}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error("Resposta inesperada da Apify");

  return payload.slice(0, 20).map((item, index) =>
    mapApify(item as Record<string, unknown>, keyword, city, index),
  );
}

function flattenOutscraper(payload: unknown): Record<string, unknown>[] {
  const maybe = (payload as { data?: unknown })?.data ?? payload;
  if (!Array.isArray(maybe)) return [];
  if (maybe.length && Array.isArray(maybe[0])) return (maybe as unknown[][]).flat() as Record<string, unknown>[];
  return maybe as Record<string, unknown>[];
}

function mapOutscraper(item: Record<string, unknown>, keyword: string, city: string, index: number): Lead {
  const website = normalizeUrl(String(item.site || item.website || item.website_uri || ""));
  const phone = digits(String(item.phone || item.phone_number || ""));
  const emails = Array.isArray(item.emails) ? item.emails : [];
  const email = String(emails[0] || item.email || "");
  const socials = {
    instagram: String(item.instagram || item.instagram_link || ""),
    facebook: String(item.facebook || item.facebook_link || ""),
    linkedin: String(item.linkedin || item.linkedin_link || ""),
    whatsapp: String(item.whatsapp || item.whatsapp_link || ""),
  };

  const base = {
    id: String(item.place_id || item.google_id || item.cid || `live-${index}-${seedFrom(String(item.name || "") + String(item.full_address || ""))}`),
    name: String(item.name || item.title || "Empresa"),
    category: String(item.type || item.category || keyword),
    city,
    address: String(item.full_address || item.address || ""),
    phone,
    website,
    email,
    rating: Number(item.rating || 0),
    reviews: Number(item.reviews || item.reviews_count || item.reviews_number || 0),
    businessStatus: String(item.business_status || "OPERATIONAL"),
    socials,
    latitude: Number(item.latitude || 0) || undefined,
    longitude: Number(item.longitude || 0) || undefined,
    source: "outscraper" as const,
  };
  return { ...base, ...scoreLead(base) };
}

async function searchOutscraper(keyword: string, city: string): Promise<Lead[]> {
  const key = process.env.OUTSCRAPER_API_KEY;
  if (!key) throw new Error("OUTSCRAPER_API_KEY não configurada");

  const url = new URL("https://api.outscraper.cloud/google-maps-search");
  url.searchParams.set("query", `${keyword}, ${city}, Brasil`);
  url.searchParams.set("limit", "20");
  url.searchParams.set("async", "false");

  const response = await fetch(url, {
    headers: { "X-API-KEY": key },
    signal: AbortSignal.timeout(28000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Outscraper HTTP ${response.status}`);
  const payload = await response.json();

  return flattenOutscraper(payload).slice(0, 20).map((item, index) => mapOutscraper(item, keyword, city, index));
}

export async function searchLeads(rawKeyword: unknown, rawCity: unknown): Promise<SearchResult> {
  const keyword = clampText(rawKeyword, 120);
  const city = clampText(rawCity, 120);
  if (!keyword || !city) throw new Error("Informe palavra-chave e cidade.");

  const leads =
    provider === "apify" ? await searchApify(keyword, city) :
    provider === "outscraper" || provider === "live" ? await searchOutscraper(keyword, city) :
    mockLeads(keyword, city);

  return {
    query: { keyword, city },
    count: leads.length,
    mode: provider === "mock" ? "mock" : "live",
    leads,
  };
}

function safePublicHttpUrl(raw: string) {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("URL inválida");
  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  if (blocked) throw new Error("Host privado bloqueado");
  return url;
}

function extractSignals(html: string, base: URL) {
  const emails = [...new Set(html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])]
    .filter(email => !/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(email))
    .slice(0, 5);

  const hrefs = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
  const absolute = hrefs.map(link => {
    try { return new URL(link, base).toString(); } catch { return ""; }
  }).filter(Boolean);

  const find = (needle: string) => absolute.find(url => url.toLowerCase().includes(needle)) || "";
  return {
    emails,
    socials: {
      instagram: find("instagram.com"),
      facebook: find("facebook.com"),
      linkedin: find("linkedin.com"),
      tiktok: find("tiktok.com"),
      whatsapp: find("wa.me") || find("whatsapp.com"),
    },
  };
}

export async function enrichLeadWebsite(rawWebsite: unknown, lead: Lead) {
  const website = clampText(rawWebsite, 500);
  if (!website) throw new Error("Website obrigatório.");

  const base = safePublicHttpUrl(website);
  const paths = ["", "/contato", "/contact", "/sobre", "/about"];
  let html = "";

  for (const pathname of paths) {
    const url = new URL(pathname || base.pathname || "/", base.origin);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HunterX/0.3; +https://gohunterx.vercel.app)" },
        signal: AbortSignal.timeout(5500),
        cache: "no-store",
      });
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.includes("text/html")) {
        html += `\n${(await response.text()).slice(0, 650000)}`;
      }
    } catch {
      // Best-effort enrichment.
    }
    if (html.length > 1100000) break;
  }

  const signals = extractSignals(html, base);
  const enrichedBase = {
    ...lead,
    website,
    email: signals.emails[0] || lead.email || "",
    socials: { ...(lead.socials || {}), ...signals.socials },
  };
  return {
    ...signals,
    scoring: scoreLead(enrichedBase),
  };
}
