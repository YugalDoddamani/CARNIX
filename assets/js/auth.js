import { supabase } from './supabase.js';

const form = document.getElementById('login-form');
const btn  = document.getElementById('login-btn');
const msg  = document.getElementById('login-msg');

// If already logged in, go to app
const { data: { session } } = await supabase.auth.getSession();
if (session) window.location.replace('/app.html');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  msg.className = 'auth-msg';
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    msg.textContent = error.message;
    msg.className = 'auth-msg error';
    btn.disabled = false;
    btn.textContent = 'Sign in';
    return;
  }

  window.location.replace('/app.html');
});
