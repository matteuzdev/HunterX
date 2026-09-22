const PROVIDER = (process.env.DATA_PROVIDER || 'mock').toLowerCase();

function digits(value = '') {
  return String(value).replace(/\D/g, '');
}

function normalizeUrl(value = '') {
  if (!value) return '';
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).toString();
  } catch {
    return '';
  }
}

function clampText(value, max = 160) {
  return String(value || '').trim().slice(0, max);
}

export function getRuntimeStatus() {
  return {
    ok: true,
    provider: PROVIDER,
    liveReady: Boolean(process.env.OUTSCRAPER_API_KEY),
    version: '0.2.0'
  };
}

export function scoreLead(lead) {
  let score = 0;
  const reasons = [];
  const socials = lead.socials || {};
  const hasSocial = Object.values(socials).some(Boolean);

  if (!lead.website) {
    score += 35;
    reasons.push(['+35', 'Sem website']);
  }
  if (!hasSocial) {
    score += 15;
    reasons.push(['+15', 'Sem redes sociais detectadas']);
  }
  if (!lead.email) {
    score += 10;
    reasons.push(['+10', 'Sem e-mail público detectado']);
  }
  if (lead.phone) {
    score += 15;
    reasons.push(['+15', 'Telefone disponível']);
  }
  if ((lead.rating || 0) >= 4.5) {
    score += 10;
    reasons.push(['+10', 'Avaliação forte']);
  } else if ((lead.rating || 0) >= 4) {
    score += 7;
    reasons.push(['+7', 'Boa avaliação']);
  }
  if ((lead.reviews || 0) >= 20) {
    score += 10;
    reasons.push(['+10', 'Volume de avaliações indica operação ativa']);
  } else if ((lead.reviews || 0) >= 5) {
    score += 5;
    reasons.push(['+5', 'Alguma tração local']);
  }
  if (lead.businessStatus !== 'CLOSED_PERMANENTLY') {
    score += 5;
    reasons.push(['+5', 'Negócio aparentemente ativo']);
  }

  score = Math.min(100, score);
  return {
    score,
    temperature: score >= 80 ? 'Quente' : score >= 60 ? 'Morno' : 'Frio',
    priority: score >= 80 ? 'Alta' : score >= 60 ? 'Média' : 'Baixa',
    reasons
  };
}

function seedFrom(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rand(seed) {
  let value = seed || 1;
  return () => ((value = (Math.imul(1664525, value) + 1013904223) >>> 0) / 4294967296);
}

function mockLeads(keyword, city) {
  const random = rand(seedFrom(`${keyword}:${city}`));
  const suffixes = ['Prime', 'Central', 'Imperial', 'Ideal', 'Nordeste', 'Real', 'Master', 'Nova Era', 'São Lucas', 'Vértice', 'Elite', 'Mais', 'Ponto Certo', 'Aliança', 'Boa Vista', 'Fortaleza', 'Premium', 'União', 'Brasil', 'Conecta'];
  const streets = ['Av. Principal', 'Rua das Flores', 'Av. Brasil', 'Rua do Comércio', 'Av. Central', 'Rua São José'];

  return suffixes.map((suffix, index) => {
    const hasWebsite = random() > 0.62;
    const hasEmail = hasWebsite && random() > 0.52;
    const hasSocial = random() > 0.48;
    const rating = Number((3.7 + random() * 1.25).toFixed(1));
    const reviews = Math.floor(3 + random() * 190);
    const area = 20 + Math.floor(random() * 79);
    const phone = `55${area}9${String(10000000 + Math.floor(random() * 89999999))}`;
    const slug = `${keyword}-${suffix}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase();

    const lead = {
      id: `mock-${seedFrom(slug + city + index)}`,
      name: `${keyword.split(/\s+/).map(word => word ? word[0].toLocaleUpperCase('pt-BR') + word.slice(1) : word).join(' ')} ${suffix}`,
      category: keyword,
      city,
      address: `${streets[index % streets.length]}, ${80 + index * 37} — ${city}`,
      phone,
      website: hasWebsite ? `https://www.${slug}.com.br` : '',
      email: hasEmail ? `contato@${slug}.com.br` : '',
      rating,
      reviews,
      businessStatus: 'OPERATIONAL',
      socials: hasSocial ? { instagram: `https://instagram.com/${slug.replaceAll('-', '')}` } : {},
      source: 'mock'
    };

    return { ...lead, ...scoreLead(lead) };
  });
}

function flattenOutscraper(payload) {
  const data = payload?.data ?? payload;
  if (!Array.isArray(data)) return [];
  if (data.length && Array.isArray(data[0])) return data.flat();
  return data;
}

function mapOutscraper(item, keyword, city, index) {
  const website = normalizeUrl(item.site || item.website || item.website_uri || '');
  const phone = digits(item.phone || item.phone_number || '');
  const email = Array.isArray(item.emails) ? item.emails[0] : (item.email || '');
  const socials = {
    instagram: item.instagram || item.instagram_link || '',
    facebook: item.facebook || item.facebook_link || '',
    linkedin: item.linkedin || item.linkedin_link || '',
    whatsapp: item.whatsapp || item.whatsapp_link || ''
  };

  const lead = {
    id: String(item.place_id || item.google_id || item.cid || `live-${index}-${seedFrom((item.name || '') + (item.full_address || ''))}`),
    name: item.name || item.title || 'Empresa',
    category: item.type || item.category || keyword,
    city,
    address: item.full_address || item.address || '',
    phone,
    website,
    email,
    rating: Number(item.rating || 0),
    reviews: Number(item.reviews || item.reviews_count || item.reviews_number || 0),
    businessStatus: item.business_status || 'OPERATIONAL',
    socials,
    latitude: item.latitude,
    longitude: item.longitude,
    source: 'outscraper'
  };

  return { ...lead, ...scoreLead(lead) };
}

async function searchOutscraper(keyword, city) {
  const key = process.env.OUTSCRAPER_API_KEY;
  if (!key) throw new Error('OUTSCRAPER_API_KEY não configurada');

  const query = `${keyword}, ${city}, Brasil`;
  const url = new URL('https://api.outscraper.cloud/google-maps-search');
  url.searchParams.set('query', query);
  url.searchParams.set('limit', '20');
  url.searchParams.set('async', 'false');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);
  try {
    const response = await fetch(url, {
      headers: { 'X-API-KEY': key },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Outscraper HTTP ${response.status}`);
    const payload = await response.json();
    return flattenOutscraper(payload)
      .slice(0, 20)
      .map((item, index) => mapOutscraper(item, keyword, city, index));
  } finally {
    clearTimeout(timer);
  }
}

export async function searchLeads(rawKeyword, rawCity) {
  const keyword = clampText(rawKeyword, 120);
  const city = clampText(rawCity, 120);
  if (!keyword || !city) {
    const error = new Error('Informe palavra-chave e cidade.');
    error.statusCode = 400;
    throw error;
  }

  if (PROVIDER === 'live') {
    const leads = await searchOutscraper(keyword, city);
    return { query: { keyword, city }, count: leads.length, mode: 'live', leads };
  }

  const leads = mockLeads(keyword, city);
  return { query: { keyword, city }, count: leads.length, mode: 'mock', leads };
}

function safePublicHttpUrl(raw) {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL inválida');

  const host = url.hostname.toLowerCase();
  const blocked = host === 'localhost' || host === '::1' || host === '0.0.0.0' ||
    host === '127.0.0.1' || /^10\./.test(host) || /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  if (blocked) throw new Error('Host privado bloqueado');
  return url;
}

function extractSignals(html, base) {
  const emails = [...new Set(
    (html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])
      .filter(email => !/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(email))
  )].slice(0, 5);

  const links = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
  const absolute = links.map(link => {
    try { return new URL(link, base).toString(); } catch { return ''; }
  }).filter(Boolean);

  const find = needle => absolute.find(url => url.toLowerCase().includes(needle)) || '';
  return {
    emails,
    socials: {
      instagram: find('instagram.com'),
      facebook: find('facebook.com'),
      linkedin: find('linkedin.com'),
      tiktok: find('tiktok.com'),
      whatsapp: find('wa.me') || find('whatsapp.com')
    }
  };
}

export async function enrichLeadWebsite(rawWebsite, lead = {}) {
  if (!rawWebsite) {
    const error = new Error('Website obrigatório.');
    error.statusCode = 400;
    throw error;
  }

  const base = safePublicHttpUrl(rawWebsite);
  const paths = ['', '/contato', '/contact', '/sobre', '/about'];
  let html = '';

  for (const pathname of paths) {
    const url = new URL(pathname || base.pathname || '/', base.origin);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5500);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HunterX/0.2; +https://github.com/matteuzdev/HunterX)' }
      });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('text/html')) {
        html += `\n${(await response.text()).slice(0, 650000)}`;
      }
    } catch {
      // Enrichment is best-effort. Other pages can still produce signals.
    } finally {
      clearTimeout(timer);
    }
    if (html.length > 1100000) break;
  }

  const signals = extractSignals(html, base);
  const enrichedLead = {
    ...lead,
    website: rawWebsite,
    email: signals.emails[0] || lead?.email || '',
    socials: { ...(lead?.socials || {}), ...signals.socials }
  };

  return { ...signals, scoring: scoreLead(enrichedLead) };
}
