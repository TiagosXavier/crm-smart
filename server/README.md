# 🚀 Backend Node.js - CRM Smart

Backend API REST completo para o CRM, usando Express e JSON file database.

## 📦 Tecnologias

- **Express** - Framework web
- **CORS** - Cross-origin requests
- **JSON** - Banco de dados em arquivo

## 🏗️ Estrutura

```
server/
├── index.js          # Servidor principal
└── db/
    └── database.json # Banco de dados (criado automaticamente)
```

## 🚀 Como Usar

### **Iniciar o servidor:**

```bash
npm run dev:backend
```

Ou diretamente:

```bash
node server/index.js
```

O servidor estará disponível em: **http://localhost:3000**

## 🔌 Rotas da API

### **Health Check**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-10T19:30:00.000Z"
}
```

---

### **Contacts**

#### Listar todos os contatos
```http
GET /api/contacts?sort=-created_date
```

**Response:**
```json
[
  {
    "id": "1234567890_abc123",
    "name": "João Silva",
    "phone": "(11) 99999-9999",
    "email": "joao@example.com",
    "cpf": "123.456.789-00",
    "company": "Empresa XYZ",
    "status": "novo",
    "stage": "novo",
    "tags": ["VIP", "Urgente"],
    "notes": "Cliente importante",
    "created_date": "2026-01-10T19:30:00.000Z",
    "updated_date": "2026-01-10T19:30:00.000Z"
  }
]
```

#### Buscar contato por ID
```http
GET /api/contacts/:id
```

#### Criar novo contato
```http
POST /api/contacts
Content-Type: application/json

{
  "name": "Maria Santos",
  "phone": "(11) 98888-8888",
  "email": "maria@example.com",
  "status": "novo"
}
```

#### Atualizar contato
```http
PUT /api/contacts/:id
Content-Type: application/json

{
  "status": "em_atendimento",
  "notes": "Cliente atendido"
}
```

#### Deletar contato
```http
DELETE /api/contacts/:id
```

---

### **Conversations**

```http
GET  /api/conversations      # Listar todas
POST /api/conversations      # Criar nova
```

---

### **Tasks**

```http
GET    /api/tasks        # Listar todas
POST   /api/tasks        # Criar nova
PUT    /api/tasks/:id    # Atualizar
DELETE /api/tasks/:id    # Deletar
```

---

### **Users**

```http
GET /api/users           # Listar todos
```

---

### **Templates**

```http
GET  /api/templates      # Listar todos
POST /api/templates      # Criar novo
```

---

### **Seed**

Popular banco de dados com dados mockados:

```http
POST /api/seed
Content-Type: application/json

{
  "contacts": [...],
  "conversations": [...],
  "tasks": [...],
  "users": [...],
  "templates": [...]
}
```

**Response:**
```json
{
  "message": "Database seeded successfully",
  "counts": {
    "contacts": 50,
    "conversations": 30,
    "tasks": 40,
    "users": 5,
    "templates": 10
  }
}
```

---

## 🗄️ Banco de Dados

### **Arquivo JSON**

Localização: `server/db/database.json`

Estrutura:
```json
{
  "contacts": [],
  "conversations": [],
  "tasks": [],
  "users": [],
  "templates": []
}
```

### **Operações**

- **readDB()** - Lê o arquivo JSON
- **writeDB(data)** - Escreve no arquivo JSON
- **generateId()** - Gera ID único (`timestamp_random`)

---

## 🔧 Configuração

### **Porta**

Padrão: `3000`

Para mudar, edite `server/index.js`:
```javascript
const PORT = 3000; // Mudar aqui
```

### **CORS**

Já configurado para aceitar requisições de qualquer origem em desenvolvimento.

Para produção, restrinja:
```javascript
app.use(cors({
  origin: 'https://seu-frontend.vercel.app'
}));
```

---

## 🚀 Deploy

### **Vercel**

1. Crie `vercel.json` na raiz do projeto:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server/index.js"
    }
  ]
}
```

2. Deploy:
```bash
vercel
```

### **Heroku**

1. Crie `Procfile`:
```
web: node server/index.js
```

2. Deploy:
```bash
git push heroku main
```

### **Railway**

1. Conecte repositório GitHub
2. Configure start command: `node server/index.js`
3. Deploy automático

---

## 🔒 Segurança

### **Para Produção:**

1. **Adicionar autenticação:**
```javascript
app.use('/api', authMiddleware);
```

2. **Validar inputs:**
```javascript
app.post('/api/contacts', validateContact, async (req, res) => {
  // ...
});
```

3. **Rate limiting:**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de requisições
});

app.use('/api', limiter);
```

4. **Helmet:**
```javascript
import helmet from 'helmet';
app.use(helmet());
```

---

## 📝 Logs

Console logs são exibidos quando:
- ✅ Servidor inicia
- 📦 Database é inicializada
- ❌ Erros ocorrem

Para adicionar logs detalhados:
```javascript
import morgan from 'morgan';
app.use(morgan('dev'));
```

---

## 🔄 Migrar para Banco Real

### **MongoDB:**

```javascript
import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  // ...
});

const Contact = mongoose.model('Contact', ContactSchema);

// Substituir readDB/writeDB por:
app.get('/api/contacts', async (req, res) => {
  const contacts = await Contact.find();
  res.json(contacts);
});
```

### **PostgreSQL:**

```javascript
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

app.get('/api/contacts', async (req, res) => {
  const result = await pool.query('SELECT * FROM contacts');
  res.json(result.rows);
});
```

---

## 🐛 Troubleshooting

### **Erro: "ENOENT: no such file or directory"**
O diretório `server/db/` será criado automaticamente. Se o erro persistir:
```bash
mkdir -p server/db
```

### **Porta já em uso**
Mude a porta no `index.js` ou mate o processo:
```bash
lsof -ti:3000 | xargs kill
```

### **Dados não persistem**
O `database.json` é recriado toda vez que o servidor inicia vazio. Para persistir, não delete o arquivo.

---

## 📖 Documentação Completa

- [MIGRATION_FROM_BASE44.md](../MIGRATION_FROM_BASE44.md) - Guia de migração
- [README.md](../README.md) - Documentação principal do projeto

---

**Backend funcionando! 🎉**
