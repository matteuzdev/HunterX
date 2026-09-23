import { CheerioCrawler, PlaywrightCrawler } from "crawlee";

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function absolute(base, href) {
  try { return new URL(href, base).toString(); } catch { return ""; }
}

function analyzeHtml($, url) {
  const html = $.html();
  const hrefs = $("a[href]").map((_, node) => $(node).attr("href") || "").get();
  const links = hrefs.map((href) => absolute(url, href)).filter(Boolean);
  const text = $("body").text().replace(/\s+/g, " ").trim();

  const emails = unique([
    ...(html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []),
    ...links.filter((link) => link.startsWith("mailto:")).map((link) => link.slice(7).split("?")[0]),
  ]).filter((email) => !/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(email)).slice(0, 10);

  const find = (needle) => links.find((link) => link.toLowerCase().includes(needle)) || "";

  return {
    url,
    title: $("title").first().text().trim().slice(0, 200),
    description: $('meta[name="description"]').attr("content")?.trim().slice(0, 500) || "",
    canonical: $('link[rel="canonical"]').attr("href") || "",
    emails,
    socials: {
      instagram: find("instagram.com"),
      facebook: find("facebook.com"),
      linkedin: find("linkedin.com"),
      tiktok: find("tiktok.com"),
      youtube: find("youtube.com"),
      whatsapp: find("wa.me") || find("whatsapp.com"),
    },
    textLength: text.length,
  };
}

function mergeSignals(pages) {
  const socials = {};
  const emails = [];

  for (const page of pages) {
    emails.push(...page.emails);
    for (const [key, value] of Object.entries(page.socials || {})) {
      if (value && !socials[key]) socials[key] = value;
    }
  }

  return {
    emails: unique(emails).slice(0, 10),
    socials,
    pages: pages.map(({ url, title, description, canonical, textLength }) => ({
      url, title, description, canonical, textLength,
    })),
  };
}

function seedUrls(raw) {
  const base = new URL(raw);
  return unique([
    base.toString(),
    new URL("/contato", base).toString(),
    new URL("/contact", base).toString(),
    new URL("/sobre", base).toString(),
    new URL("/about", base).toString(),
  ]);
}

export async function crawlWebsite(url, { browserFallback = true } = {}) {
  const pages = [];
  const crawler = new CheerioCrawler({
    maxConcurrency: 2,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    respectRobotsTxtFile: true,
    maxRequestsPerMinute: Number(process.env.CRAWL_MAX_RPM || 30),
    async requestHandler({ $, request }) {
      pages.push(analyzeHtml($, request.loadedUrl || request.url));
    },
  });

  await crawler.run(seedUrls(url));
  let result = mergeSignals(pages);

  const needsBrowser = browserFallback && (
    !pages.length ||
    Math.max(0, ...pages.map((page) => page.textLength || 0)) < 250
  );

  if (!needsBrowser) return result;

  const browserPages = [];
  const browser = new PlaywrightCrawler({
    maxConcurrency: 1,
    maxRequestRetries: 1,
    requestHandlerTimeoutSecs: 45,
    respectRobotsTxtFile: true,
    maxRequestsPerMinute: Number(process.env.BROWSER_MAX_RPM || 10),
    launchContext: { launchOptions: { headless: true } },
    async requestHandler({ page, request }) {
      await page.waitForLoadState("domcontentloaded");
      const data = await page.evaluate(() => ({
        html: document.documentElement.outerHTML,
        title: document.title,
        text: document.body?.innerText || "",
        links: [...document.querySelectorAll("a[href]")].map((a) => a.href),
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
      }));

      const emails = unique(data.html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []);
      const find = (needle) => data.links.find((link) => link.toLowerCase().includes(needle)) || "";

      browserPages.push({
        url: request.loadedUrl || request.url,
        title: data.title.slice(0, 200),
        description: data.description.slice(0, 500),
        canonical: data.canonical,
        emails,
        socials: {
          instagram: find("instagram.com"),
          facebook: find("facebook.com"),
          linkedin: find("linkedin.com"),
          tiktok: find("tiktok.com"),
          youtube: find("youtube.com"),
          whatsapp: find("wa.me") || find("whatsapp.com"),
        },
        textLength: data.text.length,
      });
    },
  });

  await browser.run([url]);
  result = mergeSignals([...pages, ...browserPages]);
  return result;
}
