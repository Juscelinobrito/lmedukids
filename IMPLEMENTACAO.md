# ✅ Implementação Priorizada — LM EduKids

**Documento de trabalho:** Quais features codificar primeiro, em qual ordem, e por quê.

---

## 📌 ESTA SEMANA — Validação + Fixes Críticos

**Objetivo:** Garantir que o MVP atual funciona bem.

### 1. [ ] Testes com Imagens Reais
```bash
# Criar pasta de testes
/tests/real-images/
  ├── math-exercise-1ano.jpg
  ├── portuguese-reading-2ano.jpg
  ├── science-handwritten-3ano.jpg
  └── (mais ~47 imagens de verdade)

# Executar análise em cada uma
# Documentar: IA acertou? Conteúdo útil? Tempo de resposta?
```

**Saída esperada:** Relatório com taxa de sucesso (target: ≥80%)

### 2. [ ] Melhorar Prompt da IA
**Arquivo:** `backend/server.js` (linha ~50)

**Problema atual:** Prompt genérico, sem instruções claras sobre adaptação por série.

**O que fazer:**
- Adicionar exemplos no prompt (few-shot)
- Especificar estrutura JSON com campos obrigatórios
- Adicionar guardrails (proibir conteúdo adulto, etc.)

### 3. [ ] Melhorar tratamento de erros
```javascript
// Backend: adicionar logs estruturados
app.post('/api/messages', async (req, res) => {
  try {
    // ...
  } catch (error) {
    console.error('[API ERROR]', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      grade: req.body.grade
    });
    // Enviar para serviço de logs (Sentry, LogRocket)
  }
});
```

### 4. [ ] Rate limiting básico
```javascript
// Prevenir spam
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 50 // 50 requisições por IP
});
app.use('/api/', limiter);
```

### 5. [ ] Cache de respostas
```javascript
// Se o mesmo exercício é analisado 2x,
// retornar resultado anterior (5 min cache)
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });
```

---

## 🎯 PRÓXIMAS 2 SEMANAS — Completar Fase 1: MVP

### 6. [ ] Modo "Prática" com Feedback

**Frontend:** `frontend/app.js`

**Adicionar:**
```html
<!-- Nova aba: "Praticar" -->
<div id="tab-practice" class="tab-content">
  <div id="practiceContainer">
    <!-- Exercício será renderizado aqui -->
    <div id="exerciseContainer"></div>
    
    <!-- Input para resposta -->
    <input id="answerInput" type="text" placeholder="Sua resposta...">
    
    <!-- Botões -->
    <button id="submitAnswerBtn">Enviar ✨</button>
    <button id="hintBtn">Dica 💡</button>
  </div>
  
  <!-- Feedback -->
  <div id="feedbackContainer" style="display:none;">
    <div id="feedbackMessage"></div>
    <div id="feedbackExplanation"></div>
    <button id="nextExerciseBtn">Próximo →</button>
  </div>
</div>
```

**Backend:** `backend/server.js`

```javascript
// Nova rota para corrigir respostas
app.post('/api/grade', async (req, res) => {
  const { exercise_id, student_answer, correct_answer } = req.body;
  
  const prompt = `
    Exercício: "${exercise_id}"
    Resposta do aluno: "${student_answer}"
    Resposta correta: "${correct_answer}"
    
    Responda em JSON:
    {
      "is_correct": boolean,
      "feedback": "Muito bem!" ou "Não é bem assim...",
      "explanation": "Explicação clara de 2-3 frases",
      "hint": "Dica para o aluno (se errou)"
    }
  `;
  
  // Chamar IA
  const response = await openai.messages.create({...});
  res.json(JSON.parse(response.content));
});
```

### 7. [ ] Gerar PDF

**Instalar:** `npm install jspdf html2canvas`

**Criar função:** `frontend/app.js`

```javascript
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(16);
  doc.text('Tarefa de Estudo', 10, 10);
  
  // Conteúdo gerado
  doc.setFontSize(12);
  doc.text(currentContent.explicacao.titulo, 10, 25);
  
  // Exercícios
  currentContent.exercicios.forEach((ex, i) => {
    doc.text(`Exercício ${i+1}: ${ex.pergunta}`, 10, 40 + i*20);
  });
  
  // Quiz
  doc.addPage();
  doc.text('Quiz', 10, 10);
  currentContent.quiz.forEach((q, i) => {
    doc.text(`${i+1}. ${q.pergunta}`, 10, 25 + i*15);
  });
  
  // Download
  doc.save('tarefa-estudo.pdf');
}

// Botão para chamar
document.getElementById('downloadPdfBtn').addEventListener('click', generatePDF);
```

### 8. [ ] Quiz interativo básico

```html
<div id="quizContainer" style="display:none;">
  <h3 id="quizTitle"></h3>
  
  <div id="questionsContainer">
    <!-- Perguntas renderizadas aqui -->
  </div>
  
  <button id="submitQuizBtn">Enviar Respostas 🎯</button>
  <div id="quizResultsContainer"></div>
</div>
```

```javascript
function renderQuiz(quizData) {
  const container = document.getElementById('questionsContainer');
  quizData.forEach((q, idx) => {
    const html = `
      <div class="quiz-question">
        <p><strong>${idx + 1}. ${q.pergunta}</strong></p>
        ${q.opcoes.map((opt, i) => `
          <label>
            <input type="radio" name="q${idx}" value="${i}">
            ${opt}
          </label>
        `).join('')}
      </div>
    `;
    container.innerHTML += html;
  });
}

// Enviar e corrigir
document.getElementById('submitQuizBtn').addEventListener('click', async () => {
  const answers = Array.from(document.querySelectorAll('[name^="q"]'))
    .map(el => ({ question: el.name, answer: el.value }));
  
  const result = await fetch('/api/grade-quiz', {
    method: 'POST',
    body: JSON.stringify({ quiz: quizData, answers })
  });
  
  showResults(await result.json());
});
```

### 9. [ ] Histórico básico (localStorage)

```javascript
// Salvar requisição após análise
function saveToHistory(analysis) {
  let history = JSON.parse(localStorage.getItem('history') || '[]');
  history.push({
    id: Date.now(),
    grade: currentGrade,
    topic: analysis.topico,
    timestamp: new Date().toISOString(),
    image: uploadedImageBase64.substring(0, 100) // thumb
  });
  localStorage.setItem('history', JSON.stringify(history.slice(-50))); // Manter últimas 50
}

// Mostrar histórico
function showHistory() {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  const html = history.map(h => `
    <div class="history-item">
      <span>${h.topic}</span>
      <small>${h.timestamp}</small>
      <button onclick="loadFromHistory(${h.id})">Carregar</button>
    </div>
  `).join('');
  
  document.getElementById('historyContainer').innerHTML = html;
}
```

### 10. [ ] Deploy no Vercel (public)

```bash
# 1. Fazer commit
git add -A
git commit -m "Phase 1: MVP completo"

# 2. Push para GitHub
git push origin main

# 3. Vercel faz deploy automático
# Link compartilhável: https://lmedukids.vercel.app
```

---

## 📊 SEMANAS 3-4 — Preparar Fase 2

### 11. [ ] Estrutura de auth mínima

**Instalar:** `npm install firebase`

```javascript
// backend-auth.js (novo arquivo)
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(process.env.FIREBASE_CONFIG)
});

// Middleware
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { verifyToken };
```

### 12. [ ] Banco de dados mínimo (Firestore)

```javascript
// Estrutura coleções Firestore:
const db = admin.firestore();

db.collection('users').add({
  email: 'user@example.com',
  role: 'aluno', // ou 'professor'
  serie: 1,
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});

db.collection('exercises').add({
  userId: 'user-id',
  grade: 1,
  topic: 'Matemática',
  content: {...}, // JSON da análise
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});
```

### 13. [ ] UI para seleção aluno/professor

```html
<div id="roleSelector">
  <button class="role-btn" data-role="student">
    👨‍🎓 Sou Aluno/Pai
  </button>
  <button class="role-btn" data-role="teacher">
    👨‍🏫 Sou Professor
  </button>
</div>

<!-- Após escolher, mostrar upload... -->
```

---

## 🎮 CHECKPOINTS SEMANAIS

### Semana 1: Validação ✅
- [ ] Testar com 50 imagens
- [ ] Taxa de sucesso ≥80%
- [ ] Logs funcionando
- [ ] Rate limit+cache funcionando

### Semana 2: Prática + PDF ✅
- [ ] Mode "Praticar" completo
- [ ] Feedback correto/incorreto
- [ ] PDF gerando sem erros
- [ ] Quiz funcionando
- [ ] Deploy no Vercel público

### Semana 3: Auth + DB ⚪
- [ ] Firebase conectado
- [ ] Login/signup funcional
- [ ] Histórico salvando em DB
- [ ] Seleção de role (aluno/professor)

### Semana 4: Painel mínimo professor ⚪
- [ ] Dashboard básico
- [ ] Listar exercícios
- [ ] Criar lista de exercícios

---

## 💻 Stack de Tecnologia (Recomendado)

| Camada | Tecnologia | Por quê |
|--------|-----------|--------|
| Frontend | Next.js 14+ | SSR, API routes built-in, melhor para SEO |
| Backend | Node.js + Express | JavaScript full-stack, fácil manutenção |
| Auth | Firebase Auth | Gratuito, LGPD compliant, suporte SMS |
| Banco | Firestore | NoSQL, real-time, escalável, free tier gerado |
| Storage | Firebase Storage | Fotos, PDFs, áudio (Fase 5) |
| Fila | Bull Queue | Processamento async de PDFs/áudio |
| Deploy | Vercel | Melhor para Next.js, sem servidor |
| IA | Claude (Anthropic) | Melhor para educação, mais seguro para crianças |
| Logs | Sentry | Capturar erros em produção |
| Analytics | Mixpanel | Entender como usuários usam (opcional) |

---

## 🚀 Comandos para começar agora

```bash
# 1. Clonar repo e instalar
cd c:/lmedukids
npm install
cd backend && npm install

# 2. Configurar .env
cp backend/.env.example backend/.env
# Preencher ANTHROPIC_API_KEY

# 3. Rodar localizado
cd backend
npm run dev

# 4. Abrir
http://localhost:3456

# 5. Testar com imagem real
# Tirar foto de um exercício escolar e enviar
```

---

## 📝 Prioridade de Estudo

Se você quer começar a codificar **agora mesmo**, nesta ordem:

1. **Entender o flow atual** (5min)
   - Abrir frontend/app.js
   - Abrir backend/server.js
   - Rodar localmente

2. **Melhorar prompt da IA** (30min)
   - Editar prompt no backend
   - Adicionar estrutura clara
   - Testar com 3-5 imagens

3. **Adicionar modo Prática** (2h)
   - Criar HTML novo
   - Criar rota /api/grade
   - Testar com quiz

4. **Adicionar PDF** (1h30)
   - Instalar jsPDF
   - Criar função de download
   - Testar PDF gerado

5. **Fazer deploy** (30min)
   - Push para GitHub
   - Deploy on Vercel
   - Testar link público

**Total: ~5h para MVP completo funcional!**

---

## ⚠️ Armadilhas Comuns

| Armadilha | Solução |
|-----------|---------|
| Prompt muito genérico | Use exemplos (few-shot). Sempre especifique série. |
| Resposta da IA em markdown | Pedir JSON puro na primeira linha do prompt. |
| Imagens muito grandes | Comprimir base64 a 512KB máx. |
| Esquecer CORS | Adicionar `app.use(cors())` no backend. |
| Gravar API key em código | Usar `.env` e não commitar. |
| Usuário espera > 5 segundos | Cache agressivo. Considerar SSR. |
| Esquecido historico entre abas | localStorage é ephemeral; usar DB. |

---

Bora codificar! 🚀
