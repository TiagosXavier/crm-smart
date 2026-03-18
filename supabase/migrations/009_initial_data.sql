-- ============================================================
-- Migration 009: Dados Iniciais (etapas do pipeline e categorias padrão)
-- ============================================================

-- ============================================================
-- ETAPAS DO PIPELINE (funil padrão)
-- ============================================================

insert into pipeline_stages (name, description, color, position, win_probability) values
  ('Prospecção',    'Leads identificados, ainda sem contato qualificado',          '#94a3b8', 0, 10),
  ('Qualificação',  'Lead confirmou interesse e tem budget/autoridade/necessidade', '#60a5fa', 1, 25),
  ('Apresentação',  'Demonstração ou proposta apresentada ao lead',                 '#a78bfa', 2, 40),
  ('Proposta',      'Proposta comercial formal enviada e em análise',               '#f59e0b', 3, 60),
  ('Negociação',    'Ajustes finais de contrato, preço ou condições',               '#f97316', 4, 75),
  ('Fechamento',    'Deal prestes a ser assinado',                                  '#10b981', 5, 90);

-- ============================================================
-- TEMPLATES DE MENSAGEM PADRÃO
-- ============================================================

-- Nota: created_by é NULL pois ainda não existe usuário no momento do seed.
-- Em produção, atualizar com o UUID do admin após criação do primeiro usuário.

insert into templates (name, category, content, shortcut, is_active) values
  (
    'Boas-vindas',
    'saudacao',
    'Olá, {{nome}}! 😊 Tudo bem? Aqui é {{agente}} da {{empresa}}. Como posso ajudar você hoje?',
    '/ola',
    true
  ),
  (
    'Despedida',
    'despedida',
    'Foi um prazer atendê-lo(a), {{nome}}! Qualquer dúvida, estamos à disposição. Tenha um ótimo dia! 👋',
    '/tchau',
    true
  ),
  (
    'Aguardar Retorno',
    'suporte',
    'Olá, {{nome}}! Verificamos sua solicitação e entraremos em contato em até {{prazo}}. Obrigado pela paciência!',
    '/aguardar',
    true
  ),
  (
    'Envio de Proposta',
    'vendas',
    'Olá, {{nome}}! Segue em anexo a proposta comercial que preparamos especialmente para você. Qualquer dúvida, é só chamar! 📄',
    '/proposta',
    true
  ),
  (
    'Follow-up Pós Reunião',
    'follow_up',
    'Oi, {{nome}}! Tudo certo? Passando para confirmar se ficou alguma dúvida após nossa conversa de {{data}}. Posso ajudar com mais alguma coisa?',
    '/posreuniao',
    true
  ),
  (
    'Cobrança Amigável',
    'financeiro',
    'Olá, {{nome}}! Tudo bem? Passando para lembrar que identificamos uma pendência financeira em seu cadastro. Podemos conversar a respeito?',
    '/cobranca',
    true
  );

-- ============================================================
-- CATEGORIAS DE PRODUTOS (referência — tabela de lookup)
-- ============================================================
-- Products não precisam de lookup table; category é texto livre.
-- Exemplos inseridos como produtos de demonstração:

insert into products (name, description, category, price, billing_type, is_active) values
  ('Plano Básico',     'Acesso às funcionalidades essenciais do CRM',    'Plano SaaS', 99.00,   'mensal',  true),
  ('Plano Profissional','Funcionalidades avançadas + 5 usuários inclusos', 'Plano SaaS', 299.00,  'mensal',  true),
  ('Plano Enterprise', 'Usuários ilimitados + suporte dedicado',          'Plano SaaS', 999.00,  'mensal',  true),
  ('Implantação',      'Configuração inicial e treinamento da equipe',    'Serviço',    1500.00, 'unico',   true),
  ('Consultoria',      'Hora de consultoria especializada',               'Serviço',    350.00,  'unico',   true);
