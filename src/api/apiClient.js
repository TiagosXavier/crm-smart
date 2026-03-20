// API Client - Substitui completamente o Base44 SDK
// Usa o backend Node.js próprio

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper para fazer requisições
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Adiciona token de auth se existir
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// Create entity methods
const createEntityMethods = (entityName) => {
  // Pluralização simples (adiciona 's' ou ajusta casos especiais)
  const pluralize = (name) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('s')) return lower;
    if (lower.endsWith('y')) return lower.slice(0, -1) + 'ies';
    return lower + 's';
  };

  const endpoint = `/${pluralize(entityName)}`;

  return {
    // List entities with optional sort and limit
    list: async (sort = '-created_date', limit = null) => {
      const params = new URLSearchParams();
      if (sort) params.append('sort', sort);
      if (limit) params.append('limit', limit);
      const queryString = params.toString();
      return await request(`${endpoint}${queryString ? `?${queryString}` : ''}`);
    },

    // Get entity by ID
    get: async (id) => {
      return await request(`${endpoint}/${id}`);
    },

    // Create new entity
    create: async (data) => {
      return await request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Update entity
    update: async (id, data) => {
      return await request(`${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    // Delete entity
    delete: async (id) => {
      return await request(`${endpoint}/${id}`, {
        method: 'DELETE',
      });
    },

    // Query with filters
    filter: async (filters = {}) => {
      const queryString = new URLSearchParams(filters).toString();
      return await request(`${endpoint}${queryString ? `?${queryString}` : ''}`);
    },
  };
};

// Auth methods — JWT real
const createAuthMethods = () => {
  return {
    // Get current user
    me: async () => {
      try {
        return await request('/auth/me');
      } catch {
        return null;
      }
    },

    // Update current user
    updateMe: async (data) => {
      return await request('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    // Register
    register: async (email, password, full_name) => {
      const result = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name }),
      });
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }
      return result;
    },

    // Login
    login: async (email, password) => {
      const result = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }
      return result;
    },

    // Logout
    logout: () => {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    },

    // Redirect to login (compatibilidade)
    redirectToLogin: (returnUrl) => {
      localStorage.setItem('auth_return_url', returnUrl || window.location.href);
      window.location.href = '/login';
    },

    // Check if authenticated
    isAuthenticated: () => {
      return !!localStorage.getItem('auth_token');
    },
  };
};

// API Client (compatível com a estrutura do Base44)
export const api = {
  entities: {
    Contact: createEntityMethods('Contact'),
    Conversation: createEntityMethods('Conversation'),
    Task: createEntityMethods('Task'),
    User: createEntityMethods('User'),
    Template: createEntityMethods('Template'),
    AIConfig: createEntityMethods('AIConfig'),
    Notification: createEntityMethods('Notification'),
  },

  // Auth SDK
  auth: createAuthMethods(),

  // Helper para seed de dados
  seed: async (data) => {
    return await request('/seed', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Health check
  health: async () => {
    return await request('/health');
  },
};
