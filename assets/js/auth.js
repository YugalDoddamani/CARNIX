import { supabase } from './supabase.js';

const loginForm = document.getElementById('login-form');

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const loginBtn = document.getElementById('login-btn');
  const msg = document.getElementById('auth-msg');

  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;

  if (!email || !password) return;

  // UI state: Loading
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in…';
  }
  if (msg) {
    msg.textContent = '';
    msg.className = 'auth-msg';
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (msg) {
      msg.textContent = error.message;
      msg.className = 'auth-msg error';
    }
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign in';
    }
    return;
  }

  // Success redirect to app shell
  window.location.replace('/app.html');
});
