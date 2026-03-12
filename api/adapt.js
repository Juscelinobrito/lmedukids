const OpenAI = require('openai');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const API_KEY = process.env.OPENAI_API_KEY || '';
  if (!API_KEY) {
    return res.status(401).json({ error: 'OPENAI_API_KEY não configurada.' });
  }

  const { step, imageBase64, imageType, grade, analyzedText, subject, activityType, adaptationType } = req.body;

  if (!step) return res.status(400).json({ error: 'Campo "step" obrigatório: "analyze" ou "adapt"' });

  const openai = new OpenAI({ apiKey: API_KEY });

  // ─── ETAPA A: Analisar a imagem ───────────────────────────────────────────
  if (step === 'analyze') {
    if (!imageBase64 || !imageType) {
      return res.status(400).json({ error: 'imageBase64 e imageType são obrigatórios para step=analyze' });
    }

    const prompt = `Você é um assistente pedagógico especializado em educação infantil e fundamental.
Analise a imagem enviada (foto de uma atividade escolar, texto do livro, folha de exercícios ou caderno).

Retorne APENAS um JSON válido, sem markdown, com esta estrutura:
{
  "textoReconhecido": "texto completo extraído da imagem (OCR fiel)",
  "disciplina": "Português | Matemática | Ciências | História | Geografia | Inglês | Educação Física | Artes | Outro",
  "tipoAtividade": "texto para leitura | questões discursivas | questões de múltipla escolha | completar lacunas | interpretação de texto | produção escrita | cálculos | outro",
  "serieEstimada": "1º ano | 2º ano | 3º ano | 4º ano | 5º ano | 6º ao 9º ano | outro",
  "nivelDificuldade": "básico | intermediário | avançado",
  "resumoBreve": "Uma frase descrevendo o que essa atividade pede"
}

Se a imagem não contiver atividade escolar legível, retorne:
{"erro": "Não foi possível identificar uma atividade escolar na imagem."}

IMPORTANTE: retorne apenas JSON válido.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${imageType};base64,${imageBase64}` } },
            { type: 'text', text: prompt }
          ]
        }]
      });

      const text = response.choices[0].message.content;
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return res.json(parsed);

    } catch (err) {
      console.error('Erro no analyze:', err.message);
      return res.status(502).json({ error: 'Erro ao analisar imagem: ' + err.message });
    }
  }

  // ─── ETAPA B: Gerar adaptação ─────────────────────────────────────────────
  if (step === 'adapt') {
    if (!analyzedText || !adaptationType) {
      return res.status(400).json({ error: 'analyzedText e adaptationType são obrigatórios para step=adapt' });
    }

    const adaptacoes = {
      resumo: `Crie um RESUMO do conteúdo abaixo em linguagem simples e acessível para ${grade || 'ensino fundamental'}. 
Estruture em:
- "resumoSimples": parágrafo curto com as ideias principais
- "palavrasChave": array com 3 a 5 palavras-chave
- "ideaPrincipal": uma frase com a ideia central
- "versaoCurta": versão em até 3 linhas`,

      simplificar: `SIMPLIFIQUE a linguagem do conteúdo abaixo para ${grade || 'ensino fundamental'}.
Retorne:
- "textoSimplificado": versão com frases curtas e vocabulário simples
- "palavrasDificeis": array de objetos {"original": "palavra", "simples": "substituta"}
- "dicas": array com 2 a 3 dicas de como explorar o texto com a criança`,

      quiz: `Crie um QUIZ de múltipla escolha baseado no conteúdo abaixo, adequado para ${grade || 'ensino fundamental'}.
Retorne:
- "quiz": array com 4 perguntas, cada uma: {"pergunta": "...", "opcoes": ["A) ...", "B) ...", "C) ...", "D) ..."], "correta": índice (0-3), "explicacao": "por que é a certa"}`,

      pistas_visuais: `Transforme as questões/conteúdo abaixo em versão com PISTAS VISUAIS usando emojis e palavras destacadas, para ${grade || 'ensino fundamental'}.
Retorne:
- "questoesAdaptadas": array com objetos {"original": "texto original", "adaptada": "versão com emojis e pistas", "apoioVisual": ["lista de emojis/palavras de apoio"]}
- "instrucaoParaProfessor": dica de como usar esse material`,

      passo_a_passo: `Divida a atividade abaixo em PASSOS simples e sequenciais para ${grade || 'ensino fundamental'}.
Retorne:
- "passos": array com objetos {"numero": 1, "instrucao": "...", "dica": "..."}
- "tempoEstimado": tempo estimado por passo
- "materialNecessario": array com materiais que podem ajudar`,

      multipla_escolha: `Transforme as questões abertas/discursivas abaixo em MÚLTIPLA ESCOLHA para ${grade || 'ensino fundamental'}.
Retorne:
- "questoes": array com {"perguntaOriginal": "...", "perguntaAdaptada": "...", "opcoes": ["A) ...", "B) ...", "C) ...", "D) ..."], "correta": índice (0-3)}`,

      ludico: `Transforme a atividade abaixo em uma versão LÚDICA e gamificada para ${grade || 'ensino fundamental'}.
Retorne:
- "tituloJogo": nome criativo e divertido para a atividade
- "descricao": como vai funcionar de forma lúdica
- "regras": array com regras simples do "jogo"
- "desafios": array com os desafios/tarefas adaptados de forma divertida
- "recompensa": sugestão de recompensa simbólica ao completar`
    };

    const promptBase = adaptacoes[adaptationType];
    if (!promptBase) {
      return res.status(400).json({ error: `Tipo de adaptação inválido: ${adaptationType}` });
    }

    const prompt = `${promptBase}

CONTEÚDO DA ATIVIDADE:
"""
${analyzedText}
"""

Disciplina identificada: ${subject || 'não informada'}
Tipo de atividade: ${activityType || 'não informado'}

IMPORTANTE: Retorne APENAS JSON válido, sem markdown nem texto extra.
ATENÇÃO: Não invente conteúdo fora do que está no texto acima. A IA sugere, mas o professor revisa.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.choices[0].message.content;
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return res.json({ adaptationType, result: parsed });

    } catch (err) {
      console.error('Erro no adapt:', err.message);
      return res.status(502).json({ error: 'Erro ao gerar adaptação: ' + err.message });
    }
  }

  return res.status(400).json({ error: 'step deve ser "analyze" ou "adapt"' });
};
