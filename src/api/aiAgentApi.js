// AI Agent API Client - Serviço externo no Railway
// Separado do apiClient.js pois usa base URL diferente e não requer auth token do CRM
// Em dev usa proxy do Vite (/ai-agent-api) para evitar CORS
// Em produção usa a URL direta do Railway

const isDev = import.meta.env.DEV;
const AI_AGENT_API_URL = isDev
  ? '/ai-agent-api'
  : (import.meta.env.VITE_AI_AGENT_API_URL || 'https://crmaiagent-production.up.railway.app');

async function aiAgentRequest(endpoint, options = {}) {
  const url = `${AI_AGENT_API_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(
        error.error || error.message || `HTTP ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`AI Agent API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export async function createAgent({
  company_id,
  name,
  personality,
  goal,
  additional_info,
  model = 'gpt-4o-mini',
  status = 'active',
}) {
  return aiAgentRequest('/v1/agents', {
    method: 'POST',
    body: JSON.stringify({
      company_id,
      name,
      personality,
      goal,
      additional_info,
      model,
      status,
    }),
  });
}

export async function listAgents(company_id) {
  return aiAgentRequest(`/v1/agents?company_id=${encodeURIComponent(company_id)}`, {
    method: 'GET',
  });
}

export async function updateAgent(agent_id, data) {
  return aiAgentRequest(`/v1/agents/${encodeURIComponent(agent_id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAgent(agent_id) {
  return aiAgentRequest(`/v1/agents/${encodeURIComponent(agent_id)}`, {
    method: 'DELETE',
  });
}

export async function chatWithAgent({
  user_id,
  texto,
  agent_id,
  company_id,
}) {
  return aiAgentRequest('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ user_id, texto, agent_id, company_id }),
  });
}
