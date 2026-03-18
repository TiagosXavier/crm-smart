-- ============================================================
-- Migration 005: Tarefas, Follow-ups e Lembretes
-- ============================================================

-- ============================================================
-- TAREFAS / FOLLOW-UPS
-- ============================================================

create table tasks (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  task_type    task_type not null default 'follow_up',
  priority     task_priority not null default 'media',
  status       task_status not null default 'pendente',
  -- Associações (contato e deal são opcionais mas pelo menos um deve existir)
  contact_id   uuid references contacts(id) on delete set null,
  deal_id      uuid references pipeline_deals(id) on delete set null,
  -- Responsabilidade
  assigned_to  uuid references profiles(id) on delete set null,
  created_by   uuid references profiles(id) on delete set null,
  -- Datas
  due_date     timestamptz,
  completed_at timestamptz,
  -- Resultado / conclusão
  outcome      text,  -- descrição do que aconteceu ao concluir
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Garantia: pelo menos contact ou deal deve estar associado
  constraint tasks_must_have_association check (
    contact_id is not null or deal_id is not null
  )
);

comment on table tasks is 'Tarefas e follow-ups vinculados a contatos e/ou deals';
comment on column tasks.outcome is 'Registro do que foi feito ao concluir a tarefa (ex: "Ligou, cliente interessado, reagendar em 3 dias")';

-- Índices
create index idx_tasks_contact_id   on tasks(contact_id);
create index idx_tasks_deal_id      on tasks(deal_id);
create index idx_tasks_assigned_to  on tasks(assigned_to);
create index idx_tasks_status       on tasks(status);
create index idx_tasks_priority     on tasks(priority);
create index idx_tasks_due_date     on tasks(due_date);
-- Índice parcial para tarefas pendentes (as mais consultadas)
create index idx_tasks_pending      on tasks(due_date, assigned_to)
  where status in ('pendente', 'em_andamento');

-- ============================================================
-- LEMBRETES DE TAREFAS
-- ============================================================

create table task_reminders (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  remind_at   timestamptz not null,
  channel     reminder_channel not null default 'app',
  is_sent     boolean not null default false,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

comment on table task_reminders is 'Lembretes agendados para tarefas, disparados via app/e-mail/WhatsApp';

-- Índices
create index idx_reminders_task_id   on task_reminders(task_id);
create index idx_reminders_user_id   on task_reminders(user_id);
-- Índice parcial para busca de lembretes pendentes de envio (usado pelo job de disparo)
create index idx_reminders_pending   on task_reminders(remind_at)
  where is_sent = false;
