# 📚 LM EduKids — Estudo Inteligente com IA

App para ensino infantil e fundamental I. Os pais enviam foto de uma tarefa escolar e a IA gera explicações, exercícios e quiz personalizados.

## 📁 Estrutura do projeto

```
lmedukids/
├── frontend/
│   ├── index.html   # Interface do app
│   ├── style.css    # Estilos
│   └── app.js       # Lógica do frontend
├── backend/
│   ├── server.js    # Servidor Express + proxy Anthropic
│   ├── package.json
│   └── .env.example # Modelo do arquivo de variáveis
├── .gitignore
└── README.md
```

## 🚀 Rodando localmente

### 1. Configure a chave da API

```bash
cd backend
cp .env.example .env
# Edite o .env e coloque sua chave ANTHROPIC_API_KEY
```

### 2. Instale as dependências e inicie

```bash
cd backend
npm install
npm start
```

### 3. Acesse

- **Computador:** http://localhost:3456
- **Celular (mesma rede Wi-Fi):** http://IP_DO_PC:3456

---

## ☁️ Deploy na Vercel

1. Faça push do projeto para o GitHub
2. Importe o repositório na [Vercel](https://vercel.com)
3. Em **Settings → Environment Variables**, adicione:
   - `ANTHROPIC_API_KEY` = sua chave `sk-ant-...`
4. Em **Settings → General → Root Directory**, defina: `backend`
5. Clique em **Deploy**

---

## 🔑 Onde obter a chave da API

Acesse [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

---

## 📚 DOCUMENTAÇÃO — Roadmap 2026 (MVP → EdTech Escalável)

**Roadmap completo com 6 fases, timeline realista e checklist pronto para executar.**

### 📖 Arquivos de Documentação

| Arquivo | Descrição | Tempo de leitura | Para quem |
|---------|-----------|-----------------|-----------|
| [**INDICE.md**](INDICE.md) | 👈 **COMECE AQUI** — Mapa de navegação | 5 min | Todos |
| [**QUICK_START.md**](QUICK_START.md) | Ação imediata: checklist de 2 dias + deploy | 10 min | Desenvolvedores |
| [**VISUAL_ROADMAP.txt**](VISUAL_ROADMAP.txt) | Roadmap em ASCII art + financeiro | 5 min | Stakeholders/Investidores |
| [**ROADMAP.md**](ROADMAP.md) | Roadmap completo 6 fases (200 linhas) | 30 min | Product Managers |
| [**IMPLEMENTACAO.md**](IMPLEMENTACAO.md) | Checklist semanal executável (4 semanas) | 20 min | Programadores |
| [**ARQUITETURA.md**](ARQUITETURA.md) | Estrutura escalável + código real | 45 min | Tech Lead/Arquiteto |

### 🎯 Roteiros Rápidos

**Você é founder/indivídual:**
1. Ler [QUICK_START.md](QUICK_START.md)
2. Executar checklist Dia 1 (2h)
3. Fazer deploy Vercel
4. Guardar [ROADMAP.md](ROADMAP.md) para referência

**Você tem equipe:**
1. Mostrar [VISUAL_ROADMAP.txt](VISUAL_ROADMAP.txt) (alinhamento)
2. Distribuir tarefas de [IMPLEMENTACAO.md](IMPLEMENTACAO.md)
3. Tech Lead estuda [ARQUITETURA.md](ARQUITETURA.md)
4. Usar [INDICE.md](INDICE.md) como compass

**Você quer investimento:**
1. Apresentar [VISUAL_ROADMAP.txt](VISUAL_ROADMAP.txt) + financeiro
2. Executar [IMPLEMENTACAO.md](IMPLEMENTACAO.md) semanas 1-2 (POC)
3. Voltar com resultados reais

### 📊 Visão Geral do Roadmap

```
Fase 1 (MVP)          → Foto de tarefa → conteúdo gerado        (semana 1-2)
Fase 2 (Adaptação)    → Painel professor + adaptações pedagógicas (semana 3-4)
Fase 3 (Plataforma)   → Gamificação + tutor IA + plano estudos  (semana 5-8)
Fase 4 (Professor)    → Prova automática + relatórios          (semana 9-12)
Fase 5 (NeuroEd)      → TDAH/TEA/Dislexia + foto→aula          (semana 13-16)
Fase 6 (Monetização)  → 4 planos: Free, Aluno, Professor, Escola (paralelo)

TOTAL: 14 semanas para ir de MVP 0.1 → Produto forte 1.0
```

**Próximas ações:**
- [ ] Ler [INDICE.md](INDICE.md) (5 min)
- [ ] Executar [QUICK_START.md](QUICK_START.md) Dia 1 (2h)
- [ ] Deploy no Vercel
- [ ] Feedback da comunidade educadora

---
