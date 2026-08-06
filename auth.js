/* ===========================================================
   AeroBMSCE — team login

   Connected to Supabase. Project settings live in supabase-client.js.

   The client is fetched at submit time rather than at page load, so a
   slow CDN cannot leave the form permanently reporting "no backend".
=========================================================== */

(function(){
  "use strict";

  /* ---------- config ---------- */
  const REDIRECT_AFTER_LOGIN = 'dashboard.html';

  const form      = document.getElementById('loginForm');
  const emailEl   = document.getElementById('authEmail');
  const passEl    = document.getElementById('authPassword');
  const rememberEl= document.getElementById('authRemember');   // honoured after sign-in
  const submitBtn = document.getElementById('authSubmit');
  const statusEl  = document.getElementById('authStatus');
  const revealBtn = document.getElementById('authReveal');

  if (!form) return;

  /* ---------- Supabase client, resolved when needed ---------- */
  async function getClient(){
    if (!window.aeroClientAsync) throw new Error('CLIENT_SCRIPT_MISSING');
    return window.aeroClientAsync();
  }

  function setStatus(msg, state){
    statusEl.textContent = msg || '';
    statusEl.className = 'auth-status' + (msg ? ' show' : '') + (state ? ' is-' + state : '');
  }

  function setBusy(busy){
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Authenticating…' : 'Sign In';
    form.classList.toggle('is-busy', busy);
  }

  /* ---------- show / hide password ---------- */
  revealBtn.addEventListener('click', () => {
    const shown = passEl.type === 'text';
    passEl.type = shown ? 'password' : 'text';
    revealBtn.textContent = shown ? 'Show' : 'Hide';
    revealBtn.setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
    revealBtn.setAttribute('aria-pressed', String(!shown));
    passEl.focus();
  });

  /* ---------- validation ---------- */
  function validate(){
    const email = emailEl.value.trim();
    const pass  = passEl.value;

    if (!email){
      setStatus('Enter your email address.', 'error');
      emailEl.focus();
      return null;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      setStatus('That email address does not look right.', 'error');
      emailEl.focus();
      return null;
    }
    if (!pass){
      setStatus('Enter your password.', 'error');
      passEl.focus();
      return null;
    }
    return { email, pass };
  }

  /* ---------- sign in ---------- */
  async function signIn(email, password){
    const supabase = await getClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const creds = validate();
    if (!creds) return;

    setBusy(true);
    setStatus('Verifying credentials…');

    try {
      await signIn(creds.email, creds.pass);

      // Unchecked means "do not persist" — drop the stored session so it
      // dies with the tab. Previously this checkbox was decorative.
      if (rememberEl && !rememberEl.checked){
        try {
          Object.keys(localStorage)
            .filter(k => k.startsWith('sb-') && k.includes('auth-token'))
            .forEach(k => {
              sessionStorage.setItem(k, localStorage.getItem(k));
              localStorage.removeItem(k);
            });
        } catch { /* storage unavailable — session simply persists */ }
      }

      setStatus('Authenticated. Opening your dashboard…', 'ok');
      window.location.href = REDIRECT_AFTER_LOGIN;
    } catch (err) {
      const m = err.message || '';
      if (m === 'SDK_BLOCKED'){
        setStatus('Could not reach the authentication service. Check your connection, or disable any ad blocker for this site.', 'error');
      } else if (m === 'CLIENT_SCRIPT_MISSING'){
        setStatus('Page loaded incompletely. Hard-refresh with Cmd+Shift+R.', 'error');
      } else if (/invalid login credentials/i.test(m)){
        setStatus('That email and password combination was not recognised.', 'error');
        passEl.select();
      } else if (/email not confirmed/i.test(m)){
        setStatus('This account has not been confirmed yet. Ask a Core admin.', 'warn');
      } else {
        setStatus(m || 'Those credentials were not accepted.', 'error');
        passEl.select();
      }
    } finally {
      setBusy(false);
    }
  });

  /* ---------- redirect if a session already exists ---------- */
  (async () => {
    try {
      const supabase = await getClient();
      const { data } = await supabase.auth.getSession();
      if (data.session) window.location.href = REDIRECT_AFTER_LOGIN;
    } catch {
      /* no session check possible offline — the form still works */
    }
  })();

  /* ---------- altimeter rail reacts to form completeness ---------- */
  const railFill  = document.getElementById('railFill');
  const railValue = document.getElementById('railValue');
  if (railFill && railValue){
    const CEILING = 12000;
    const update = () => {
      let filled = 0;
      if (emailEl.value.trim()) filled += 0.5;
      if (passEl.value) filled += 0.5;
      railFill.style.height = (filled * 100) + '%';
      railValue.textContent = Math.round(filled * CEILING).toLocaleString();
    };
    emailEl.addEventListener('input', update);
    passEl.addEventListener('input', update);
    update();
  }

})();
