// API Client — Supabase
// Mantém a mesma interface pública do cliente anterior para não quebrar as páginas existentes.

import { supabase } from '@/lib/supabase'

// ─── Mapeamento entity → tabela ────────────────────────────────────────────────
const TABLE_MAP = {
  contact:       'contacts',
  conversation:  'conversations',
  task:          'tasks',
  user:          'profiles',       // usuários vivem em profiles
  template:      'templates',
  aiconfig:      'ai_configs',
  notification:  'notifications',
  pipelinedeal:  'pipeline_deals',
  pipelinestage: 'pipeline_stages',
  product:       'products',
}

function getTable(entityName) {
  const key = entityName.toLowerCase().replace(/[^a-z]/g, '')
  return TABLE_MAP[key] ?? key + 's'
}

// ─── Normalização de campos ────────────────────────────────────────────────────
// Adiciona aliases para manter compatibilidade com os nomes usados nas páginas.
function normalize(record) {
  if (!record) return record
  return {
    ...record,
    // Timestamps: páginas usam created_date/updated_date, banco usa created_at/updated_at
    created_date: record.created_at ?? record.created_date,
    updated_date: record.updated_at ?? record.updated_date,
    // profiles: páginas usam max_simultaneous, banco usa max_simultaneous_conversations
    max_simultaneous: record.max_simultaneous_conversations ?? record.max_simultaneous,
    // contacts: páginas usam last_contact, banco usa last_contact_at
    last_contact: record.last_contact_at ?? record.last_contact,
    // notifications: páginas usam read, banco usa is_read
    read: record.is_read ?? record.read,
  }
}

// Remove/traduz campos antes de inserir/atualizar (o banco controla timestamps)
function prepareData(data) {
  // eslint-disable-next-line no-unused-vars
  const { created_date, updated_date, created_at, updated_at, max_simultaneous, read, ...rest } = data

  // Traduz max_simultaneous → max_simultaneous_conversations
  if (max_simultaneous !== undefined) {
    rest.max_simultaneous_conversations = max_simultaneous
  }
  // Traduz read → is_read
  if (read !== undefined) {
    rest.is_read = read
  }
  return rest
}

// ─── Parser de sort ────────────────────────────────────────────────────────────
// Aceita '-created_date' (desc) e 'name' (asc), igual ao backend anterior.
function parseSort(sort) {
  if (!sort) return { column: 'created_at', ascending: false }
  const ascending = !sort.startsWith('-')
  let column = sort.replace(/^-/, '')
  if (column === 'created_date') column = 'created_at'
  if (column === 'updated_date') column = 'updated_at'
  return { column, ascending }
}

// ─── Factory de métodos por entidade ──────────────────────────────────────────
function createEntityMethods(entityName) {
  const table = getTable(entityName)

  return {
    list: async (sort = '-created_date', limit = null) => {
      const { column, ascending } = parseSort(sort)
      let query = supabase.from(table).select('*').order(column, { ascending })
      if (limit) query = query.limit(Number(limit))
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return (data ?? []).map(normalize)
    },

    get: async (id) => {
      const { data, error } = await supabase
        .from(table).select('*').eq('id', id).single()
      if (error) throw new Error(error.message)
      return normalize(data)
    },

    create: async (rawData) => {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        // Injeta created_by automaticamente se a tabela tiver o campo e ele não vier preenchido
        ...(user ? { created_by: user.id } : {}),
        ...prepareData(rawData),
      }
      const { data, error } = await supabase
        .from(table).insert(payload).select().single()
      if (error) throw new Error(error.message)
      return normalize(data)
    },

    update: async (id, rawData) => {
      const { data, error } = await supabase
        .from(table).update(prepareData(rawData)).eq('id', id).select().single()
      if (error) throw new Error(error.message)
      return normalize(data)
    },

    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw new Error(error.message)
      return { success: true }
    },

    // Filtros por igualdade exata: { status: 'novo', company: 'ACME' }
    filter: async (filters = {}) => {
      let query = supabase.from(table).select('*')
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return (data ?? []).map(normalize)
    },
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function createAuthMethods() {
  return {
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      return profile ? normalize(profile) : null
    },

    updateMe: async (updates) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      const { data, error } = await supabase
        .from('profiles').update(prepareData(updates)).eq('id', user.id).select().single()
      if (error) throw new Error(error.message)
      return normalize(data)
    },

    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single()
      return { user: profile ? normalize(profile) : data.user, session: data.session }
    },

    logout: async () => {
      await supabase.auth.signOut()
      window.location.href = '/'
    },

    isAuthenticated: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    },

    // Mantido para compatibilidade (não redireciona mais, a UI controla)
    redirectToLogin: () => {},
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
export const api = {
  entities: {
    Contact:       createEntityMethods('Contact'),
    Conversation:  createEntityMethods('Conversation'),
    Task:          createEntityMethods('Task'),
    User:          createEntityMethods('User'),
    Template:      createEntityMethods('Template'),
    AIConfig:      createEntityMethods('AIConfig'),
    Notification:  createEntityMethods('Notification'),
    PipelineDeal:  createEntityMethods('PipelineDeal'),
    PipelineStage: createEntityMethods('PipelineStage'),
    Product:       createEntityMethods('Product'),
  },
  auth: createAuthMethods(),
}
