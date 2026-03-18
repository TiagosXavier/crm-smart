-- ============================================================
-- Migration 002: Profiles, Contatos e Histórico
-- ============================================================

-- ============================================================
-- PROFILES (estende auth.users do Supabase)
-- ============================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null unique,
  role          user_role not null default 'agent',
  status        user_status not null default 'offline',
  avatar_url    text,
  phone         text,
  -- Limite de conversas simultâneas para agentes
  max_simultaneous_conversations int not null default 5 check (max_simultaneous_conversations between 1 and 50),
  is_active     boolean not null default true,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table profiles is 'Usuários do sistema CRM, sincronizados com auth.users';
comment on column profiles.max_simultaneous_conversations is 'Máximo de conversas que o agente pode atender ao mesmo tempo';

-- Índices
create index idx_profiles_role      on profiles(role);
create index idx_profiles_is_active on profiles(is_active);
create index idx_profiles_email     on profiles(email);

-- ============================================================
-- CONTATOS / LEADS
-- ============================================================

create table contacts (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  phone         text,                          -- formato livre para aceitar internacionais
  email         text,
  cpf           text check (cpf ~ '^\d{11}$' or cpf is null),
  company       text,
  job_title     text,
  -- Status no funil / atendimento
  status        contact_status not null default 'novo',
  -- Tags livres para categorização
  tags          text[] not null default '{}',
  notes         text,
  -- Origem do lead (ex: 'instagram', 'indicação', 'site')
  source        text,
  -- Responsável pelo contato
  assigned_to   uuid references profiles(id) on delete set null,
  created_by    uuid references profiles(id) on delete set null,
  last_contact_at timestamptz,
  is_active     boolean not null default true,
  -- Dados extras sem schema fixo (endereço, redes sociais, campos customizados)
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table contacts is 'Clientes e leads gerenciados pelo CRM';
comment on column contacts.tags is 'Array de tags livres: VIP, Urgente, Follow-up, etc.';
comment on column contacts.metadata is 'Dados extras não estruturados: endereço, redes sociais, campos customizados';

-- Índices
create index idx_contacts_status      on contacts(status);
create index idx_contacts_assigned_to on contacts(assigned_to);
create index idx_contacts_created_by  on contacts(created_by);
create index idx_contacts_is_active   on contacts(is_active);
create index idx_contacts_company     on contacts(company);
create index idx_contacts_tags        on contacts using gin(tags);
-- Busca textual por nome, email, telefone, empresa
create index idx_contacts_search on contacts
  using gin(to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(company, '')));

-- ============================================================
-- HISTÓRICO DE CONTATOS
-- ============================================================

create table contact_history (
  id          uuid primary key default uuid_generate_v4(),
  contact_id  uuid not null references contacts(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  action      contact_history_action not null,
  description text,                    -- Texto legível: "Status alterado de Novo para Em Atendimento"
  old_value   jsonb,                   -- Estado anterior do campo alterado
  new_value   jsonb,                   -- Novo estado do campo alterado
  created_at  timestamptz not null default now()
);

comment on table contact_history is 'Linha do tempo de todas as ações realizadas em um contato';

-- Índices
create index idx_contact_history_contact_id on contact_history(contact_id);
create index idx_contact_history_user_id    on contact_history(user_id);
create index idx_contact_history_created_at on contact_history(created_at desc);
create index idx_contact_history_action     on contact_history(action);
