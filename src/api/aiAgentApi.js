// AI Agent API Client - Serviço externo no Railway
// Separado do apiClient.js pois usa base URL diferente e não requer auth token do CRM

const AI_AGENT_API_URL =
  import.meta.env.VITE_AI_AGENT_API_URL ||
  'https://crmaiagent-production.up.railway.app';

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
