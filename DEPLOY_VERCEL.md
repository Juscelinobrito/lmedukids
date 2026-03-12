# 📚 GUIA: Deploy do LM EduKids no Vercel com Feature Flags

**Objetivo**: Fazer deploy em modo de teste (develop) sem expor funcionalidades novas  
**Tempo estimado**: 5-10 minutos

---

## 🎯 Resultado Final

✅ URL de Staging: `https://lmedukids-pr-*.vercel.app` (Preview - features ocultas)  
✅ URL de Produção: `https://lmedukids.vercel.app` (após testes)  
✅ Novas features **NÃO visíveis** em staging  
✅ Deploy automático a cada push em develop

---

## 📋 Pré-requisitos

- [ ] Conta Vercel criada (vercel.com)
- [ ] GitHub conectado ao Vercel
- [ ] Repositório GitHub: `https://github.com/Juscelinobrito/lmedukids`
- [ ] Branch `develop` com código do MVP 0.2

---

## 🚀 Passo a Passo

### 1️⃣ Conectar Repositório ao Vercel

```
Acesse: https://vercel.com/new
    ↓
Selecione "Import Project"
    ↓
Cole o URL do GitHub: https://github.com/Juscelinobrito/lmedukids
    ↓
Vercel encontra o projeto automaticamente
    ↓
Clique "Import"
```

---

### 2️⃣ Configurar Environment Variables (STAGING)

Após clicar "Import", você verá a tela de configuração:

```
Environment Variables:

┌─────────────────────────────────────────────┐
│ NAME: OPENAI_API_KEY                        │
│ VALUE: sk-proj-xxxx-sua-chave-real          │
│ ✓ Production  ✓ Preview  ✓ Development      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ NAME: ENABLE_PRACTICE_MODE                  │
│ VALUE: false                                 │
│ ☐ Production  ✓ Preview  ☐ Development      │
│ (Só em Preview = staging)                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ NAME: ENABLE_GRADING                        │
│ VALUE: false                                 │
│ ☐ Production  ✓ Preview  ☐ Development      │
│ (Só em Preview = staging)                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ NAME: NODE_ENV                              │
│ VALUE: production                           │
│ ✓ Production  ✓ Preview  ✓ Development      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ NAME: ENVIRONMENT                           │
│ VALUE: staging                              │
│ ✓ Production  ✓ Preview  ✓ Development      │
└─────────────────────────────────────────────┘
```

**Clique "Deploy"** ✅

---

### 3️⃣ Aguardar Deploy

```
Vercel mostrará:

🔨 Building...      [████████--] 50%
📦 Bundling...      [██████████] 100%
🚀 Deploying...     [██████████] 100%
✅ Deployment ready!

Preview URL: https://lmedukids-abc123.vercel.app
```

---

### 4️⃣ Testar Staging (Features Ocultas)

**Abra o browser**:
```
https://lmedukids-abc123.vercel.app
```

**Tester**: Você verá o app, MAS:
- ❌ Tab "🎯 Praticar" não aparece
- ❌ Botões "Exercícios" e "Quiz" não aparecem
- ✅ Upload e análise funcionam normalmente
- ✅ Resto das features intacto

**Validar no console do browser**:
```javascript
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

---

### 5️⃣ Fazer Testes com a Equipe

**Compartilhar**: `https://lmedukids-abc123.vercel.app`

**Testers podem**:
- ✅ Upload de imagens
- ✅ Análise com IA
- ✅ Baixar PDF
- ❌ Não veem prática (features ocultas)

**Ninguém sabe que há mais funcionalidades!** 🎯

---

### 6️⃣ Configurar Vercel para Auto-Deploy em Develop

Após o deploy inicial:

```
Vá para: Vercel Dashboard → Settings → Git
    ↓
Root Directory: (deixe em branco)
Framework Preset: Other
Build Command: (deixe em branco)
Output Directory: (deixe em branco)
    ↓
Save
```

Agora, toda vez que você fizer `git push origin develop`:
- Vercel detecta automaticamente
- Cria nova Preview URL
- Deploy acontece em ~2-3 minutos
- Features continuam ocultas! ✅

---

## 🔄 Fluxo de Desenvolvimento

### Fazer mudanças locais

```bash
# Local
npm start  # Features ativadas

# Testar o modo prática
# Validar tudo funciona
```

### Enviar para GitHub

```bash
git add -A
git commit -m "feat: melhorias no modo prática"
git push origin develop
```

### Vercel faz deploy automático

```
GitHub → Webhook → Vercel
    ↓
Nova Pre view URL: https://lmedukids-pr-*.vercel.app
    ↓
Features OCULTAS (staging)
    ↓
Compartilhar com beta testers
```

### Beta testers testam

```
URL: https://lmedukids-pr-*.vercel.app
✅ Upload funciona
✅ Análise funciona
❌ Prática não vê (como esperado)
```

---

## 📊 Comparativo de URLs

| Tipo | URL | Branch | Features | Acesso |
|------|-----|--------|----------|--------|
| **Local Dev** | localhost:3456 | develop | ✅ Todas | Você |
| **Staging** | lmedukids-pr-*.vercel.app | develop | ❌ Prática/Grading | Beta testers |
| **Production** | lmedukids.vercel.app | main | ✅ Todas | Público |

---

## 🔐 Segurança: Variáveis Sensíveis

**IMPORTANTE**: Nunca commitar API keys!

```bash
# ✅ SEGURO (não commitado)
.env.local          # git ignore
.env.development    # git ignore

# ❌ NUNCA commitar
OPENAI_API_KEY=sk-proj-xxx

# ✅ OK commitar (exemplo)
.env.example        # valores de exemplo
FEATURE_FLAGS.md    # documentação
```

---

## 🧪 Checar Status do Deploy

### No Vercel Dashboard

```
Vá para: https://vercel.com/dashboard
    ↓
Selecione projeto "lmedukids"
    ↓
Veja Deployments:
   ✅ Production (main branch)
   🔵 Preview (develop branch)
   📊 All deployments
```

---

## ⚠️ Troubleshooting

### Deploy falha com erro "Cannot find module 'express-rate-limit'"

```bash
# Backend precisa instalar dependências antes do build

Solução 1: Adicionar build command no Vercel
  Settings → Build & Development Settings
  Build Command: cd backend && npm install && npm start
  
Solução 2: Certificar que backend/package.json tem todas as dependências
  ✓ express-rate-limit^7.5.1
  ✓ node-cache^5.1.2
```

### Features aparecem em staging (deveriam estar ocultas)

```javascript
// Verificar no console:
FEATURES.PRACTICE_MODE  // Deve ser false

// Se verdadeiro:
// Verificar se Vercel Environment Variables estão salvos
// Settings → Environment Variables
// Redeployar
```

### App funciona localmente mas não no Vercel

```bash
# Verificar logs:
Vercel Dashboard → Deployment → Build Logs

Causas comuns:
1. API_KEY não configurada
2. Porta não é 3456 (Vercel força PORT=process.env.PORT)
3. Arquivo .env não existe
```

---

## ✅ Checklist Final

- [ ] Repositório GitHub setup
- [ ] Vercel projeto criado
- [ ] Environment variables configuradas
- [ ] Deploy inicial bem-sucedido
- [ ] Features ocultas em staging ✓
- [ ] Teste /api/features endpoint
- [ ] Auto-deploy configurado
- [ ] URL pública pronta para testers
- [ ] Documentação atualizada

---

## 🎉 Próximos Passos

1. **Compartilhar URL com beta testers**
   ```
   Enviar: https://lmedukids-pr-*.vercel.app
   Instruções: "Testar upload e análise"
   ```

2. **Coletar feedback**
   ```
   - Funciona tudo?
   - Bugs encontrados?
   - Sugestões?
   ```

3. **Ativar features em production** (após validação)
   ```
   - Merge develop → main
   - Vercel deploy automático
   - ENABLE_PRACTICE_MODE=true
   - Usuários públicos veem novo modo prática!
   ```

---

**Documentação criada em**: Março 12, 2026  
**Status**: ✅ Pronto para deploy  
**Próxima etapa**: Aguardar feedback dos beta testers
