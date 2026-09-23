import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  ELITE_SITE_SECTIONS,
  ELITE_SITE_SKILL,
  type EliteSiteSection,
} from "@/lib/mcp/elite-site-architecture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

function clean(value?: string) {
  return (value || "").trim();
}

function bullet(label: string, value?: string) {
  return value?.trim() ? `- **${label}:** ${value.trim()}` : `- **${label}:** não informado`;
}

const handler = createMcpHandler((server) => {
  server.registerTool(
    "get_elite_site_skill",
    {
      title: "Get Elite Site Architecture",
      description:
        "Returns the reusable premium website/landing-page architecture standard used for client sites. Use before planning, designing, writing copy or building a website.",
      inputSchema: z.object({
        section: z
          .enum(["full", "research", "visual", "copy", "mobile", "technical", "delivery"])
          .default("full"),
      }),
    },
    async ({ section }) => {
      if (section === "full") return text(ELITE_SITE_SKILL);
      return text(ELITE_SITE_SECTIONS[section as EliteSiteSection]);
    },
  );

  server.registerTool(
    "prepare_site_brief",
    {
      title: "Prepare Premium Site Brief",
      description:
        "Structures verified business information into a build-ready brief without inventing missing facts.",
      inputSchema: z.object({
        name: z.string().min(1),
        cityState: z.string().optional(),
        whatsapp: z.string().optional(),
        instagram: z.string().optional(),
        currentSite: z.string().optional(),
        googleReputation: z.string().optional(),
        services: z.string().optional(),
        differentiators: z.string().optional(),
        brandAssets: z.string().optional(),
        conversionGoal: z.string().optional(),
        references: z.string().optional(),
        audience: z.string().optional(),
      }),
    },
    async (input) => {
      const missing = Object.entries(input)
        .filter(([key, value]) => key !== "name" && !clean(value))
        .map(([key]) => key);

      return text(`# Site Brief — ${input.name}

## Verified business evidence
${bullet("City/state", input.cityState)}
${bullet("Commercial WhatsApp", input.whatsapp)}
${bullet("Instagram", input.instagram)}
${bullet("Current site", input.currentSite)}
${bullet("Google/reputation evidence", input.googleReputation)}
${bullet("Main services", input.services)}
${bullet("Differentiators", input.differentiators)}
${bullet("Brand colors/assets", input.brandAssets)}
${bullet("Audience", input.audience)}
${bullet("Primary conversion goal", input.conversionGoal)}
${bullet("Reference sites/components", input.references)}

## Art direction
- Build a centered, cinematic first impression rather than the default copy-left/image-right AI layout.
- Establish one visual anchor, then support it with restrained glass/info cards.
- Use hierarchical bento composition for services/capabilities.
- Use tabs only if they improve comparison.
- Use vector icons consistently; no decorative emoji.
- Motion must reinforce hierarchy and feedback, not decorate randomly.

## Copy direction
- Speak to concrete pains, outcomes and objections.
- Use verified differentiators only.
- Avoid vague claims such as "a melhor escolha" or "soluções completas".
- Apply CBVL when useful, without guarantees or fabricated urgency.

## Mobile and technical
- Mobile-first; no overflow; thumb-friendly interactions.
- Preserve the project's established stack.
- Include local SEO, Open Graph, verified Schema.org, accessibility and responsive assets.

## Missing evidence — do not invent
${missing.length ? missing.map((item) => `- ${item}`).join("\n") : "- none"}

## Delivery gate
Use the Elite Site Architecture checklist before shipping.`);
    },
  );

  server.registerTool(
    "audit_site_draft",
    {
      title: "Audit Site Draft",
      description:
        "Checks a site plan, copy draft or implementation description against the Elite Site Architecture rules and returns concrete warnings.",
      inputSchema: z.object({
        draft: z.string().min(20),
        hasVerifiedTestimonials: z.boolean().default(false),
        stack: z.string().optional(),
      }),
    },
    async ({ draft, hasVerifiedTestimonials, stack }) => {
      const value = draft.toLowerCase();
      const findings: string[] = [];
      const passes: string[] = [];

      const genericPhrases = [
        "somos apaixonados",
        "soluções completas",
        "líderes com excelência",
        "a melhor escolha",
        "transformamos sonhos",
      ].filter((phrase) => value.includes(phrase));

      if (genericPhrases.length) {
        findings.push(`Generic copy detected: ${genericPhrases.join(", ")}. Replace with concrete business-specific language.`);
      } else passes.push("No banned generic copy phrases detected.");

      if (/emoji|🚀|🔥|✨|💎|✅|⭐/.test(draft)) {
        findings.push("Decorative emoji detected. Prefer consistent vector icons in the site body.");
      } else passes.push("No obvious decorative emoji usage detected.");

      if (/left.{0,40}(image|photo)|copy.{0,40}left|image.{0,40}right|duas colunas|two-column hero/i.test(draft)) {
        findings.push("Possible clichéd two-column hero. Re-evaluate whether a centered cinematic/showcase composition would create stronger hierarchy.");
      }

      if (/(testimonial|depoimento|avaliaç|review)/i.test(draft) && !hasVerifiedTestimonials) {
        findings.push("Social proof is mentioned but verified testimonials were not confirmed. Remove it or replace it with proof of process/portfolio.");
      } else if (hasVerifiedTestimonials) passes.push("Social proof was marked as verified.");

      if (!/(mobile|responsiv|320|375|390|768|drawer)/i.test(draft)) {
        findings.push("Mobile behavior is not explicit. Define responsive widths, navigation behavior and overflow prevention.");
      } else passes.push("Mobile/responsive behavior is mentioned.");

      if (!/(seo|meta description|open graph|schema|json-ld)/i.test(draft)) {
        findings.push("SEO metadata / structured data are not explicit.");
      } else passes.push("SEO/metadata considerations are present.");

      if (!/(cta|whatsapp|form|orçamento|contato|conversion|conversão)/i.test(draft)) {
        findings.push("Primary conversion path is unclear. Define a concrete CTA and destination.");
      } else passes.push("A conversion path is mentioned.");

      if (!/(bento|hierarquia|hierarchical|anchor card|card principal)/i.test(draft)) {
        findings.push("Section hierarchy may be too flat. Consider a clear anchor card / hierarchical bento instead of equal cards.");
      }

      return text(`# Elite Site Audit

**Stack/context:** ${clean(stack) || "not specified"}

## Warnings
${findings.length ? findings.map((item) => `- ${item}`).join("\n") : "- No major heuristic warnings detected."}

## Passes
${passes.map((item) => `- ${item}`).join("\n")}

## Final rule
This is a heuristic audit, not proof of visual quality. Compare the actual rendered site against the full Elite Site Architecture skill before shipping.`);
    },
  );

  server.registerTool(
    "build_site_prompt",
    {
      title: "Build Site Construction Prompt",
      description:
        "Returns a reusable construction prompt for a premium site using the Elite Site Architecture standard and the supplied verified business brief.",
      inputSchema: z.object({
        businessBrief: z.string().min(20),
        stack: z.enum(["auto", "html-css-js", "nextjs", "react"]).default("auto"),
        goal: z.string().optional(),
        extraConstraints: z.string().optional(),
      }),
    },
    async ({ businessBrief, stack, goal, extraConstraints }) => {
      const stackRule =
        stack === "html-css-js"
          ? "Use semantic HTML5, CSS custom properties and clean Vanilla JS. Avoid framework overhead."
          : stack === "nextjs"
            ? "Use the existing Next.js architecture and React conventions. Do not rewrite to another stack."
            : stack === "react"
              ? "Use the existing React architecture. Keep components purposeful and avoid unnecessary abstraction."
              : "Preserve the established project stack. For a lightweight greenfield local-business site, HTML/CSS/Vanilla JS is an acceptable default.";

      return text(`# Construction Prompt — Elite Site Architecture

You are building a premium website/landing page from verified business evidence.

## Verified brief
${businessBrief}

## Primary goal
${clean(goal) || "Generate qualified commercial contact without fabricated claims."}

## Stack
${stackRule}

## Non-negotiable art direction
- Centered cinematic first impression with strong editorial hierarchy.
- Avoid the default copy-left / rounded-image-right AI hero.
- One dominant visual/showcase anchor; up to two restrained glass information cards.
- Hierarchical bento sections instead of repetitive equal-card grids.
- Interactive tabs only when comparison genuinely benefits the user.
- Purposeful motion only: reveal, hover depth, subtle parallax or state transitions.
- No decorative emoji; use consistent SVG/vector icons.
- No invented reviews, clients, ratings, awards, CNPJ, photos or metrics.

## Copy
- Concrete pains, outcomes and objections.
- CBVL when useful: Característica → Benefício lógico → Vantagem → Ligação emocional.
- Never use guarantees or fake urgency.
- Remove generic phrases that could belong to any business.

## Mobile and technical
- Mobile-first with no horizontal overflow.
- Thumb-friendly CTAs and polished drawer navigation.
- Local-intent meta description, Open Graph and verified Schema.org.
- Accessible headings, labels, focus states and contrast.
- Responsive, optimized assets.

## Extra constraints
${clean(extraConstraints) || "None."}

## Delivery
Produce a build plan first, then implementation. Before finishing, audit the rendered result against Elite Site Architecture and explicitly list any missing evidence instead of inventing it.`);
    },
  );
});

export { handler as GET, handler as POST };
