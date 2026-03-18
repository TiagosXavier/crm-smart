-- ============================================================
-- Migration 001: Extensions e Tipos (Enums)
-- ============================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- Busca textual eficiente

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum (
  'admin',
  'supervisor',
  'gerente',
  'vendedor',
  'suporte',
  'agent'
);

create type user_status as enum (
  'online',
  'away',
  'offline'
);

create type contact_status as enum (
  'novo',
  'em_atendimento',
  'aguardando',
  'resolvido',
  'escalado'
);

create type contact_history_action as enum (
  'created',
  'status_changed',
  'assigned',
  'note_added',
  'tag_added',
  'tag_removed',
  'call_made',
  'email_sent',
  'meeting_scheduled',
  'deal_created',
  'deal_won',
  'deal_lost',
  'field_updated'
);

create type deal_status as enum (
  'open',
  'won',
  'lost',
  'cancelled'
);

create type conversation_status as enum (
  'ativo',
  'aguardando',
  'arquivado'
);

create type conversation_channel as enum (
  'whatsapp',
  'email',
  'telefone',
  'chat',
  'instagram',
  'outro'
);

create type message_type as enum (
  'text',
  'image',
  'file',
  'audio',
  'video',
  'template',
  'system'
);

create type task_type as enum (
  'ligar',
  'email',
  'reuniao',
  'follow_up',
  'proposta',
  'demonstracao',
  'outro'
);

create type task_status as enum (
  'pendente',
  'em_andamento',
  'concluida',
  'cancelada'
);

create type task_priority as enum (
  'baixa',
  'media',
  'alta',
  'urgente'
);

create type reminder_channel as enum (
  'app',
  'email',
  'whatsapp'
);

create type billing_type as enum (
  'unico',
  'mensal',
  'anual',
  'personalizado'
);

create type notification_type as enum (
  'tarefa_vencendo',
  'nova_conversa',
  'contato_atribuido',
  'deal_movido',
  'deal_ganho',
  'deal_perdido',
  'mencao',
  'sistema'
);
