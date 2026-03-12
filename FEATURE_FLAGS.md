## 🔐 Feature Flags — Sistema de Controle de Funcionalidades

**Data**: Março 12, 2026  
**Objetivo**: Permitir deploy em staging/develop sem expor as novas funcionalidades ao público

---

## 📋 Feature Flags Disponíveis

| Flag | Variável de Ambiente | Descrição | Padrão |
|------|---------------------|-----------|--------|
| **Practice Mode** | `ENABLE_PRACTICE_MODE` | Ativa o tab "🎯 Praticar" com exercícios e quiz | `false` |
| **Grading** | `ENABLE_GRADING` | Ativa a rota POST `/api/grade` para correção de respostas | `false` |
| **Cache** | `ENABLE_CACHE` | Ativa caching inteligente de análises (recomendado: true) | `true` |
| **Rate Limit** | `ENABLE_RATE_LIMIT` | Ativa rate limiting (50 req / 15 min por IP) | `true` |

---

## ⚙️ Como Configurar

### 1️⃣ Criar arquivo `.env.local` ou `.env.production`

```bash
# Para DESENVOLVIMENTO LOCAL (todas features ativadas)
ENABLE_PRACTICE_MODE=true
ENABLE_GRADING=true
ENABLE_CACHE=true
ENABLE_RATE_LIMIT=true

# Para STAGING/DEVELOP (features ocultas até testes)
ENABLE_PRACTICE_MODE=false
ENABLE_GRADING=false
ENABLE_CACHE=true
ENABLE_RATE_LIMIT=true

# Para PRODUCTION (após validação)
ENABLE_PRACTICE_MODE=true
ENABLE_GRADING=true
ENABLE_CACHE=true
ENABLE_RATE_LIMIT=true
```

### 2️⃣ No Backend (Node.js + Express)

```javascript
// Variáveis são lidas automaticamente em backend/server.js

// Verificar features:
if (!FEATURES.GRADING) {
  return res.status(404).json({ error: 'Endpoint não disponível' });
}

// Novo endpoint para depuração:
GET /api/features
// Retorna:
{
  "environment": "staging",
  "features": {
    "PRACTICE_MODE": false,
    "GRADING": false,
    "CACHE": true,
    "RATE_LIMIT": true
  }
}
```

### 3️⃣ No Frontend (JavaScript)

```javascript
// Carregado automaticamente em frontend/app.js

// Acessar feature:
if (FEATURES.PRACTICE_MODE) {
  // Mostrar tab de prática
} else {
  // Ocultar tab de prática
}

// Tabs afetadas:
// - "🎯 Praticar" ← oculta se PRACTICE_MODE = false
```

---

## 🚀 Deploy no Vercel com Feature Flags

### Setup Automático

1. **Conectar repositório GitHub**
```
Vercel → Settings → Git → Connect Git Repository
```

2. **Configurar Environment Variables**
```
Vercel → Settings → Environment Variables

Nome: ENABLE_PRACTICE_MODE
Valor: false
Ambiente: Preview, Development, Production (selecione conforme necessário)

Nome: ENABLE_GRADING
Valor: false
```

3. **Deploy automático por branch**

```
develop → Preview (features desativadas) ✅
main → Production (features ativadas após testes)
```

---

## 🧪 Fluxo de Testes

### Fase 1: Desenvolvimento Local

```bash
cd backend
# .env.local tem ENABLE_PRACTICE_MODE=true
npm start

# http://localhost:3456
# ✅ Features visíveis
# ✅ Teste o modo prática localmente
```

### Fase 2: Staging no Vercel (branch: develop)

```
Vercel Preview (automaticamente):
- ENABLE_PRACTICE_MODE=false
- ENABLE_GRADING=false

✅ Deploy automático
✅ URL: https://lmedukids-pr-123.vercel.app
✅ Features ocultas
✅ Usuários finais NÃO veem novas funcionalidades
```

### Fase 3: Beta Testing Privado

```
1. Configurar novo ambiente "Beta"
   ENABLE_PRACTICE_MODE=true
   ENABLE_GRADING=true
   
2. URL separada: https://lmedukids-beta.vercel.app

3. Compartilhar apenas com equipe de testes
```

### Fase 4: Production (branch: main)

```bash
# Após validação completa
git merge develop main
git push origin main

# Vercel deploy automático:
# ENABLE_PRACTICE_MODE=true
# ENABLE_GRADING=true

# ✅ Público: https://lmedukids.vercel.app
```

---

## 📊 Tabela de Ambientes

| Ambiente | Branch | Practice | Grading | URL | Acesso |
|----------|--------|----------|---------|-----|--------|
| **Dev Local** | develop | ✅ | ✅ | localhost:3456 | Developer |
| **Staging** | develop | ❌ | ❌ | preview-*.vercel.app | Private |
| **Beta** | beta | ✅ | ✅ | lmedukids-beta.vercel.app | 10 testers |
| **Prod** | main | ✅ | ✅ | lmedukids.vercel.app | Público |

---

## 🔍 Depuração: Verificar Features Ativas

### Browser DevTools
```javascript
// Console
fetch('/api/features').then(r => r.json()).then(console.log)

// Output:
{
  "environment": "staging",
  "features": {
    "PRACTICE_MODE": false,
    "GRADING": false,
    "CACHE": true,
    "RATE_LIMIT": true
  }
}
```

### Backend Logs
```bash
npm start

# Output esperado:
🎯 Feature Flags: {
  PRACTICE_MODE: false,
  GRADING: false,
  CACHE: true,
  RATE_LIMIT: true
}
```

---

## ⚡ API Responses com Features Desativadas

### Quando `ENABLE_GRADING=false`

```bash
curl -X POST http://localhost:3456/api/grade \
  -H "Content-Type: application/json" \
  -d '{"exercisePergunta":"2+2=?","studentAnswer":"4","correctAnswer":"4"}'

# Response:
{
  "error": "Endpoint não disponível neste ambiente"
}

# Status: 404
```

### Quando `ENABLE_PRACTICE_MODE=false`

```javascript
// Frontend console:
FEATURES.PRACTICE_MODE // false

// Tab "🎯 Praticar":
// - Oculta (display: none)
// - Botões "Exercícios" e "Quiz" não aparecem
```

---

## 📝 Checklist para Deploy

- [ ] `.env.local` configurado para desenvolvimento
- [ ] `.env.example` no Git com valores de exemplo
- [ ] Backend/server.js lê FEATURES da env
- [ ] Frontend/app.js aplica feature flags (loadFeatures() + applyFeatureFlags())
- [ ] `/api/features` endpoint testado
- [ ] Vercel environment variables configuradas
- [ ] Preview URL testada sem new features
- [ ] Main branch testado com features ativadas

---

## 🎯 Próximas Features (Futuro)

- [ ] Dashboard de analytics pro feature flags
- [ ] A/B testing automático (50% users veem feature)
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Feature flags dinâmicas (mudar sem redeploy)

---

## ❓ FAQ

**P: As features ficam ocultas ou desabilitadas?**  
R: Ocultas (CSS `display: none`) + Endpoints com erro 404. Código ainda existe, mas não é acessível.

**P: Posso testar as features em staging?**  
R: Sim! Crie um ambiente separado (ex: `lmedukids-beta.vercel.app`) com features ativadas.

**P: Como ativar features sem fazer push?**  
R: Mude a variável de ambiente no Vercel Dashboard → Settings → Environment Variables

**P: O que acontece se um usuário descobre a URL da rota /api/grade?**  
R: Retorna erro 404 (endpoint não disponível). A API não funciona.

---

**Status**: ✅ Feature Flags Implementadas  
**Última atualização**: Março 12, 2026
