# 🧪 Guia Prático de Testes - LM EduKids com Supabase

## Status Atual
✅ Backend server.js - rodando com cache + rate limit + /api/grade
✅ Frontend supabase.js - 20+ funções prontas para testar
✅ Database schema - tabelas criadas no Supabase
✅ Configuração - ANON_KEY ativa

---

## OPÇÃO 1: Teste Rápido no Console do Navegador (5 min)
**Melhor para**: Verificar se Supabase está conectando

### Passo 1: Configure o .env.local corretamente
```bash
# c:/lmedukids/.env.local
VITE_SUPABASE_URL=https://ndmccxupbrplljalqegh.supabase.co
VITE_SUPABASE_ANON_KEY=seu_anon_key_aqui
```

### Passo 2: Abra frontend/index.html no navegador
```bash
# No VS Code: 
# Clique direito em index.html → Open with Live Server
# OU acesse: file:///c:/lmedukids/frontend/index.html
```

### Passo 3: Abra DevTools Console (F12)
Copie um dos comandos abaixo e cole no console:

**Teste 1: Criar usuário (Signup)**
```javascript
import('./supabase.js').then(mod => {
  mod.signUpUser('teste@email.com', 'senha123456', 'João Teste', 'student', 5)
    .then(result => console.log('✅ Signup:', result))
    .catch(err => console.error('❌ Erro:', err.message))
})
```

**Teste 2: Fazer login**
```javascript
import('./supabase.js').then(mod => {
  mod.loginUser('teste@email.com', 'senha123456')
    .then(result => console.log('✅ Login:', result))
    .catch(err => console.error('❌ Erro:', err.message))
})
```

**Teste 3: Verificar usuário atual**
```javascript
import('./supabase.js').then(mod => {
  mod.getCurrentUser()
    .then(user => console.log('✅ Usuário atual:', user))
    .catch(err => console.error('❌ Erro:', err.message))
})
```

**Resultado esperado:**
- ✅ Se aparecer dados do usuário → Supabase está funcionando
- ❌ Se aparecer erro "ANON_KEY" → Configurar .env.local

---

## OPÇÃO 2: Teste da API Backend (5 min)
**Melhor para**: Testar /api/grade e /api/messages

### Passo 1: Inicie o backend
```bash
cd c:/lmedukids/backend
npm start
# Esperado: "✅ Server rodando em http://localhost:3456"
```

### Passo 2: Teste Health Check
```bash
# Terminal novo:
curl http://localhost:3456/health
# Resposta: {"status":"ok"}
```

### Passo 3: Teste /api/grade (responder exercício)
```bash
curl -X POST http://localhost:3456/api/grade \
  -H "Content-Type: application/json" \
  -d '{
    "exercise_text": "Quanto é 2 + 2?",
    "student_answer": "4",
    "correct_answer": "4"
  }'
```

**Resposta esperada:**
```json
{
  "is_correct": true,
  "feedback": "✅ Resposta correta!",
  "stars": 5
}
```

### Passo 4: Teste /api/messages (análise de imagem)
```bash
curl -X POST http://localhost:3456/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "dados_base64_aqui"
  }'
```

---

## OPÇÃO 3: Teste Integrado (Criar Página de Teste)
**Melhor para**: Testar fluxo completo signup → exercise → save

### Passo 1: Crie frontend/teste.html
```html
<!DOCTYPE html>
<html>
<head>
  <title>Teste Supabase</title>
  <style>
    body { font-family: Arial; margin: 20px; }
    button { padding: 10px; margin: 5px; cursor: pointer; }
    .output { 
      background: #f0f0f0; 
      padding: 10px; 
      margin: 10px 0; 
      border-radius: 5px;
      max-height: 300px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <h1>🧪 Teste Supabase LM EduKids</h1>
  
  <h2>1️⃣ Autenticação</h2>
  <button onclick="testeSignup()">Criar Usuário</button>
  <button onclick="testeLogin()">Login</button>
  <button onclick="testeCurrentUser()">Ver Usuário Atual</button>
  
  <h2>2️⃣ Exercícios</h2>
  <button onclick="testeSaveExercise()">Salvar Exercício</button>
  <button onclick="testeGetExercises()">Listar Exercícios</button>
  
  <h2>3️⃣ Respostas</h2>
  <button onclick="testeSaveResponse()">Salvar Resposta</button>
  
  <div class="output" id="output">
    <p style="color: #999;">Resultados aparecerão aqui...</p>
  </div>

  <script type="module">
    const output = document.getElementById('output');
    
    async function log(msg, data = null) {
      const text = data ? `${msg}\n${JSON.stringify(data, null, 2)}` : msg;
      output.innerHTML = `<pre>${text}</pre>`;
      console.log(msg, data);
    }

    const { supabase, signUpUser, loginUser, getCurrentUser, saveExercise, saveExerciseResponse, getUserExercises } = await import('./supabase.js');

    window.testeSignup = async () => {
      try {
        const result = await signUpUser(`user${Date.now()}@test.com`, 'TestPass123!', 'Usuário Teste', 'student', 5);
        await log('✅ Signup sucesso:', result.user?.email);
      } catch (err) {
        await log('❌ Signup erro:', err.message);
      }
    };

    window.testeLogin = async () => {
      try {
        const result = await loginUser('user@test.com', 'TestPass123!');
        await log('✅ Login sucesso:', result.user?.email);
      } catch (err) {
        await log('❌ Login erro:', err.message);
      }
    };

    window.testeCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        await log('✅ Usuário atual:', user);
      } catch (err) {
        await log('❌ Erro ao buscar usuário:', err.message);
      }
    };

    window.testeSaveExercise = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Faça login primeiro');
        
        const exercise = await saveExercise(
          user.id,
          'https://via.placeholder.com/400x300?text=Exercicio',
          'hash123',
          { text: '2 + 2 = ?' },
          'Quanto é 2 + 2?',
          'math',
          5
        );
        await log('✅ Exercício salvo:', exercise.id);
      } catch (err) {
        await log('❌ Erro ao salvar:', err.message);
      }
    };

    window.testeGetExercises = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Faça login primeiro');
        
        const exercises = await getUserExercises(user.id);
        await log('✅ Exercícios encontrados:', exercises);
      } catch (err) {
        await log('❌ Erro ao listar:', err.message);
      }
    };

    window.testeSaveResponse = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Faça login primeiro');
        
        // Primeiro obter um exercício
        const exercises = await getUserExercises(user.id);
        if (!exercises?.length) throw new Error('Nenhum exercício encontrado');
        
        const response = await saveExerciseResponse(
          exercises[0].id,
          user.id,
          '4',
          true,
          '✅ Resposta correta!'
        );
        await log('✅ Resposta salva:', response.id);
      } catch (err) {
        await log('❌ Erro ao salvar resposta:', err.message);
      }
    };
  </script>
</body>
</html>
```

### Passo 2: Abra teste.html no navegador
- Clique em cada botão e veja os resultados em tempo real

---

## 🎯 Ordem de Testes Recomendada

1. **PRIMEIRO**: OPÇÃO 1, Teste 3 (verificar getCurrentUser) 
   - Se funcionar → Supabase está conectado ✅

2. **SEGUNDO**: OPÇÃO 3, botão "Criar Usuário"
   - Se sucesso → autenticação está funcionando ✅

3. **TERCEIRO**: OPÇÃO 3, botão "Salvar Exercício"
   - Se sucesso → dados sendo persistidos ✅

4. **QUARTO**: OPÇÃO 2, Teste /api/grade
   - Se 200 OK → backend OK ✅

---

## ❌ Problemas Comuns e Soluções

### Erro: "VITE_SUPABASE_URL não configurada"
**Solução**: Adicione ao .env.local:
```
VITE_SUPABASE_URL=https://ndmccxupbrplljalqegh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Erro: "Cannot find module '@supabase/supabase-js'"
**Solução**: 
```bash
cd frontend && npm install @supabase/supabase-js
```

### Erro: "Network error" no console
**Solução**: 
- Verifique se URL do Supabase está correta
- Verifique conectividade de internet
- Acesse https://ndmccxupbrplljalqegh.supabase.co no navegador para testar

### Erro: "Unauthorized" ao tentar login
**Solução**:
- Verifique se ANON_KEY está correta em .env.local
- Verifique se email/senha existem (rode Teste 1 primeiro)
- Verifique RLS policies no Supabase Dashboard

### Erro: /api/grade retorna 401
**Solução**:
- Backend precisa estar rodando: `npm start`
- Verifique se PORT está aberto (padrão: 3456)

---

## ✅ Checklist de Validação

- [ ] Teste 1 (console) - getCurrentUser retorna dados
- [ ] Teste 2 (console) - signUpUser cria usuário com sucesso  
- [ ] Teste 3 (teste.html) - "Salvar Exercício" persiste no banco
- [ ] Teste 4 (curl) - /api/grade responde com JSON válido
- [ ] Teste 5 (curl) - /health retorna {"status":"ok"}

Se passar em todos ✅ = Está 100% pronto para integrar no UI real!

---

## 📝 Próximos Passos Após Validação

1. Integrar login/signup na UI principal
2. Salvar exercícios automaticamente após análise
3. Mostrar histórico de exercícios
4. Calcular e exibir progresso (stars, streak, etc)
