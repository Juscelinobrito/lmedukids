# 🗄️ SUPABASE SETUP - LM EDUKIDS

**Data**: Março 12, 2026  
**Objetivo**: Configurar banco de dados, autenticação e storage

---

## 📋 PRÉ-REQUISITOS

- ✅ Você criou projeto Supabase: `ndmccxupbrplljalqegh`
- ✅ URL do projeto: `https://ndmccxupbrplljalqegh.supabase.co`

---

## 🚀 PASSO 1: Obter API Keys

### 1. Acesse o Supabase Dashboard
```
https://app.supabase.com
```

### 2. Selecione o Projeto `lmedukids`

### 3. Vá para Settings → API → Project Settings

Você verá:
```
┌─────────────────────────────────────────────────┐
│ Project URL                                     │
│ https://ndmccxupbrplljalqegh.supabase.co        │
├─────────────────────────────────────────────────┤
│ API KEYS                                        │
├─────────────────────────────────────────────────┤
│ anon (public) - SUPABASE_ANON_KEY               │
│ eyJhbGc... [copiar] 🔐                          │
├─────────────────────────────────────────────────┤
│ service_role (private) - SUPABASE_SERVICE_KEY   │
│ eyJhbGc... [copiar] 🔐                          │
└─────────────────────────────────────────────────┘
```

### 4. Copie as duas chaves

```bash
# .env.supabase (local para desenvolvimento)

SUPABASE_URL=https://ndmccxupbrplljalqegh.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...  # Cole aqui a chave pública
SUPABASE_SERVICE_KEY=eyJhbGc... # Cole aqui a secret

# Para frontend (se usar Vite)
VITE_SUPABASE_URL=https://ndmccxupbrplljalqegh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Chave pública novamente
```

---

## 🗃️ PASSO 2: Criar Tabelas do Banco

### 1. Acesse o SQL Editor no Supabase

```
Dashboard → SQL Editor → New Query
```

### 2. Cole o arquivo `database/schema.sql`

```bash
# Copie todo o conteúdo de:
# c:/lmedukids/database/schema.sql

# Cole no Supabase SQL Editor
# Clique "Run"
```

### ✅ Você verá as tabelas criadas:

```
✓ users
✓ exercises
✓ exercise_responses
✓ quiz_results
✓ teacher_content
✓ classrooms
✓ student_progress
```

---

## 🔐 PASSO 3: Criar Storage Buckets

### 1. Vá para Storage (no menu lateral)

```
Dashboard → Storage
```

### 2. Clique "New Bucket" 3 vezes:

**Bucket 1: user-avatars**
```
Name: user-avatars
Privacy: Public
```

**Bucket 2: exercise-images**
```
Name: exercise-images
Privacy: Private (only authenticated users)
```

**Bucket 3: teacher-content**
```
Name: teacher-content
Privacy: Private (only authenticated users)
```

---

## 👤 PASSO 4: Configurar Autenticação

### 1. Vá para Authentication (no menu)

```
Dashboard → Authentication → Providers
```

### 2. Ative Email/Password

```
Email - Enabled ✓
Password Requirements: ✓ (padrão está bom)
```

### 3. (Opcional) Ative Login Social

- Google
- GitHub
- Apple

---

## 📱 PASSO 5: Testar Conexão Localmente

### 1. Instale cliente Supabase

```bash
cd c:/lmedukids/frontend
npm install @supabase/supabase-js
```

### 2. Crie arquivo `.env.local`

```bash
VITE_SUPABASE_URL=https://ndmccxupbrplljalqegh.supabase.co
VITE_SUPABASE_ANON_KEY=[seu_anon_key_aqui]
```

### 3. Teste no console do navegador

```javascript
// Open: http://localhost:3456
// Console:

// 1. Testar conexão
fetch('https://ndmccxupbrplljalqegh.supabase.co/rest/v1/users', {
  headers: {
    'apikey': '[seu_anon_key]',
    'Authorization': 'Bearer [seu_anon_key]'
  }
})
.then(r => r.json())
.then(console.log)

// Deve retornar:
// { data: [], count: 0 }  (ainda nenhum usuário)
```

---

## 🔌 PASSO 6: Integrar ao Frontend

### 1. Importar funções Supabase em `frontend/app.js`

```javascript
// No início do arquivo

import { 
  supabase,
  signUpUser,
  loginUser,
  getCurrentUser,
  saveExercise,
  saveExerciseResponse
} from './supabase.js';
```

### 2. Adicionar telas de Auth (Login/Signup)

Criar `frontend/auth.html`:
```html
<!-- Login Form -->
<div id="login-screen">
  <input id="email" type="email" placeholder="Email">
  <input id="password" type="password" placeholder="Senha">
  <button onclick="handleLogin()">Entrar</button>
  <button onclick="showSignup()">Registrar</button>
</div>

<!-- Signup Form -->
<div id="signup-screen" style="display:none">
  <input id="signup-name" type="text" placeholder="Nome">
  <input id="signup-email" type="email" placeholder="Email">
  <input id="signup-password" type="password" placeholder="Senha">
  <select id="signup-role">
    <option value="student">Aluno</option>
    <option value="teacher">Professor</option>
  </select>
  <input id="signup-grade" type="number" placeholder="Série (1-9)" min="1" max="9">
  <button onclick="handleSignup()">Registrar</button>
</div>
```

### 3. Adicionar listeners

```javascript
async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const { user, profile, error } = await loginUser(email, password);
  
  if (error) {
    alert('❌ Erro: ' + error.message);
    return;
  }
  
  console.log('✅ Logado como:', profile.name);
  // Mostrar app
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
}

async function handleSignup() {
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const role = document.getElementById('signup-role').value;
  const grade = role === 'student' ? parseInt(document.getElementById('signup-grade').value) : null;
  
  const { user, profile, error } = await signUpUser(email, password, name, role, grade);
  
  if (error) {
    alert('❌ Erro: ' + error.message);
    return;
  }
  
  alert('✅ Registrado! Verifique seu email e faça login.');
  showLogin();
}

// Verificar se está logado ao abrir
window.addEventListener('load', async () => {
  const { user, profile } = await getCurrentUser();
  
  if (user) {
    // Está logado - mostrar app
    console.log('✅ Bem-vindo de volta:', profile.name);
  } else {
    // Não está logado - mostrar tela de login
    document.getElementById('login-screen').style.display = 'block';
  }
});
```

---

## 💾 PASSO 7: Salvar Exercícios

Após análise de IA:

```javascript
async function saveAnalysisToDatabase(imageBase64, analysisData, userGrade) {
  const { user, profile } = await getCurrentUser();
  
  if (!user) {
    console.warn('⚠️ Usuário não autenticado');
    return;
  }
  
  // Gerar hash da imagem (para cache)
  const imageHash = crypto
    .createHash('sha256')
    .update(imageBase64.substring(0, 1000))
    .digest('hex');
  
  // Extrair texto do exercício
  const exerciseText = analysisData.textoPrincipal || 'Exercício analisado';
  
  // Salvar no banco
  const { data, error } = await saveExercise(
    user.id,
    imageBase64,  // Ou URL se salvar em storage
    imageHash,
    analysisData,
    exerciseText,
    'math',  // Detectar automaticamente
    userGrade
  );
  
  if (error) {
    console.error('❌ Erro ao salvar:', error);
    return;
  }
  
  console.log('✅ Exercício salvo no banco:', data.id);
  
  // Agora, quando aluno responde:
  // await saveExerciseResponse(data.id, user.id, studentAnswer, isCorrect, feedback, hint, stars);
}
```

---

## 🧪 PASSO 8: Testar Tudo

### 1. Listar usuários criados

```javascript
// Console:
const { data, error } = await supabase
  .from('users')
  .select('*');

console.log('Usuários:', data);
```

### 2. Listar exercícios

```javascript
const { data, error } = await supabase
  .from('exercises')
  .select('*')
  .order('created_at', { ascending: false });

console.log('Exercícios:', data);
```

### 3. Ver progressos

```javascript
const { data, error } = await supabase
  .from('student_progress')
  .select('*');

console.log('Progressos:', data);
```

---

## ⚠️ SEGURANÇA

### Nunca commitar no Git:

```bash
# ❌ NÃO faça:
git add .env.supabase
SUPABASE_ANON_KEY=sk-proj-xxx  # Não commitar!

# ✅ Faça:
# Adicione ao .gitignore:
.env.supabase
.env.local
.env.*.local
```

### No Vercel:

```
Settings → Environment Variables

VITE_SUPABASE_URL=https://ndmccxupbrplljalqegh.supabase.co
VITE_SUPABASE_ANON_KEY=[sua_chave_pública]
```

---

## 📊 O Que Você Tem Agora

```
✅ Banco de dados PostgreSQL (Supabase)
✅ 7 tabelas estruturadas
✅ Row Level Security (RLS) configurado
✅ Autenticação email/password
✅ 3 storage buckets
✅ Cliente Supabase em JavaScript
✅ Funções prontas para signup/login/save
```

---

## 🔗 Próximos Passos

1. ✅ Integrar auth screens no app
2. ✅ Fazer testes com 50 imagens
3. ✅ Salvar exercícios no banco
4. ✅ Criar painel do professor
5. ✅ Deploy no Vercel com env vars

---

## ❓ FAQ

**P: Preciso usar Supabase?**  
R: Não, é opcional. Mas para Phase 2 (múltiplos usuários, persistência) é recomendado.

**P: Posso usar outro banco (Firebase)?**  
R: Sim! Lógica é similar, só mudam os imports.

**P: As chaves ficarão expostas?**  
R: ANON_KEY é OK expor (pública), SERVICE_KEY nunca!

**P: Posso testar localmente sem Vercel?**  
R: SIM! Use http://localhost:3456 + .env.local

---

**Status**: 🎯 Pronto para começar integração  
**Próxima sessão**: Implementar login/signup no frontend
