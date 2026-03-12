require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3456;
const API_KEY = process.env.OPENAI_API_KEY || '';

// ─── Middlewares ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' })); // imagens base64 são grandes

// ─── Servir o frontend em produção ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

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

    const openai = new OpenAI({ apiKey: API_KEY });

    const prompt = `Você é um professor amigável e criativo para crianças do ensino fundamental I (${grade}º ano do Brasil).

Analise a imagem enviada (foto de uma tarefa escolar, página de livro ou exercício) e retorne APENAS um JSON válido, sem markdown nem texto extra, com esta estrutura exata:

{
  "topico": "Nome curto do assunto",
  "explicacao": {
    "titulo": "Título animador para a criança",
    "intro": "Parágrafo curto e animado explicando o assunto de forma simples (máx 3 frases, use linguagem para ${grade}º ano)",
    "conceitos": [
      {"emoji": "🔢", "titulo": "Conceito 1", "descricao": "Explicação simples de 2 frases"},
      {"emoji": "✨", "titulo": "Conceito 2", "descricao": "Explicação simples de 2 frases"},
      {"emoji": "🌟", "titulo": "Conceito 3", "descricao": "Explicação simples de 2 frases"}
    ],
    "exemplo": "Um exemplo prático e concreto, relacionado ao cotidiano da criança",
    "curiosidade": "Uma curiosidade divertida sobre o assunto"
  },
  "exercicios": [
    {"pergunta": "Exercício 1 com valores/situação diferente da tarefa original", "resposta": "resposta correta", "dica": "Uma dica para resolver"},
    {"pergunta": "Exercício 2 com valores/situação diferente", "resposta": "resposta correta", "dica": "Uma dica para resolver"},
    {"pergunta": "Exercício 3 com valores/situação diferente", "resposta": "resposta correta", "dica": "Uma dica para resolver"},
    {"pergunta": "Exercício 4 com valores/situação diferente", "resposta": "resposta correta", "dica": "Uma dica para resolver"}
  ],
  "quiz": [
    {
      "pergunta": "Pergunta de múltipla escolha 1",
      "opcoes": ["A) opção errada", "B) opção correta", "C) opção errada", "D) opção errada"],
      "correta": 1,
      "explicacao": "Por que essa é a resposta certa"
    },
    {
      "pergunta": "Pergunta de múltipla escolha 2",
      "opcoes": ["A) opção", "B) opção", "C) opção correta", "D) opção"],
      "correta": 2,
      "explicacao": "Por que essa é a resposta certa"
    },
    {
      "pergunta": "Pergunta de múltipla escolha 3",
      "opcoes": ["A) opção", "B) opção", "C) opção", "D) opção correta"],
      "correta": 3,
      "explicacao": "Por que essa é a resposta certa"
    },
    {
      "pergunta": "Pergunta de múltipla escolha 4",
      "opcoes": ["A) opção correta", "B) opção", "C) opção", "D) opção"],
      "correta": 0,
      "explicacao": "Por que essa é a resposta certa"
    }
  ],
  "dicas_pais": [
    {"emoji": "🏠", "titulo": "Dica para casa", "texto": "Como ajudar a praticar esse conteúdo em casa"},
    {"emoji": "🎯", "titulo": "Pontos principais", "texto": "O que a criança precisa dominar sobre esse assunto"},
    {"emoji": "📅", "titulo": "Rotina de estudos", "texto": "Sugestão de como organizar o estudo desse tema"},
    {"emoji": "🎮", "titulo": "Tornar divertido", "texto": "Uma atividade lúdica para reforçar o aprendizado"},
    {"emoji": "💬", "titulo": "Como explicar", "texto": "Dica de linguagem para explicar para a criança"}
  ]
}

IMPORTANTE: Adapte tudo para o ${grade}º ano. Use linguagem simples, animada e encorajadora. Crie exercícios COMPLETAMENTE DIFERENTES da tarefa original (novos valores, novos contextos, mas mesmo assunto). Retorne apenas JSON válido.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4000,
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

    // Valida se é JSON antes de enviar
    JSON.parse(clean);

    res.json({ content: clean });

  } catch (err) {
    console.error('Erro ao conectar com a OpenAI:', err.message);
    res.status(502).json({ error: 'Erro ao conectar com a API OpenAI: ' + err.message });
  }
});

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
