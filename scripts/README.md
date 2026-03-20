# Script de Seed - CRM Smart

Este script popula o banco de dados do CRM com dados mockados para desenvolvimento e testes.

## Pré-requisitos

1. Certifique-se de que as variáveis de ambiente estão configuradas no arquivo `.env`:

```env
VITE_BASE44_APP_ID=seu-app-id
VITE_BASE44_BACKEND_URL=https://sua-url.base44.com
VITE_BASE44_FUNCTIONS_VERSION=v1
```

2. Instale as dependências:
```bash
npm install
```

## Como usar

Execute o script de seed:

```bash
npm run seed
```

## O que o script cria

### Contatos (50 por padrão)
- Nome completo (brasileiro)
- Telefone com DDD brasileiro
- Email válido
- CPF (50% dos contatos)
- Empresa (70% dos contatos)
- Stage (novo, em_atendimento, aguardando, resolvido, escalado)
- Tags (0-3 tags por contato)
- Notas (60% dos contatos)
- Data de criação (entre 01/01/2024 e hoje)

### Conversas (30 por padrão)
- Vinculadas a contatos existentes
- Última mensagem mockada
- Data da última mensagem (últimos 30 dias)
- Contador de mensagens não lidas
- Status (ativo, arquivado, aguardando)

### Tarefas (40 por padrão)
- Vinculadas a contatos existentes
- Título e descrição
- Data de vencimento (próximos 30 dias)
- Prioridade (baixa, média, alta, urgente)
- Status de conclusão (30% concluídas)

## Personalização

Você pode editar o arquivo `scripts/seed.js` para:

- Alterar a quantidade de registros gerados
- Modificar os dados mockados
- Adicionar novos tipos de entidades
- Ajustar probabilidades e distribuições

## Exemplo de uso

```javascript
// Gerar 100 contatos em vez de 50
const contacts = await generateContacts(100);

// Ajustar seed do Faker para resultados diferentes
faker.seed(Date.now());
```

## Nota

Os dados gerados são completamente fictícios e criados usando a biblioteca [@faker-js/faker](https://fakerjs.dev/) com localização pt_BR.
