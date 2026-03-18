-- ============================================================
-- Migration 003: Pipeline de Vendas
-- ============================================================

-- ============================================================
-- ETAPAS DO PIPELINE (funil configurável)
-- ============================================================

create table pipeline_stages (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  color       text not null default '#6366f1',  -- cor do cartão no kanban
  position    int not null,                      -- ordem de exibição (0, 1, 2...)
  -- Meta de % de conversão esperada nesta etapa
  win_probability int not null default 0 check (win_probability between 0 and 100),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (position)
);

comment on table pipeline_stages is 'Etapas configuráveis do funil de vendas (ex: Prospecção, Qualificação, Proposta)';
comment on column pipeline_stages.position is 'Posição no kanban, inicia em 0 (mais à esquerda)';
comment on column pipeline_stages.win_probability is 'Probabilidade padrão de fechamento nesta etapa (0-100%)';

create index idx_pipeline_stages_position  on pipeline_stages(position);
create index idx_pipeline_stages_is_active on pipeline_stages(is_active);

-- ============================================================
-- DEALS / OPORTUNIDADES
-- ============================================================

create table pipeline_deals (
  id                  uuid primary key default uuid_generate_v4(),
  title               text not null,
  contact_id          uuid not null references contacts(id) on delete restrict,
  stage_id            uuid not null references pipeline_stages(id) on delete restrict,
  assigned_to         uuid references profiles(id) on delete set null,
  created_by          uuid references profiles(id) on delete set null,
  -- Valor e previsão
  value               numeric(15, 2) not null default 0 check (value >= 0),
  currency            text not null default 'BRL',
  expected_close_date date,
  -- Probabilidade real (pode diferir da etapa)
  probability         int not null default 0 check (probability between 0 and 100),
  -- Estado do deal
  status              deal_status not null default 'open',
  lost_reason         text,           -- preenchido quando status = 'lost'
  closed_at           timestamptz,    -- quando foi ganho ou perdido
  notes               text,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table pipeline_deals is 'Oportunidades de venda associadas a contatos';
comment on column pipeline_deals.probability is 'Probabilidade real de fechamento (0-100%), pode ser ajustada manualmente';
comment on column pipeline_deals.lost_reason is 'Motivo do loss quando status = lost (preço, concorrente, não tem budget, etc.)';

-- Índices
create index idx_deals_contact_id  on pipeline_deals(contact_id);
create index idx_deals_stage_id    on pipeline_deals(stage_id);
create index idx_deals_assigned_to on pipeline_deals(assigned_to);
create index idx_deals_status      on pipeline_deals(status);
create index idx_deals_close_date  on pipeline_deals(expected_close_date);
create index idx_deals_created_at  on pipeline_deals(created_at desc);

-- ============================================================
-- HISTÓRICO DE MOVIMENTAÇÃO DO DEAL
-- ============================================================

create table deal_history (
  id            uuid primary key default uuid_generate_v4(),
  deal_id       uuid not null references pipeline_deals(id) on delete cascade,
  user_id       uuid references profiles(id) on delete set null,
  old_stage_id  uuid references pipeline_stages(id) on delete set null,
  new_stage_id  uuid references pipeline_stages(id) on delete set null,
  old_status    deal_status,
  new_status    deal_status,
  description   text,
  created_at    timestamptz not null default now()
);

comment on table deal_history is 'Rastreia movimentações de etapa e mudanças de status de cada deal';

create index idx_deal_history_deal_id    on deal_history(deal_id);
create index idx_deal_history_created_at on deal_history(created_at desc);

-- ============================================================
-- PRODUTOS / SERVIÇOS vinculados ao deal
-- ============================================================
-- (tabela products criada em 006 — esta tabela é criada depois,
--  a FK para products é adicionada via ALTER em 006)

create table deal_products (
  id          uuid primary key default uuid_generate_v4(),
  deal_id     uuid not null references pipeline_deals(id) on delete cascade,
  -- product_id adicionado em migration 006
  product_id  uuid,   -- referência adicionada em 006_templates_products_notifications
  quantity    int not null default 1 check (quantity > 0),
  -- Preço no momento do deal (snapshot, independente do preço atual do produto)
  unit_price  numeric(15, 2) not null check (unit_price >= 0),
  discount    numeric(5, 2) not null default 0 check (discount between 0 and 100),
  -- total = quantity * unit_price * (1 - discount/100)
  total       numeric(15, 2) generated always as (
                round(quantity * unit_price * (1 - discount / 100.0), 2)
              ) stored,
  created_at  timestamptz not null default now()
);

comment on table deal_products is 'Produtos/serviços associados a uma oportunidade de venda';
comment on column deal_products.unit_price is 'Preço snapshot no momento da inclusão no deal';
comment on column deal_products.total is 'Coluna calculada: quantity * unit_price * (1 - discount/100)';

create index idx_deal_products_deal_id    on deal_products(deal_id);
create index idx_deal_products_product_id on deal_products(product_id);
