"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AIAgent, AutomationFlow } from "@/lib/hunter/types";
import type { Conversation, ChatMessage } from "@/lib/hunter/types";

async function getSupabaseAuth() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { supabase: null, userId: null };

  const { data } = await supabase.auth.getUser();
  if (data.user) return { supabase, userId: data.user.id };

  const { data: anon } = await supabase.auth.signInAnonymously();
  return { supabase, userId: anon.user?.id || null };
}

// ==========================================
// AGENTES (SUPABASE STORE)
// ==========================================

export async function fetchAgentsFromSupabase(): Promise<AIAgent[]> {
  try {
    const { supabase, userId } = await getSupabaseAuth();
    if (!supabase || !userId) return [];

    const { data, error } = await supabase
      .from("hunter_agents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      avatar: "bot",
      role: row.role || "",
      tone: row.tone || "consultivo",
      provider: row.provider || "openai",
      model: row.model || "gpt-4o-mini",
      temperature: Number(row.temperature ?? 0.7),
      welcomeMessage: row.welcome_message,
      systemPrompt: row.system_prompt || "",
      rulesShouldDo: Array.isArray(row.rules_should_do) ? row.rules_should_do : [],
      rulesNeverDo: Array.isArray(row.rules_never_do) ? row.rules_never_do : [],
      knowledgeBase: Array.isArray(row.knowledge_base) ? row.knowledge_base : [],
      intents: Array.isArray(row.intents) ? row.intents : [],
      fallbackToHuman: Boolean(row.fallback_to_human),
      handoffKeywords: Array.isArray(row.handoff_keywords) ? row.handoff_keywords : [],
      handoffMessage: row.handoff_message,
      isActive: Boolean(row.is_active),
      assignedNiches: ["Geral"],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch {
    return [];
  }
}

export async function saveAgentToSupabase(agent: AIAgent): Promise<boolean> {
  try {
    const { supabase, userId } = await getSupabaseAuth();
    if (!supabase || !userId) return false;

    const payload = {
      id: agent.id,
      user_id: userId,
      name: agent.name,
      role: agent.role,
      tone: agent.tone,
      provider: agent.provider,
      model: agent.model,
      temperature: agent.temperature ?? 0.7,
      welcome_message: agent.welcomeMessage,
      system_prompt: agent.systemPrompt,
      rules_should_do: agent.rulesShouldDo || [],
      rules_never_do: agent.rulesNeverDo || [],
      knowledge_base: agent.knowledgeBase || [],
      intents: agent.intents || [],
      fallback_to_human: agent.fallbackToHuman,
      handoff_keywords: agent.handoffKeywords || [],
      handoff_message: agent.handoffMessage,
      is_active: agent.isActive,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("hunter_agents").upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteAgentFromSupabase(agentId: string): Promise<boolean> {
  try {
    const { supabase, userId } = await getSupabaseAuth();
    if (!supabase || !userId) return false;

    const { error } = await supabase
      .from("hunter_agents")
      .delete()
      .eq("id", agentId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// FLUXOS DE AUTOMAÇÃO (SUPABASE STORE)
// ==========================================

export async function fetchFlowsFromSupabase(): Promise<any[]> {
  try {
    const { supabase, userId } = await getSupabaseAuth();
    if (!supabase || !userId) return [];

    const { data, error } = await supabase
      .from("hunter_flows")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      targetNiche: "Geral",
      isActive: Boolean(row.is_active),
      nodes: Array.isArray(row.nodes) ? row.nodes : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch {
    return [];
  }
}

export async function saveFlowToSupabase(flow: any): Promise<boolean> {
  try {
    const { supabase, userId } = await getSupabaseAuth();
    if (!supabase || !userId) return false;

    const payload = {
      id: flow.id,
      user_id: userId,
      name: flow.name,
      description: flow.description,
      is_active: flow.isActive,
      nodes: flow.nodes,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("hunter_flows").upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteFlowFromSupabase(flowId: string): Promise<boolean> {
  try {
    const { supabase, userId } = await getSupabaseAuth();
    if (!supabase || !userId) return false;

    const { error } = await supabase
      .from("hunter_flows")
      .delete()
      .eq("id", flowId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// CONVERSAS & MENSAGENS (SUPABASE STORE)
// ==========================================

export async function fetchConversationsFromSupabase(): Promise<Conversation[]> {
  try {
    const { supabase, userId } = await getSupabaseAuth();
    if (!supabase || !userId) return [];

    const { data, error } = await supabase
      .from("hunter_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      leadName: row.lead_name,
      phoneNumber: row.phone_number,
      channel: (row.channel || "whatsapp") as any,
      unreadCount: row.unread_count || 0,
      aiHandled: Boolean(row.ai_handled),
      assignedAgentId: row.assigned_agent_id,
      leadStage: row.lead_stage as any,
      city: row.city,
      niche: row.niche,
      score: row.score || 0,
      tags: Array.isArray(row.tags) ? row.tags : [],
      labels: Array.isArray(row.labels) ? row.labels : [],
      updatedAt: row.updated_at,
    }));
  } catch {
    return [];
  }
}

export async function saveConversationToSupabase(conv: Conversation): Promise<boolean> {
  try {
    const { supabase, userId } = await getSupabaseAuth();
    if (!supabase || !userId) return false;

    const payload = {
      id: conv.id,
      user_id: userId,
      lead_name: conv.leadName,
      phone_number: conv.phoneNumber,
      channel: conv.channel,
      unread_count: conv.unreadCount,
      ai_handled: conv.aiHandled,
      assigned_agent_id: conv.assignedAgentId,
      lead_stage: conv.leadStage,
      city: conv.city,
      niche: conv.niche,
      score: conv.score,
      tags: conv.tags || [],
      labels: conv.labels || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("hunter_conversations").upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchMessagesFromSupabase(conversationId: string): Promise<ChatMessage[]> {
  try {
    const { supabase, userId } = await getSupabaseAuth();
    if (!supabase || !userId) return [];

    const { data, error } = await supabase
      .from("hunter_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      conversationId: row.conversation_id,
      sender: row.sender as any,
      content: row.content,
      timestamp: row.created_at,
      status: row.status as any,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      agentName: row.agent_name,
    }));
  } catch {
    return [];
  }
}

export async function saveMessageToSupabase(msg: ChatMessage): Promise<boolean> {
  try {
    const { supabase, userId } = await getSupabaseAuth();
    if (!supabase || !userId) return false;

    const payload = {
      id: msg.id,
      conversation_id: msg.conversationId,
      user_id: userId,
      sender: msg.sender,
      content: msg.content,
      status: msg.status,
      media_url: msg.mediaUrl,
      media_type: msg.mediaType,
      agent_name: msg.agentName,
      created_at: msg.timestamp || new Date().toISOString(),
    };

    const { error } = await supabase.from("hunter_messages").upsert(payload);
    return !error;
  } catch {
    return false;
  }
}
