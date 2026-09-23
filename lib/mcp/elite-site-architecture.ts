export const ELITE_SITE_SKILL = `
# Elite Site Architecture

Use this standard before designing or building premium websites and landing pages, especially for local service businesses.

## Phase 0 — Research before layout
Consolidate only real evidence about the business: official name, city/state, public contact channels, services, visual identity, reputation, projects, current website/social presence and differentiators.
Never invent CNPJ, reviews, testimonials, ratings, awards, customers, project photos or credentials.

## Anti-AI visual rules
- Do not default to a clichéd two-column hero with copy left + rounded stock image right.
- Prefer a centered cinematic hero or product/showcase frame with strong editorial hierarchy.
- Do not use decorative emojis in the site body. Use consistent vector icons.
- Ban generic copy such as "somos apaixonados", "soluções completas", "líderes com excelência" and "a melhor escolha".
- Use concrete, business-specific language and real technical differentiators.
- Avoid monotonous equal-card grids. Use hierarchical bento composition with a clear anchor card.
- Motion must be restrained and purposeful: reveal, parallax-lite, hover depth, marquees only when justified, and smooth state transitions.

## Composition system
1. Cinematic centralized hero with refined display typography, one dominant visual/showcase frame and up to two glass information cards.
2. Hierarchical bento section for services, environments, use cases or product capabilities.
3. Interactive tabs for categories/materials/capabilities when comparison adds value.
4. Before/after or interactive comparison only when real source material exists.
5. Social proof only from genuine verifiable reviews. If none exist, use proof of process, portfolio or known metrics—or remove the module.
6. Conversion section with real contact/location/CTA information.

## Copy
Write for concrete pains, desired outcomes and buying objections.
Use CBVL thinking when useful:
- Característica: what exists.
- Benefício lógico: practical result.
- Vantagem: why this approach is preferable in context.
- Ligação emocional: confidence, control, status, relief or identity—without manufactured urgency or guarantees.

## Mobile
Mobile-first. No accidental horizontal overflow. Thumb-friendly controls. Full-width primary CTAs where appropriate. Horizontal tabs may scroll with inertia. Navigation becomes a polished drawer, not a squeezed desktop menu.

## Technical defaults
If there is no stack constraint, prefer semantic HTML5 + CSS custom properties + clean Vanilla JS for lightweight local-business sites.
If the project already uses Next.js/React or another established stack, keep that stack and apply the same art-direction principles instead of forcing a rewrite.

Include:
- local-intent meta description;
- Open Graph metadata;
- appropriate Schema.org markup using verified facts only;
- accessible headings and labels;
- fast responsive images/assets;
- clean footer and contact CTAs.

## Delivery gate
Before shipping:
- verify mobile at common widths;
- verify no fake data;
- verify CTA/contact links;
- verify interaction states;
- verify contrast and keyboard focus;
- verify performance regressions;
- remove visual clichés that make the page look AI-generated.

## Input template
Name:
City/state:
Commercial WhatsApp:
Instagram:
Current site:
Google Business/reputation:
Main services:
Differentiators:
Brand colors/assets:
Primary conversion goal:
Reference sites/components:
`;

export const ELITE_SITE_SECTIONS = {
  research: `## Research before layout
Use only verified business evidence. Gather official name, location, public contacts, services, identity, reputation, projects, current digital presence and differentiators. Never fabricate proof.`,
  visual: `## Visual direction
Centered cinematic hero; editorial hierarchy; dominant showcase; restrained glass cards; hierarchical bento; tabs only when useful; no decorative emoji; no generic two-column AI hero; purposeful motion only.`,
  copy: `## Copy
Concrete pains, outcomes and objections. Avoid generic agency language. Use CBVL when useful: Característica, Benefício lógico, Vantagem, Ligação emocional. No guarantees or invented urgency.`,
  mobile: `## Mobile
Mobile-first, no accidental overflow, thumb-friendly controls, full-width primary CTAs where appropriate, scrollable tabs and a polished navigation drawer.`,
  technical: `## Technical
Keep the project's established stack. For lightweight greenfield local-business sites, semantic HTML/CSS/Vanilla JS is a good default. Include local SEO metadata, Open Graph, verified Schema.org, accessibility and performance.`,
  delivery: `## Delivery gate
Verify mobile widths, real data only, contact/CTA links, interaction states, contrast, keyboard focus, performance and removal of AI-looking visual clichés.`,
} as const;

export type EliteSiteSection = keyof typeof ELITE_SITE_SECTIONS;
