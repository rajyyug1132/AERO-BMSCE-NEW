/* ===========================================================
   AeroBMSCE — team login

   Supabase is not wired up yet. Everything below is written so that
   connecting it is a two-step change:

     1. Add the Supabase script + your project keys in login.html:
          <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        then set SUPABASE_URL and SUPABASE_ANON_KEY in the config block.
     2. Nothing else — signIn() below already calls the real client when
        it detects one, and falls back to a local stub when it doesn't.

   The anon key is safe in client code *only* if Row Level Security is
   switched on for every table. Turn RLS on before going live, and never
   put the service_role key anywhere near the browser.
=========================================================== */

(function(){
  "use strict";

  /* ---------- config ---------- */
  const SUPABASE_URL      = '';   // e.g. https://xxxxxxxx.supabase.co
  const SUPABASE_ANON_KEY = '';   // project anon/public key
  const REDIRECT_AFTER_LOGIN = 'dashboard.html';

  const form      = document.getElementById('loginForm');
  const emailEl   = document.getElementById('authEmail');
  const passEl    = document.getElementById('authPassword');
  const rememberEl= document.getElementById('authRemember');
  const submitBtn = document.getElementById('authSubmit');
  const statusEl  = document.getElementById('authStatus');
  const revealBtn = document.getElementById('authReveal');

  if (!form) return;

  /* ---------- Supabase client, when it exists ---------- */
  let supabase = null;
  if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase){
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
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
    if (supabase){
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return data;
    }

    // No backend yet — simulate the round trip so the UI can be reviewed.
    await new Promise(r => setTimeout(r, 900));
    throw new Error('BACKEND_NOT_CONNECTED');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const creds = validate();
    if (!creds) return;

    setBusy(true);
    setStatus('Verifying credentials…');

    try {
      await signIn(creds.email, creds.pass);
      setStatus('Authenticated. Opening your dashboard…', 'ok');
      window.location.href = REDIRECT_AFTER_LOGIN;
    } catch (err) {
      if (err.message === 'BACKEND_NOT_CONNECTED'){
        setStatus('Sign-in is not live yet — Supabase still needs connecting.', 'warn');
      } else {
        setStatus(err.message || 'Those credentials were not accepted.', 'error');
        passEl.select();
      }
    } finally {
      setBusy(false);
    }
  });

  /* ---------- redirect if a session already exists ---------- */
  if (supabase){
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = REDIRECT_AFTER_LOGIN;
    });
  }

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
