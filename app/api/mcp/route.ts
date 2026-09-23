import type { AuthInfo } from "@modelcontextprotocol/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import {
  createMcpSupabaseClient,
  getHunterAccount,
  getSavedSearch,
  getSegmentInsights,
  listPipeline,
  listSearchHistory,
  searchHunterXForUser,
  updatePipelineStage,
  verifyMcpUser,
} from "@/lib/mcp/hunterx";
import type { LeadStage } from "@/lib/hunter/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function response(value: unknown) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(value, null, 2),
    }],
  };
}

function context(ctx: { http?: { authInfo?: AuthInfo } }) {
  const auth = ctx.http?.authInfo;
  const token = auth?.token;
  const userId = String(auth?.extra?.userId || "");
  if (!token || !userId) throw new Error("Sessão HunterX não autenticada.");
  return { token, userId, supabase: createMcpSupabaseClient(token) };
}

const stages = [
  "novo", "analisado", "demonstracao", "contatado",
  "respondeu", "negociacao", "cliente", "perdido",
] as const;

const securitySchemes = [{ type: "oauth2" as const, scopes: ["email", "profile"] }];

const handler = createMcpHandler((server) => {
  server.registerTool(
    "get_account",
    {
      title: "Ver conta HunterX",
      description: "Mostra plano, saldo de tokens e configurações principais da conta HunterX conectada.",
      inputSchema: z.object({}),
      securitySchemes,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (_, ctx) => {
      const { supabase } = context(ctx);
      return response(await getHunterAccount(supabase));
    },
  );

  server.registerTool(
    "search_leads",
    {
      title: "Buscar leads no HunterX",
      description: "Executa uma busca real do HunterX por nicho/palavra-chave e cidade. Usa Hunter Engine primeiro e fallback quando necessário. Salva a busca no histórico e registra os leads no CRM. Uma nova coleta pode consumir tokens; contas Owner ilimitadas não sofrem débito.",
      inputSchema: z.object({
        keyword: z.string().min(1).max(120),
        city: z.string().min(1).max(120),
        limit: z.number().int().min(1).max(20).default(20),
      }),
      securitySchemes,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ keyword, city, limit }, ctx) => {
      const { supabase, userId } = context(ctx);
      return response(await searchHunterXForUser(supabase, userId, keyword, city, limit));
    },
  );

  server.registerTool(
    "list_search_history",
    {
      title: "Listar histórico HunterX",
      description: "Lista as buscas salvas da conta conectada. Reabrir uma busca salva não dispara nova coleta.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(30),
      }),
      securitySchemes,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ limit }, ctx) => {
      const { supabase } = context(ctx);
      return response(await listSearchHistory(supabase, limit));
    },
  );

  server.registerTool(
    "get_saved_search",
    {
      title: "Abrir busca salva",
      description: "Recupera os leads da busca salva mais recente para o nicho/palavra-chave e cidade informados, sem refazer a coleta.",
      inputSchema: z.object({
        keyword: z.string().min(1).max(120),
        city: z.string().min(1).max(120),
      }),
      securitySchemes,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ keyword, city }, ctx) => {
      const { supabase } = context(ctx);
      return response(await getSavedSearch(supabase, keyword, city));
    },
  );

  server.registerTool(
    "list_pipeline",
    {
      title: "Ver pipeline HunterX",
      description: "Lista leads do CRM/pipeline da conta conectada, com opção de filtrar por estágio.",
      inputSchema: z.object({
        status: z.enum(stages).optional(),
        limit: z.number().int().min(1).max(500).default(100),
      }),
      securitySchemes,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ status, limit }, ctx) => {
      const { supabase } = context(ctx);
      return response(await listPipeline(supabase, status as LeadStage | undefined, limit));
    },
  );

  server.registerTool(
    "update_lead_stage",
    {
      title: "Atualizar estágio de lead",
      description: "Move um lead existente do pipeline HunterX para outro estágio comercial.",
      inputSchema: z.object({
        leadKey: z.string().min(1).max(300),
        status: z.enum(stages),
      }),
      securitySchemes,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ leadKey, status }, ctx) => {
      const { supabase } = context(ctx);
      return response(await updatePipelineStage(supabase, leadKey, status as LeadStage));
    },
  );

  server.registerTool(
    "get_segment_insights",
    {
      title: "Analisar segmentos HunterX",
      description: "Compara os segmentos já pesquisados usando o histórico da conta: leads únicos, percentual sem site, telefone, leads quentes, rating e score médios.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(500).default(200),
      }),
      securitySchemes,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ limit }, ctx) => {
      const { supabase } = context(ctx);
      return response(await getSegmentInsights(supabase, limit));
    },
  );
}, {
  serverInfo: {
    name: "HunterX",
    version: "1.0.0",
  },
});

const verifyToken = async (
  _request: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;
  const verified = await verifyMcpUser(bearerToken);
  if (!verified) return undefined;

  return {
    token: bearerToken,
    scopes: ["hunterx"],
    clientId: verified.user.id,
    extra: {
      userId: verified.user.id,
      email: verified.user.email || "",
    },
  };
};

const authenticated = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

export { authenticated as GET, authenticated as POST, authenticated as DELETE };
