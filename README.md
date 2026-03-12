# 📚 EduKids — Estudo Inteligente com IA

App para ensino infantil e fundamental I. Os pais enviam foto de uma tarefa escolar e a IA gera explicações, exercícios e quiz personalizados.

## 📁 Estrutura do projeto

```
edukids/
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
