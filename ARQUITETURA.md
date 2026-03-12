# 🏗️ Arquitetura — LM EduKids (Escalável)

Documentação técnica: Como estruturar o código para crescer sem refatorar tudo.

---

## 📂 Estrutura de Pastas (Proposta)

```
lmedukids/
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadArea.jsx
│   │   │   ├── ContentDisplay.jsx
│   │   │   ├── Quiz.jsx
│   │   │   ├── PracticeMode.jsx
│   │   │   └── TeacherPanel.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Teacher.jsx
│   │   │   └── Auth.jsx
│   │   │
│   │   ├── utils/
│   │   │   ├── api.js       (chamadas ao backend)
│   │   │   ├── storage.js   (localStorage/cache)
│   │   │   └── helpers.js   (funções comuns)
│   │   │
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   ├── components.css
│   │   │   └── responsive.css
│   │   │
│   │   └── App.jsx
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js       (login/signup)
│   │   │   ├── content.js    (análise, geração)
│   │   │   ├── grade.js      (correção, feedback)
│   │   │   ├── teacher.js    (painel professor)
│   │   │   └── student.js    (dados aluno)
│   │   │
│   │   ├── controllers/
│   │   │   ├── contentController.js
│   │   │   ├── gradeController.js
│   │   │   └── teacherController.js
│   │   │
│   │   ├── services/
│   │   │   ├── aiService.js     (chamadas à IA)
│   │   │   ├── dbService.js     (Firestore)
│   │   │   ├── ocrService.js    (Tesseract, AWS Rekognition)
│   │   │   └── pdfService.js    (geração de PDF)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js          (verificar token)
│   │   │   ├── errorHandler.js  (tratamento centralizado)
│   │   │   ├── rateLimit.js     (rate limiting)
│   │   │   └── logger.js        (logs)
│   │   │
│   │   ├── utils/
│   │   │   ├── constants.js     (valores fixos)
│   │   │   ├── validators.js    (validar inputs)
│   │   │   └── prompts.js       (prompts de IA)
│   │   │
│   │   ├── config/
│   │   │   ├── firebase.js      (inicializar Firebase)
│   │   │   ├── database.js      (schemas Firestore)
│   │   │   └── env.js           (variáveis de ambiente)
│   │   │
│   │   └── server.js            (entrada principal)
│   │
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── docs/
│   ├── API.md          (documentação de rotas)
│   ├── DEPLOYMENT.md   (como fazer deploy)
│   └── TROUBLESHOOTING.md
│
├── tests/
│   ├── integration/
│   ├── unit/
│   └── fixtures/       (imagens para testes)
│
├── ROADMAP.md          (este documento)
├── IMPLEMENTACAO.md
├── ARQUITETURA.md      (este arquivo)
└── README.md
```

---

## 🔄 Fluxo de Dados (Diagrama Conceitual)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Usuario tira foto   →  Comprime imagem  →  Envia base64        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ↓ POST /api/content/analyze
┌──────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                  │
│  ├─→ Middleware: Auth + RateLimit + Logger                      │
│  └─→ Route: /api/content/analyze                                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ↓ contentController.analyzeImage()
┌──────────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                               │
│  ├─→ Validar input                                               │
│  ├─→ Chamar serviços                                             │
│  └─→ Formatar resposta                                           │
└──────────────────────────────┬──────────────────────────────────┘
                ┌──────────────┼──────────────┐
                ↓              ↓              ↓
        ┌───────────────┐ ┌──────────┐ ┌───────────┐
        │ aiService    │ │dbService │ │ocrService │
        │(chamada IA)  │ │(salvar) │ │(ler texto)│
        └───────────────┘ └──────────┘ └───────────┘
                │
                ↓ chamada a OpenAI/Claude
        ┌───────────────────────────────┐
        │    IA PROVIDER API            │
        │  (OpenAI / Claude / Gemini)  │
        └───────────────────────────────┘
                │
                ↓ JSON estruturado
        ┌───────────────────────────────┐
        │  Banco de Dados (Firestore)   │
        │  ├─ exercises                  │
        │  ├─ user_progress             │
        │  └─ content_cache             │
        └───────────────────────────────┘
                │
                ↓ JSON de resposta
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                  │
│  Renderiza conteúdo  →  Mostra abas  →  Usuario interage        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Autenticação & Segurança

### Status Atual (Fase 1)
```
❌ Sem autenticação
❌ Sem verificação de usuário
❌ Qualquer um pode chamar /api/messages
```

### Implementação Segura (Fase 2+)

```javascript
// backend/src/middleware/auth.js
const admin = require('firebase-admin');

async function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token ausente' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Adicionar dados do usuário ao request
    req.user = decodedToken;
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { verifyToken };
```

```javascript
// backend/src/routes/content.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const contentController = require('../controllers/contentController');

// Proteger rota: requer autenticação
router.post('/analyze', verifyToken, async (req, res) => {
  try {
    const result = await contentController.analyzeImage(
      req.body,
      req.uid  // Passar user ID
    );
    
    // Salvar em histórico do usuário
    await dbService.saveExercise(req.uid, {
      ...result,
      createdAt: new Date(),
      imageHash: hashImage(req.body.imageBase64)
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Frontend: Enviar token

```javascript
// frontend/src/utils/api.js
async function analyzeImage(imageBase64, imageType, grade) {
  // Pegar token do localStorage
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('/api/content/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // ← Adicionar token
    },
    body: JSON.stringify({
      imageBase64,
      imageType,
      grade
    })
  });
  
  if (response.status === 401) {
    // Redirecionar para login
    window.location.href = '/login';
  }
  
  return response.json();
}
```

---

## 💾 Modelo de Dados (Firestore)

```javascript
// backend/src/config/database.js

// Coleção: users
{
  uid: "user_001",
  email: "aluno@example.com",
  role: "student", // ou "teacher"
  grade: 3,
  createdAt: timestamp,
  lastLogin: timestamp,
  preferences: {
    language: "pt-BR",
    theme: "light",
    notificationsEnabled: true
  }
}

// Coleção: exercises
{
  id: "exercise_001",
  userId: "user_001",
  imageUrl: "gs://bucket/image_001.jpg",
  grade: 3,
  subject: "Mathematics",
  difficulty: "medium",
  content: {
    topico: "Multiplicação",
    explicacao: {
      titulo: "...",
      intro: "...",
      conceitos: [...]
    },
    exercicios: [...],
    quiz: [...]
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  isArchived: false
}

// Coleção: user_progress
{
  id: "progress_001",
  userId: "user_001",
  exerciseId: "exercise_001",
  subject: "Mathematics",
  questionIndex: 0,
  attempts: 2,
  correct: false,
  timeSpentSeconds: 45,
  feedbackGiven: "Tente novamente...",
  createdAt: timestamp
}

// Coleção: lists (Professor)
{
  id: "list_001",
  teacherId: "user_002",
  name: "Prova - Capítulo 5",
  exercises: ["exercise_001", "exercise_002", ...],
  createdAt: timestamp,
  sharedWith: ["student_001", "student_002"] // opcional
}
```

---

## 🚀 Escalabilidade: De MVP a Escala

### Fase 1-2: MVP (Sem muitos usuários)
```
Frontend (Next.js)
      ↓
Backend (Node.js simples)
      ↓
Firestore + Storage
      ↓
OpenAI API
```

**Limites:** ~1000 usuários, máquina pequena.

---

### Fase 3-4: Crescimento (Muitos usuários)
```
Frontend (Next.js no Vercel)
      ↓
Load Balancer (Vercel automático)
      ↓
Backend replicas (Docker containers)
      ↓
Firestore (escalável automaticamente)
      ↓
Cache (Redis)
      ↓
Queue (Bull Redis) para PDFs, áudios
      ↓
OpenAI API + Claude API (distribuir carga)
```

**Adições:**
- Redis para cache de prompts frequentes
- Bull Queue para processamento async
- Múltiplas instâncias de backend
- CDN para imagens

---

### Fase 5+: EdTech Profissional (Escala máxima)
```
Frontend (Next.js + CDN global + edge computing)
      ↓
API Gateway (Kong ou AWS API Gateway)
      ↓
Microserviços:
├─ content-service (análise, geração)
├─ student-service (progresso, perfil)
├─ teacher-service (painel, relatórios)
├─ gamification-service (badges, níveis)
└─ notification-service (emails, push)
      ↓
Banco dados distribuído (Firestore + read replicas)
      ↓
Search engine (Elasticsearch para buscas globais)
      ↓
IA:
├─ Multiple providers (OpenAI, Claude, Gemini)
├─ Fine-tuned models (educação brasileira)
└─ Local models (fallback offline)
      ↓
Analytics (BigQuery, Mixpanel)
```

---

## 📊 Exemplo: Fluxo Completo da Fase 1

### Usuario envia foto → App analisa → Gera conteúdo

#### 1. Frontend: `frontend/app.js`
```javascript
// Usuario clica "Analisar Tarefa com IA"
analyzeBtn.addEventListener('click', async () => {
  analyzeBtn.disabled = true;
  showLoadingSpinner();
  
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: uploadedImageBase64,
        imageType: uploadedImageType,
        grade: currentGrade
      })
    });
    
    const data = await response.json();
    
    // Renderizar conteúdo
    renderContent(data);
    
    // Mostrar abas
    document.getElementById('tab-explanation').classList.remove('hidden');
    document.getElementById('tab-practice').classList.remove('hidden');
    
  } catch (error) {
    showError('Erro ao analisar. Tente novamente.');
  }
});
```

#### 2. Backend: `backend/server.js`
```javascript
app.post('/api/messages', async (req, res) => {
  const { imageBase64, imageType, grade } = req.body;
  
  // Validar
  if (!imageBase64 || !grade) {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }
  
  try {
    // 1. Chamar serviço de IA
    const analysis = await aiService.analyzeImage({
      imageBase64,
      imageType,
      grade
    });
    
    // 2. Estruturar resposta
    const content = {
      topico: analysis.topico,
      explicacao: analysis.explicacao,
      exercicios: analysis.exercicios,
      quiz: analysis.quiz
    };
    
    // 3. Retornar
    res.json(content);
    
  } catch (error) {
    console.error('Erro na análise:', error);
    res.status(500).json({ 
      error: 'Erro ao processar imagem'
    });
  }
});
```

#### 3. Serviço de IA: `backend/services/aiService.js`
```javascript
const OpenAI = require('openai');

async function analyzeImage({ imageBase64, imageType, grade }) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  const prompt = require('../utils/prompts').getAnalysisPrompt(grade);
  
  const response = await openai.messages.create({
    model: 'gpt-4-vision',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: {
              type: imageType,
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    ]
  });
  
  // Parsear JSON da resposta
  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const analysis = JSON.parse(jsonMatch[0]);
  
  return analysis;
}

module.exports = { analyzeImage };
```

---

## 🔄 Cache Strategy

### Problema
API de IA é cara. Se 2 usuários analisarem a mesma imagem, cobrar 2x?

### Solução: Cache com hash

```javascript
// backend/services/cacheService.js
const crypto = require('crypto');

function hashImage(imageBase64) {
  return crypto
    .createHash('sha256')
    .update(imageBase64)
    .digest('hex');
}

async function getCachedAnalysis(imageBase64, grade) {
  const hash = hashImage(imageBase64);
  const cacheKey = `analysis_${hash}_grade${grade}`;
  
  // Tentar Redis
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Tentar Firestore
  const dbCache = await db.collection('content_cache')
    .where('hash', '==', hash)
    .where('grade', '==', grade)
    .limit(1)
    .get();
  
  if (!dbCache.empty) {
    const data = dbCache.docs[0].data().content;
    // Atualizar Redis
    await redis.setex(cacheKey, 86400, JSON.stringify(data));
    return data;
  }
  
  return null;
}

async function setCachedAnalysis(imageBase64, grade, analysis) {
  const hash = hashImage(imageBase64);
  const cacheKey = `analysis_${hash}_grade${grade}`;
  
  // Cache Redis (24 horas)
  await redis.setex(cacheKey, 86400, JSON.stringify(analysis));
  
  // Cache Firestore (persistente)
  await db.collection('content_cache').add({
    hash: hash,
    grade: grade,
    content: analysis,
    createdAt: new Date(),
    accessCount: 1
  });
}

module.exports = { getCachedAnalysis, setCachedAnalysis };
```

---

## 📈 Performance: Otimizações

| Otimização | Fase | Como |
|------------|------|------|
| Compress images | 1 | `imagemin` npm |
| Cache API responses | 1 | Redis + TTL |
| Rate limiting | 1 | `express-rate-limit` |
| Lazy loading do PDF | 2 | Gerar on-demand, não on-analysis |
| Prefetch histórico | 2 | HTTP/2 push ou preload hints |
| Service worker offline | 3 | PWA, cache local |
| CDN para imagens | 4 | Firebase CDN ou Cloudflare |
| Elasticsearch indexing | 5 | Busca full-text rápida |

---

## 🧪 Testes (Por fase)

### Fase 1: Testes manuais
```bash
# Testar com 20 imagens reais
# Documentar: tempo, precisão, erros
```

### Fase 2: Testes de integração
```javascript
// tests/integration/analyze.test.js
describe('POST /api/analyze', () => {
  it('deve analisar imagem e retornar JSON válido', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({
        imageBase64: testImageBase64,
        imageType: 'image/jpeg',
        grade: 3
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('topico');
    expect(response.body).toHaveProperty('explicacao');
  });
});
```

### Fase 3+: Testes ponta a ponta
```javascript
// E2E: User faz upload → App analisa → User pratica → Feedback
```

---

## 📋 Checklist de Arquitetura

Para cada fase, verificar:

- [ ] Autenticação implementada
- [ ] Banco de dados normalizado
- [ ] Cache em place
- [ ] Rate limiting
- [ ] Logs centralizados
- [ ] Tratamento de erros homogêneo
- [ ] Documentação de APIs
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitoramento/alertas

---

Pronto para codificar! 🎯
