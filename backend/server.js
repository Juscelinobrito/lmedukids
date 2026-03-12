require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3456;
const API_KEY = process.env.OPENAI_API_KEY || '';

// ─── Cache Configuration ────────────────────────────────────────────────────
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos TTL

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 requisições por IP
  message: 'Muitas requisições. Tente novamente em alguns minutos.',
  standardHeaders: true,
  legacyHeaders: false
});

// ─── Middlewares ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' })); // imagens base64 são grandes
app.use('/api/', limiter); // Aplicar rate limit apenas nas APIs

// ─── Servir o frontend em produção ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── Funções Auxiliares ──────────────────────────────────────────────────────

/**
 * Hash de imagem base64 para cache
 */
function hashImage(imageBase64) {
  return crypto
    .createHash('sha256')
    .update(imageBase64.substring(0, 1000)) // Hash dos primeiros 1000 chars
    .digest('hex');
}

/**
 * Prompt para análise de tarefa com otimizações
 */
function getAnalysisPrompt(grade) {
  return `Você é um professor amigável e criativo para crianças do ensino fundamental I (${grade}º ano do Brasil).

Analise a imagem enviada (foto de uma tarefa escolar, página de livro ou exercício) e retorne APENAS um JSON válido, sem markdown nem texto extra.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "topico": "Nome curto do assunto (máx 3 palavras)",
  "explicacao": {
    "titulo": "Título animador para a criança",
    "intro": "Parágrafo curto e animado (máx 3 frases, linguagem para ${grade}º ano)",
    "conceitos": [
      {"emoji": "🔢", "titulo": "Conceito 1", "descricao": "Explicação simples de 2 frases"},
      {"emoji": "✨", "titulo": "Conceito 2", "descricao": "Explicação simples de 2 frases"}
    ],
    "exemplo": "Um exemplo prático e concreto",
    "curiosidade": "Uma curiosidade divertida"
  },
  "exercicios": [
    {"pergunta": "Exercício DIFERENTE 1", "resposta": "resposta correta", "dica": "Uma dica"},
    {"pergunta": "Exercício DIFERENTE 2", "resposta": "resposta correta", "dica": "Uma dica"},
    {"pergunta": "Exercício DIFERENTE 3", "resposta": "resposta correta", "dica": "Uma dica"}
  ],
  "quiz": [
    {"pergunta": "Q1?", "opcoes": ["A) ...", "B) ...", "C) ...", "D) ..."], "correta": 1, "explicacao": "..."},
    {"pergunta": "Q2?", "opcoes": ["A) ...", "B) ...", "C) ...", "D) ..."], "correta": 2, "explicacao": "..."},
    {"pergunta": "Q3?", "opcoes": ["A) ...", "B) ...", "C) ...", "D) ..."], "correta": 0, "explicacao": "..."}
  ]
}

REGRAS:
- Use APENAS emojis seguros para crianças
- Linguagem clara, animada, encorajadora
- Exercícios COMPLETAMENTE DIFERENTES da tarefa original
- JSON VÁLIDO (sem comentários, sem markdown)
- Máximo 3000 tokens`;
}

// ─── Rota de saúde ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!API_KEY,
    timestamp: new Date().toISOString()
  });
});

// ─── Proxy para a API OpenAI ─────────────────────────────────────────────────
app.post('/api/messages', async (req, res) => {
  if (!API_KEY) {
    return res.status(401).json({
      error: 'OPENAI_API_KEY não configurada. Verifique o arquivo .env'
    });
  }

  try {
    const { imageBase64, imageType, grade } = req.body;

    if (!imageBase64 || !grade) {
      return res.status(400).json({ error: 'Parâmetros imageBase64 e grade são obrigatórios' });
    }

    // Gerar chave de cache
    const imageHash = hashImage(imageBase64);
    const cacheKey = `analysis_${imageHash}_grade${grade}`;

    // Verificar cache
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return res.json({ content: cached, fromCache: true });
    }

    const openai = new OpenAI({ apiKey: API_KEY });
    const prompt = getAnalysisPrompt(grade);

    console.log(`🔄 Analisando imagem (grade ${grade})...`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageType};base64,${imageBase64}`
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

    const text = response.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();

    // Validar JSON
    JSON.parse(clean);

    // Salvar em cache
    cache.set(cacheKey, clean);
    console.log(`💾 Salvo em cache: ${cacheKey}`);

    res.json({ content: clean, fromCache: false });

  } catch (err) {
    console.error('❌ Erro ao analisar:', err.message);
    
    if (err.message.includes('invalid_request_error')) {
      return res.status(400).json({ error: 'Imagem inválida ou muito pequena. Tente outra.' });
    }
    
    res.status(502).json({ error: 'Erro ao processar. Tente novamente.' });
  }
});

// ─── NOVO: Corrigir resposta do aluno ────────────────────────────────────────
app.post('/api/grade', async (req, res) => {
  if (!API_KEY) {
    return res.status(401).json({ error: 'API key não configurada' });
  }

  try {
    const { exercisePergunta, studentAnswer, correctAnswer } = req.body;

    if (!exercisePergunta || !studentAnswer || !correctAnswer) {
      return res.status(400).json({ error: 'Parâmetros faltando' });
    }

    // Cache para respostas
    const answerHash = crypto.createHash('sha256')
      .update(`${exercisePergunta}${studentAnswer}`)
      .digest('hex');
    const cacheKey = `grade_${answerHash}`;

    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const openai = new OpenAI({ apiKey: API_KEY });

    const gradePrompt = `Você é um professor corrigindo uma resposta de criança.

Exercício: "${exercisePergunta}"
Resposta do aluno: "${studentAnswer}"
Resposta correta: "${correctAnswer}"

Retorne APENAS um JSON:
{
  "isCorrect": true/false,
  "feedback": "Feedback curto e encorajador (1-2 frases)",
  "explanation": "Explicação clara de 2-3 frases",
  "hint": "Uma dica se errou (ou null se acertou)"
}

Seja encorajador! Aprove o esforço do aluno.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: gradePrompt
        }
      ]
    });

    const text = response.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    cache.set(cacheKey, result);
    res.json(result);

  } catch (err) {
    console.error('Erro ao corrigir:', err.message);
    res.status(502).json({ error: 'Erro ao corrigir resposta' });
  }
});

// ─── Proxy para a API OpenAI ─────────────────────────────────────────────────
// [REMOVIDO - substituído pelo /api/messages acima]

// ─── Fallback: qualquer rota desconhecida serve o index.html (SPA) ──────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();

  console.log('\n🚀 EduKids backend rodando com OpenAI!\n');
  console.log('  💻 Computador → http://localhost:' + PORT);

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  📱 Celular (Wi-Fi) → http://${net.address}:${PORT}`);
      }
    }
  }

  if (!API_KEY) {
    console.log('\n  ⚠️  ATENÇÃO: OPENAI_API_KEY não configurada!');
    console.log('  Crie o arquivo backend/.env com sua chave.\n');
  } else {
    console.log('\n  ✅ OpenAI API Key configurada\n');
  }
});
