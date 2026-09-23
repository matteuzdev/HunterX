-- 011_agents_and_flows.sql
-- Armazenamento real de Agentes GPT Maker, Fluxos ManyChat e Conversas Omnichannel

-- Tabela de Agentes de IA (Padrão GPT Maker)
create table if not exists public.hunter_agents (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  role text,
  tone text default 'consultivo',
  provider text default 'openai',
  model text default 'gpt-4o-mini',
  temperature numeric default 0.7,
  welcome_message text,
  system_prompt text,
  rules_should_do jsonb default '[]'::jsonb,
  rules_never_do jsonb default '[]'::jsonb,
  knowledge_base jsonb default '[]'::jsonb,
  intents jsonb default '[]'::jsonb,
  fallback_to_human boolean default true,
  handoff_keywords jsonb default '[]'::jsonb,
  handoff_message text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de Fluxos de Automação (Padrão ManyChat)
create table if not exists public.hunter_flows (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean default true,
  nodes jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de Conversas Reais (Omnichannel WhatsApp)
create table if not exists public.hunter_conversations (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  lead_name text not null,
  phone_number text not null,
  channel text default 'whatsapp',
  unread_count integer default 0,
  ai_handled boolean default false,
  assigned_agent_id text,
  lead_stage text default 'novo',
  city text,
  niche text,
  score integer default 0,
  tags jsonb default '[]'::jsonb,
  labels jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de Mensagens do Chat
create table if not exists public.hunter_messages (
  id text primary key,
  conversation_id text references public.hunter_conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  sender text not null, -- 'lead' | 'agent' | 'human'
  content text not null,
  status text default 'delivered',
  media_url text,
  media_type text,
  agent_name text,
  created_at timestamptz default now()
);

-- Políticas RLS (Row Level Security)
alter table public.hunter_agents enable row level security;
alter table public.hunter_flows enable row level security;
alter table public.hunter_conversations enable row level security;
alter table public.hunter_messages enable row level security;

create policy "Users can manage own agents"
  on public.hunter_agents for all
  using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can manage own flows"
  on public.hunter_flows for all
  using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can manage own conversations"
  on public.hunter_conversations for all
  using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can manage own messages"
  on public.hunter_messages for all
  using (auth.uid() = user_id or auth.uid() is null);
