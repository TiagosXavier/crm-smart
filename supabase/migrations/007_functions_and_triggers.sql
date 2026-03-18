-- ============================================================
-- Migration 007: Funções Utilitárias e Triggers
-- ============================================================

-- ============================================================
-- FUNÇÃO: atualiza updated_at automaticamente
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Aplica o trigger a todas as tabelas com updated_at
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_contacts_updated_at
  before update on contacts
  for each row execute function set_updated_at();

create trigger trg_pipeline_stages_updated_at
  before update on pipeline_stages
  for each row execute function set_updated_at();

create trigger trg_deals_updated_at
  before update on pipeline_deals
  for each row execute function set_updated_at();

create trigger trg_conversations_updated_at
  before update on conversations
  for each row execute function set_updated_at();

create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

create trigger trg_templates_updated_at
  before update on templates
  for each row execute function set_updated_at();

create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger trg_ai_configs_updated_at
  before update on ai_configs
  for each row execute function set_updated_at();

-- ============================================================
-- FUNÇÃO: cria perfil automaticamente ao registrar usuário
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'agent')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- FUNÇÃO: atualiza last_message e unread_count na conversa
-- ============================================================

create or replace function update_conversation_on_message()
returns trigger
language plpgsql
security definer
as $$
begin
  update conversations
  set
    last_message    = new.content,
    last_message_at = new.created_at,
    unread_count    = case
                        when new.is_from_contact then unread_count + 1
                        else unread_count
                      end,
    updated_at      = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_message_updates_conversation
  after insert on conversation_messages
  for each row execute function update_conversation_on_message();

-- ============================================================
-- FUNÇÃO: zera unread_count ao arquivar ou marcar como lida
-- ============================================================

create or replace function reset_unread_on_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'arquivado' and old.status != 'arquivado' then
    new.unread_count = 0;
  end if;
  return new;
end;
$$;

create trigger trg_reset_unread_on_archive
  before update on conversations
  for each row
  when (new.status is distinct from old.status)
  execute function reset_unread_on_status_change();

-- ============================================================
-- FUNÇÃO: registra histórico ao alterar status do contato
-- ============================================================

create or replace function log_contact_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status is distinct from old.status then
    insert into contact_history (contact_id, user_id, action, description, old_value, new_value)
    values (
      new.id,
      auth.uid(),
      'status_changed',
      'Status alterado de "' || old.status || '" para "' || new.status || '"',
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    insert into contact_history (contact_id, user_id, action, description, old_value, new_value)
    values (
      new.id,
      auth.uid(),
      'assigned',
      'Responsável alterado',
      jsonb_build_object('assigned_to', old.assigned_to),
      jsonb_build_object('assigned_to', new.assigned_to)
    );
  end if;

  return new;
end;
$$;

create trigger trg_contact_history
  after update on contacts
  for each row execute function log_contact_status_change();

-- ============================================================
-- FUNÇÃO: registra movimentação de deal no histórico
-- ============================================================

create or replace function log_deal_movement()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.stage_id is distinct from old.stage_id
     or new.status is distinct from old.status
  then
    insert into deal_history (
      deal_id, user_id,
      old_stage_id, new_stage_id,
      old_status, new_status,
      description
    )
    values (
      new.id,
      auth.uid(),
      old.stage_id, new.stage_id,
      old.status,  new.status,
      case
        when new.stage_id is distinct from old.stage_id
             and new.status is distinct from old.status
          then 'Etapa e status alterados'
        when new.stage_id is distinct from old.stage_id
          then 'Movido de etapa'
        else 'Status alterado para "' || new.status || '"'
      end
    );

    -- Fecha o deal quando ganho/perdido
    if new.status in ('won', 'lost', 'cancelled') and old.status = 'open' then
      new.closed_at = now();
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_deal_history
  after update on pipeline_deals
  for each row execute function log_deal_movement();

-- ============================================================
-- FUNÇÃO: incrementa usage_count do template ao ser usado
-- ============================================================

create or replace function increment_template_usage()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.template_id is not null then
    update templates
    set usage_count = usage_count + 1
    where id = new.template_id;
  end if;
  return new;
end;
$$;

create trigger trg_template_usage
  after insert on conversation_messages
  for each row
  when (new.template_id is not null)
  execute function increment_template_usage();

-- ============================================================
-- FUNÇÃO: helper para obter papel do usuário atual (usada em RLS)
-- ============================================================

create or replace function get_my_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- ============================================================
-- FUNÇÃO: verifica se usuário atual é admin ou supervisor
-- ============================================================

create or replace function is_admin_or_supervisor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('admin', 'supervisor', 'gerente')
      and is_active = true
  );
$$;
