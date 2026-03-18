-- ============================================================
-- Migration 008: Row Level Security (RLS) e Políticas de Acesso
-- ============================================================
--
-- Matriz de permissões:
-- ┌─────────────────────┬───────┬────────────┬──────────────────────────────┐
-- │ Tabela              │ admin │ supervisor │ agent/vendedor/suporte        │
-- │                     │       │ gerente    │                              │
-- ├─────────────────────┼───────┼────────────┼──────────────────────────────┤
-- │ profiles            │  ALL  │  SELECT    │ SELECT (todos) / UPDATE own  │
-- │ contacts            │  ALL  │  ALL       │ own + assigned               │
-- │ contact_history     │  ALL  │  ALL       │ read own contact's history   │
-- │ pipeline_stages     │  ALL  │  SELECT    │ SELECT                       │
-- │ pipeline_deals      │  ALL  │  ALL       │ own + assigned               │
-- │ deal_history        │  ALL  │  ALL       │ read own deal's history      │
-- │ deal_products       │  ALL  │  ALL       │ manage on own deals          │
-- │ conversations       │  ALL  │  ALL       │ own + assigned               │
-- │ conv. messages      │  ALL  │  ALL       │ via own conversations        │
-- │ tasks               │  ALL  │  ALL       │ own + assigned               │
-- │ task_reminders      │  ALL  │  ALL       │ own tasks only               │
-- │ templates           │  ALL  │  ALL       │ SELECT + INSERT              │
-- │ products            │  ALL  │  ALL       │ SELECT                       │
-- │ deal_products       │  ALL  │  ALL       │ manage on own deals          │
-- │ notifications       │  ALL  │  SELECT    │ own notifications            │
-- │ ai_configs          │  ALL  │  SELECT    │ SELECT (active only)         │
-- └─────────────────────┴───────┴────────────┴──────────────────────────────┘

-- ============================================================
-- ATIVA RLS EM TODAS AS TABELAS
-- ============================================================

alter table profiles               enable row level security;
alter table contacts               enable row level security;
alter table contact_history        enable row level security;
alter table pipeline_stages        enable row level security;
alter table pipeline_deals         enable row level security;
alter table deal_history           enable row level security;
alter table deal_products          enable row level security;
alter table conversations          enable row level security;
alter table conversation_messages  enable row level security;
alter table tasks                  enable row level security;
alter table task_reminders         enable row level security;
alter table templates              enable row level security;
alter table products               enable row level security;
alter table notifications          enable row level security;
alter table ai_configs             enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================

-- Qualquer usuário autenticado pode ver todos os perfis (necessário para assigns, mencions, etc.)
create policy "profiles: leitura pública para autenticados"
  on profiles for select
  to authenticated
  using (true);

-- Cada usuário pode atualizar apenas o próprio perfil
create policy "profiles: usuário atualiza o próprio perfil"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Impede que usuários communs elevem o próprio role
    and (
      is_admin_or_supervisor()
      or role = (select role from profiles where id = auth.uid())
    )
  );

-- Apenas admin pode inserir (criar) perfis manualmente
create policy "profiles: somente admin insere"
  on profiles for insert
  to authenticated
  with check (get_my_role() = 'admin');

-- Apenas admin pode deletar perfis
create policy "profiles: somente admin deleta"
  on profiles for delete
  to authenticated
  using (get_my_role() = 'admin');

-- ============================================================
-- CONTACTS
-- ============================================================

-- Admin/supervisor/gerente veem todos os contatos
create policy "contacts: admin e supervisor veem todos"
  on contacts for select
  to authenticated
  using (is_admin_or_supervisor());

-- Agentes veem apenas contatos atribuídos a eles ou que criaram
create policy "contacts: agente vê os próprios"
  on contacts for select
  to authenticated
  using (
    not is_admin_or_supervisor()
    and (assigned_to = auth.uid() or created_by = auth.uid())
  );

-- Qualquer autenticado pode criar contatos
create policy "contacts: autenticado cria"
  on contacts for insert
  to authenticated
  with check (
    -- created_by deve ser o próprio usuário
    created_by = auth.uid()
  );

-- Admin/supervisor podem atualizar qualquer contato
create policy "contacts: admin e supervisor atualizam todos"
  on contacts for update
  to authenticated
  using (is_admin_or_supervisor())
  with check (is_admin_or_supervisor());

-- Agentes só atualizam contatos atribuídos a eles ou que criaram
create policy "contacts: agente atualiza os próprios"
  on contacts for update
  to authenticated
  using (
    not is_admin_or_supervisor()
    and (assigned_to = auth.uid() or created_by = auth.uid())
  )
  with check (
    not is_admin_or_supervisor()
    and (assigned_to = auth.uid() or created_by = auth.uid())
  );

-- Apenas admin/supervisor podem deletar contatos
create policy "contacts: somente admin e supervisor deletam"
  on contacts for delete
  to authenticated
  using (is_admin_or_supervisor());

-- ============================================================
-- CONTACT_HISTORY
-- ============================================================

-- Admin/supervisor veem todo o histórico
create policy "contact_history: admin e supervisor veem tudo"
  on contact_history for select
  to authenticated
  using (is_admin_or_supervisor());

-- Agentes veem histórico dos próprios contatos
create policy "contact_history: agente vê histórico dos seus contatos"
  on contact_history for select
  to authenticated
  using (
    not is_admin_or_supervisor()
    and contact_id in (
      select id from contacts
      where assigned_to = auth.uid() or created_by = auth.uid()
    )
  );

-- Qualquer autenticado pode inserir entradas de histórico
create policy "contact_history: autenticado insere"
  on contact_history for insert
  to authenticated
  with check (user_id = auth.uid());

-- Histórico é imutável — ninguém atualiza nem deleta (somente admin pode limpar)
create policy "contact_history: somente admin deleta"
  on contact_history for delete
  to authenticated
  using (get_my_role() = 'admin');

-- ============================================================
-- PIPELINE_STAGES
-- ============================================================

-- Todos os autenticados podem ver as etapas
create policy "pipeline_stages: todos leem"
  on pipeline_stages for select
  to authenticated
  using (true);

-- Apenas admin gerencia etapas
create policy "pipeline_stages: somente admin modifica"
  on pipeline_stages for all
  to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ============================================================
-- PIPELINE_DEALS
-- ============================================================

create policy "deals: admin e supervisor veem todos"
  on pipeline_deals for select
  to authenticated
  using (is_admin_or_supervisor());

create policy "deals: agente vê os próprios"
  on pipeline_deals for select
  to authenticated
  using (
    not is_admin_or_supervisor()
    and (assigned_to = auth.uid() or created_by = auth.uid())
  );

create policy "deals: autenticado cria"
  on pipeline_deals for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "deals: admin e supervisor atualizam todos"
  on pipeline_deals for update
  to authenticated
  using (is_admin_or_supervisor())
  with check (is_admin_or_supervisor());

create policy "deals: agente atualiza os próprios"
  on pipeline_deals for update
  to authenticated
  using (
    not is_admin_or_supervisor()
    and (assigned_to = auth.uid() or created_by = auth.uid())
  )
  with check (
    not is_admin_or_supervisor()
    and (assigned_to = auth.uid() or created_by = auth.uid())
  );

create policy "deals: somente admin e supervisor deletam"
  on pipeline_deals for delete
  to authenticated
  using (is_admin_or_supervisor());

-- ============================================================
-- DEAL_HISTORY
-- ============================================================

create policy "deal_history: admin e supervisor veem tudo"
  on deal_history for select
  to authenticated
  using (is_admin_or_supervisor());

create policy "deal_history: agente vê histórico dos seus deals"
  on deal_history for select
  to authenticated
  using (
    not is_admin_or_supervisor()
    and deal_id in (
      select id from pipeline_deals
      where assigned_to = auth.uid() or created_by = auth.uid()
    )
  );

create policy "deal_history: autenticado insere"
  on deal_history for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "deal_history: somente admin deleta"
  on deal_history for delete
  to authenticated
  using (get_my_role() = 'admin');

-- ============================================================
-- DEAL_PRODUCTS
-- ============================================================

create policy "deal_products: leitura via acesso ao deal"
  on deal_products for select
  to authenticated
  using (
    deal_id in (
      select id from pipeline_deals
      where is_admin_or_supervisor()
         or assigned_to = auth.uid()
         or created_by = auth.uid()
    )
  );

create policy "deal_products: gerencia em deals próprios"
  on deal_products for all
  to authenticated
  using (
    deal_id in (
      select id from pipeline_deals
      where is_admin_or_supervisor()
         or assigned_to = auth.uid()
         or created_by = auth.uid()
    )
  )
  with check (
    deal_id in (
      select id from pipeline_deals
      where is_admin_or_supervisor()
         or assigned_to = auth.uid()
         or created_by = auth.uid()
    )
  );

-- ============================================================
-- CONVERSATIONS
-- ============================================================

create policy "conversations: admin e supervisor veem todas"
  on conversations for select
  to authenticated
  using (is_admin_or_supervisor());

create policy "conversations: agente vê as próprias"
  on conversations for select
  to authenticated
  using (
    not is_admin_or_supervisor()
    and assigned_to = auth.uid()
  );

create policy "conversations: autenticado cria"
  on conversations for insert
  to authenticated
  with check (true);

create policy "conversations: admin e supervisor atualizam todas"
  on conversations for update
  to authenticated
  using (is_admin_or_supervisor())
  with check (is_admin_or_supervisor());

create policy "conversations: agente atualiza as próprias"
  on conversations for update
  to authenticated
  using (
    not is_admin_or_supervisor()
    and assigned_to = auth.uid()
  )
  with check (
    not is_admin_or_supervisor()
    and assigned_to = auth.uid()
  );

create policy "conversations: somente admin e supervisor deletam"
  on conversations for delete
  to authenticated
  using (is_admin_or_supervisor());

-- ============================================================
-- CONVERSATION_MESSAGES
-- ============================================================

-- Mensagens seguem acesso à conversa
create policy "messages: leitura via acesso à conversa"
  on conversation_messages for select
  to authenticated
  using (
    conversation_id in (
      select id from conversations
      where is_admin_or_supervisor()
         or assigned_to = auth.uid()
    )
  );

create policy "messages: autenticado insere em conversas acessíveis"
  on conversation_messages for insert
  to authenticated
  with check (
    conversation_id in (
      select id from conversations
      where is_admin_or_supervisor()
         or assigned_to = auth.uid()
    )
  );

create policy "messages: somente admin deleta"
  on conversation_messages for delete
  to authenticated
  using (get_my_role() = 'admin');

-- ============================================================
-- TASKS
-- ============================================================

create policy "tasks: admin e supervisor veem todas"
  on tasks for select
  to authenticated
  using (is_admin_or_supervisor());

create policy "tasks: agente vê as atribuídas a ele ou que criou"
  on tasks for select
  to authenticated
  using (
    not is_admin_or_supervisor()
    and (assigned_to = auth.uid() or created_by = auth.uid())
  );

create policy "tasks: autenticado cria"
  on tasks for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "tasks: admin e supervisor atualizam todas"
  on tasks for update
  to authenticated
  using (is_admin_or_supervisor())
  with check (is_admin_or_supervisor());

create policy "tasks: agente atualiza as próprias"
  on tasks for update
  to authenticated
  using (
    not is_admin_or_supervisor()
    and (assigned_to = auth.uid() or created_by = auth.uid())
  )
  with check (
    not is_admin_or_supervisor()
    and (assigned_to = auth.uid() or created_by = auth.uid())
  );

create policy "tasks: somente admin e supervisor deletam"
  on tasks for delete
  to authenticated
  using (is_admin_or_supervisor());

-- ============================================================
-- TASK_REMINDERS
-- ============================================================

-- Usuário só vê lembretes de suas próprias tarefas
create policy "reminders: usuário vê os próprios"
  on task_reminders for select
  to authenticated
  using (user_id = auth.uid() or is_admin_or_supervisor());

create policy "reminders: usuário gerencia os próprios"
  on task_reminders for all
  to authenticated
  using (user_id = auth.uid() or is_admin_or_supervisor())
  with check (user_id = auth.uid() or is_admin_or_supervisor());

-- ============================================================
-- TEMPLATES
-- ============================================================

-- Todos os autenticados podem ler templates ativos
create policy "templates: todos leem ativos"
  on templates for select
  to authenticated
  using (is_active = true or is_admin_or_supervisor());

-- Admin/supervisor gerenciam todos; agentes só criam
create policy "templates: admin e supervisor gerenciam"
  on templates for all
  to authenticated
  using (is_admin_or_supervisor())
  with check (is_admin_or_supervisor());

create policy "templates: agente cria template"
  on templates for insert
  to authenticated
  with check (
    not is_admin_or_supervisor()
    and created_by = auth.uid()
  );

-- ============================================================
-- PRODUCTS
-- ============================================================

-- Todos os autenticados podem ver produtos ativos
create policy "products: todos leem ativos"
  on products for select
  to authenticated
  using (is_active = true or is_admin_or_supervisor());

-- Apenas admin/supervisor gerenciam o catálogo
create policy "products: somente admin e supervisor modificam"
  on products for all
  to authenticated
  using (is_admin_or_supervisor())
  with check (is_admin_or_supervisor());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

-- Cada usuário vê apenas suas próprias notificações
create policy "notifications: usuário vê as próprias"
  on notifications for select
  to authenticated
  using (user_id = auth.uid());

-- Sistema insere notificações (via service_role); usuário atualiza as suas (marcar como lida)
create policy "notifications: usuário atualiza as próprias"
  on notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Usuário pode deletar as próprias notificações
create policy "notifications: usuário deleta as próprias"
  on notifications for delete
  to authenticated
  using (user_id = auth.uid());

-- Admin insere notificações
create policy "notifications: admin insere"
  on notifications for insert
  to authenticated
  with check (get_my_role() = 'admin');

-- ============================================================
-- AI_CONFIGS
-- ============================================================

-- Todos veem configs ativas
create policy "ai_configs: todos leem as ativas"
  on ai_configs for select
  to authenticated
  using (is_active = true or is_admin_or_supervisor());

-- Apenas admin gerencia
create policy "ai_configs: somente admin modifica"
  on ai_configs for all
  to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');
