import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from "mcp-handler";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gohunterx.vercel.app";
const authServer = `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;

const handler = protectedResourceHandler({
  authServerUrls: [authServer],
});

const options = metadataCorsOptionsRequestHandler();

export { handler as GET, options as OPTIONS };
