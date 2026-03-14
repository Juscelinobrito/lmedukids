import {
  getCurrentUser,
  getSupabaseConfig,
  initSupabase,
  loginUser,
  logoutUser,
  isSuperAdminEmail,
  signUpUserWithTrigger,
} from './supabase.js';

const SAVED_EMAIL_KEY = 'lmedukids:last-email';

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

function saveLastEmail(email) {
  const normalized = (email || '').trim();
  if (!normalized) return;
  localStorage.setItem(SAVED_EMAIL_KEY, normalized);
}

function loadLastEmail() {
  return localStorage.getItem(SAVED_EMAIL_KEY) || '';
}

function syncEmailFields(email) {
  const normalized = (email || '').trim();
  const authEmail = document.getElementById('authEmail');
  const signupEmail = document.getElementById('signupEmail');

  if (authEmail && !authEmail.value) authEmail.value = normalized;
  if (signupEmail && !signupEmail.value) signupEmail.value = normalized;
}

function normalizeWhatsapp(value) {
  const digits = (value || '').replace(/\D/g, '');
  return digits || null;
}

function formatWhatsapp(value) {
  const digits = normalizeWhatsapp(value) || '';

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function isValidWhatsapp(value) {
  const digits = normalizeWhatsapp(value) || '';
  return digits.length === 10 || digits.length === 11;
}

async function handleLogin() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  saveLastEmail(email);
  const { profile, error } = await loginUser(email, password);

  if (error) {
    setFeedback(error.message || 'Nao foi possivel entrar.', true);
    return;
  }

  if (profile?.plan_type === 'trial' && profile?.trial_blocked && !isSuperAdminEmail(email)) {
    await logoutUser();
    setFeedback('Seu periodo de teste esta bloqueado. Entre em contato com o administrador.', true);
    return;
  }

  window.location.replace('/app');
}

async function handleSignup() {
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const whatsappInput = document.getElementById('signupWhatsapp');
  const whatsapp = normalizeWhatsapp(whatsappInput.value);
  const password = document.getElementById('signupPassword').value;
  const role = document.getElementById('signupRole').value;
  const grade = document.getElementById('signupGrade').value || null;
  saveLastEmail(email);

  if (whatsapp && !isValidWhatsapp(whatsapp)) {
    setFeedback('Informe um WhatsApp valido com DDD.', true);
    whatsappInput.focus();
    return;
  }

  const { error, pendingConfirmation } = await signUpUserWithTrigger(
    email,
    password,
    name,
    role,
    grade,
    whatsapp
  );

  if (error) {
    setFeedback(error.message || 'Nao foi possivel registrar.', true);
    return;
  }

  showLogin();
  document.getElementById('authEmail').value = email;
  document.getElementById('authPassword').value = '';
  setFeedback(
    pendingConfirmation
      ? 'Cadastro realizado. Verifique seu email para confirmar a conta antes de entrar.'
      : 'Cadastro realizado. Faca login para continuar.'
  );
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
    setFeedback('Nao foi possivel carregar a autenticacao.', true);
  }

  syncEmailFields(loadLastEmail());

  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await handleLogin();
  });
  document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await handleSignup();
  });
  document.getElementById('signupWhatsapp').addEventListener('input', (event) => {
    event.target.value = formatWhatsapp(event.target.value);
  });
  document.getElementById('authEmail').addEventListener('input', (event) => {
    saveLastEmail(event.target.value);
  });
  document.getElementById('signupEmail').addEventListener('input', (event) => {
    saveLastEmail(event.target.value);
  });
  document.getElementById('linkShowSignup').addEventListener('click', (event) => {
    event.preventDefault();
    showSignup();
    syncEmailFields(loadLastEmail());
  });
  document.getElementById('linkShowLogin').addEventListener('click', (event) => {
    event.preventDefault();
    showLogin();
    syncEmailFields(loadLastEmail());
  });

  showLogin();
}

document.addEventListener('DOMContentLoaded', initLoginPage);
