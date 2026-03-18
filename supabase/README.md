# Supabase — CRM Smart

Schema completo do banco de dados para o CRM Smart.

## Como aplicar as migrations

### Opção 1 — Supabase CLI (recomendado)

```bash
# Instalar a CLI
npm install -g supabase

# Inicializar (na raiz do projeto)
supabase init

# Linkar ao projeto remoto
supabase link --project-ref <seu-project-ref>

# Aplicar todas as migrations em ordem
supabase db push
```

### Opção 2 — SQL Editor do Painel Supabase

Execute os arquivos **em ordem** no SQL Editor em `supabase.com/dashboard`:

1. `001_extensions_and_types.sql`
2. `002_profiles_and_contacts.sql`
3. `003_pipeline.sql`
4. `004_conversations.sql`
5. `005_tasks_and_reminders.sql`
6. `006_templates_products_notifications.sql`
7. `007_functions_and_triggers.sql`
8. `008_rls_policies.sql`
9. `009_initial_data.sql`

## Estrutura do Schema

```
profiles               → usuários (estende auth.users)
│
contacts               → clientes e leads
├── contact_history    → linha do tempo de ações
├── conversations      → conversas (WhatsApp, e-mail, etc.)
│   └── conversation_messages
├── tasks              → tarefas e follow-ups
│   └── task_reminders → lembretes agendados
└── pipeline_deals     → oportunidades de venda
    ├── deal_history   → movimentações de etapa
    └── deal_products  → produtos/serviços do deal

pipeline_stages        → etapas configuráveis do funil
products               → catálogo de produtos/serviços
templates              → templates de mensagem rápida
notifications          → notificações in-app
ai_configs             → configurações de agentes IA
```

## Variáveis de Ambiente

Adicione ao `.env`:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Roles e Permissões (RLS)

| Role       | Acesso                                                      |
|------------|-------------------------------------------------------------|
| `admin`    | Total — lê, cria, atualiza e deleta tudo                    |
| `supervisor` / `gerente` | Lê e atualiza tudo; não deleta                |
| `vendedor` / `agent` / `suporte` | Acessa apenas registros próprios ou atribuídos |

O papel do usuário é definido no campo `profiles.role` e consultado via a função `get_my_role()` nas políticas RLS.

## Dados Iniciais (migration 009)

- **6 etapas do pipeline**: Prospecção → Qualificação → Apresentação → Proposta → Negociação → Fechamento
- **6 templates de mensagem**: Boas-vindas, Despedida, Aguardar Retorno, Envio de Proposta, Follow-up Pós Reunião, Cobrança Amigável
- **5 produtos de demonstração**: Planos SaaS (Básico, Profissional, Enterprise) + Serviços (Implantação, Consultoria)
