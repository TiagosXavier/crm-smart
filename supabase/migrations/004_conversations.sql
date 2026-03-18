-- ============================================================
-- Migration 004: Conversas e Mensagens
-- ============================================================

-- ============================================================
-- CONVERSAS
-- ============================================================

create table conversations (
  id               uuid primary key default uuid_generate_v4(),
  contact_id       uuid not null references contacts(id) on delete restrict,
  assigned_to      uuid references profiles(id) on delete set null,
  channel          conversation_channel not null default 'whatsapp',
  status           conversation_status not null default 'ativo',
  -- Atalhos de exibição (atualizados por trigger a cada nova mensagem)
  last_message     text,
  last_message_at  timestamptz,
  unread_count     int not null default 0 check (unread_count >= 0),
  is_starred       boolean not null default false,
  -- Deal relacionado à conversa (opcional)
  deal_id          uuid references pipeline_deals(id) on delete set null,
  -- Dados extras: external_id do canal, nome do bot, etc.
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table conversations is 'Conversas com contatos em diferentes canais (WhatsApp, e-mail, etc.)';
comment on column conversations.unread_count is 'Contador de mensagens não lidas pelo agente, atualizado por trigger';
comment on column conversations.metadata is 'Dados do canal externo: external_id, nome do bot, número de origem, etc.';

-- Índices
create index idx_conversations_contact_id  on conversations(contact_id);
create index idx_conversations_assigned_to on conversations(assigned_to);
create index idx_conversations_status      on conversations(status);
create index idx_conversations_channel     on conversations(channel);
create index idx_conversations_is_starred  on conversations(is_starred) where is_starred = true;
create index idx_conversations_last_msg_at on conversations(last_message_at desc nulls last);
create index idx_conversations_deal_id     on conversations(deal_id);

-- ============================================================
-- MENSAGENS
-- ============================================================

create table conversation_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  -- NULL = mensagem veio do contato; preenchido = enviada por agente/bot
  sender_id       uuid references profiles(id) on delete set null,
  is_from_contact boolean not null default false,
  content         text not null,
  message_type    message_type not null default 'text',
  is_read         boolean not null default false,
  read_at         timestamptz,
  -- Template usado para gerar esta mensagem (opcional)
  template_id     uuid,   -- FK adicionada em 006
  -- Dados do canal externo (message_id externo, status de entrega, etc.)
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

comment on table conversation_messages is 'Mensagens individuais dentro de cada conversa';
comment on column conversation_messages.is_from_contact is 'true = mensagem recebida do contato; false = enviada pelo agente ou bot';

-- Índices
create index idx_messages_conversation_id on conversation_messages(conversation_id);
create index idx_messages_sender_id       on conversation_messages(sender_id);
create index idx_messages_created_at      on conversation_messages(created_at);
create index idx_messages_is_read         on conversation_messages(is_read) where is_read = false;
