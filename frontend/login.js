import { initSupabase, getSupabaseConfig, getCurrentUser, loginUser, signUpUser } from './supabase.js';

async function loadSupabaseConfig() {
  const windowConfig = getSupabaseConfig();
  let config = {
    url: windowConfig.url,
    anonKey: windowConfig.anonKey,
  };

  if (!config.url || !config.anonKey) {
    const response = await fetch('/api/config');
    if (response.ok) {
      const serverConfig = await response.json();
      config = {
        url: serverConfig.SUPABASE_URL || serverConfig.url,
        anonKey: serverConfig.SUPABASE_ANON_KEY || serverConfig.anonKey,
      };
    }
  }

  return config;
}

function showLogin() {
  document.getElementById('authTitle').textContent = 'Entrar';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('signupForm').style.display = 'none';
  const feedback = document.getElementById('authFeedback');
  if (feedback) feedback.textContent = '';
}

function showSignup() {
  document.getElementById('authTitle').textContent = 'Registrar';
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('signupForm').style.display = 'block';
  const feedback = document.getElementById('authFeedback');
  if (feedback) feedback.textContent = '';
}

function setFeedback(message, isError = false) {
  const feedback = document.getElementById('authFeedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.style.color = isError ? '#b42318' : '#0f766e';
}

async function handleLogin() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const { error } = await loginUser(email, password);

  if (error) {
    setFeedback(error.message || 'Não foi possível entrar.', true);
    return;
  }

  window.location.replace('/app');
}

async function handleSignup() {
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const role = document.getElementById('signupRole').value;
  const grade = document.getElementById('signupGrade').value || null;
  const { error } = await signUpUser(email, password, name, role, grade);

  if (error) {
    setFeedback(error.message || 'Não foi possível registrar.', true);
    return;
  }

  showLogin();
  setFeedback('Cadastro realizado. Faça login para continuar.');
}

async function initLoginPage() {
  try {
    const config = await loadSupabaseConfig();
    initSupabase(config);

    const { user } = await getCurrentUser();
    if (user) {
      window.location.replace('/app');
      return;
    }
  } catch (error) {
    console.error('Erro ao inicializar login:', error);
    setFeedback('Não foi possível carregar a autenticação.', true);
  }

  document.getElementById('btnAuthAction').addEventListener('click', handleLogin);
  document.getElementById('btnSignupAction').addEventListener('click', handleSignup);
  document.getElementById('linkShowSignup').addEventListener('click', (event) => {
    event.preventDefault();
    showSignup();
  });
  document.getElementById('linkShowLogin').addEventListener('click', (event) => {
    event.preventDefault();
    showLogin();
  });

  showLogin();
}

document.addEventListener('DOMContentLoaded', initLoginPage);
