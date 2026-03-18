-- ============================================================
-- Migration 006: Templates, Produtos/Serviços, Notificações e AI Configs
-- ============================================================

-- ============================================================
-- TEMPLATES DE MENSAGEM
-- ============================================================

create table templates (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  category    text not null,
  content     text not null,
  -- Atalho de teclado para usar o template (ex: /ola, /proposta)
  shortcut    text unique check (shortcut ~ '^/[a-z0-9_]+$' or shortcut is null),
  is_active   boolean not null default true,
  usage_count int not null default 0 check (usage_count >= 0),
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table templates is 'Templates de mensagem rápida com shortcuts de teclado';
comment on column templates.shortcut is 'Atalho no formato /palavra (ex: /ola, /proposta) — deve ser único';

-- Índices
create index idx_templates_category  on templates(category);
create index idx_templates_is_active on templates(is_active);
create index idx_templates_shortcut  on templates(shortcut) where shortcut is not null;

-- ============================================================
-- PRODUTOS / SERVIÇOS
-- ============================================================

create table products (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  description  text,
  category     text,
  sku          text unique,
  price        numeric(15, 2) not null default 0 check (price >= 0),
  currency     text not null default 'BRL',
  billing_type billing_type not null default 'unico',
  -- Para recorrências: ciclo em dias (30 = mensal, 365 = anual)
  billing_cycle_days int,
  -- Controle de estoque (null = sem controle)
  stock_quantity int,
  is_active    boolean not null default true,
  created_by   uuid references profiles(id) on delete set null,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table products is 'Catálogo de produtos e serviços disponíveis para incluir em deals';
comment on column products.billing_cycle_days is 'Ciclo de cobrança em dias para produtos recorrentes (30=mensal, 365=anual)';
comment on column products.stock_quantity is 'Controle de estoque; NULL significa sem controle de estoque';

-- Índices
create index idx_products_category  on products(category);
create index idx_products_is_active on products(is_active);
create index idx_products_sku       on products(sku) where sku is not null;

-- ============================================================
-- ADICIONA FKs QUE DEPENDEM DE TABELAS CRIADAS POSTERIORMENTE
-- ============================================================

-- deal_products → products (tabela criada em migration 003, products criado agora)
alter table deal_products
  add constraint fk_deal_products_product
  foreign key (product_id) references products(id) on delete restrict;

-- conversation_messages → templates
alter table conversation_messages
  add constraint fk_messages_template
  foreign key (template_id) references templates(id) on delete set null;

-- ============================================================
-- NOTIFICAÇÕES
-- ============================================================

create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  message     text not null,
  -- Link de deep-link para o recurso relacionado (ex: /contacts/uuid)
  link        text,
  -- IDs dos recursos relacionados para navegação
  contact_id  uuid references contacts(id) on delete cascade,
  deal_id     uuid references pipeline_deals(id) on delete cascade,
  task_id     uuid references tasks(id) on delete cascade,
  is_read     boolean not null default false,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

comment on table notifications is 'Notificações in-app para usuários do sistema';

-- Índices
create index idx_notifications_user_id    on notifications(user_id);
create index idx_notifications_is_read    on notifications(user_id, is_read) where is_read = false;
create index idx_notifications_created_at on notifications(created_at desc);

-- ============================================================
-- AI CONFIGS
-- ============================================================

create table ai_configs (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  model           text not null default 'claude-sonnet-4-6',
  system_prompt   text not null,
  temperature     numeric(3, 2) not null default 0.7 check (temperature between 0 and 2),
  max_tokens      int not null default 1024 check (max_tokens between 1 and 8192),
  is_active       boolean not null default false,
  -- Etapas do pipeline em que este agente pode atuar (vazio = todas)
  assigned_stages uuid[] not null default '{}',
  -- Canais em que este agente pode atuar (vazio = todos)
  assigned_channels conversation_channel[] not null default '{}',
  created_by      uuid references profiles(id) on delete set null,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table ai_configs is 'Configurações dos agentes de IA integrados ao CRM';
comment on column ai_configs.assigned_stages is 'UUIDs das etapas do pipeline em que este agente pode atuar; vazio = todas';
