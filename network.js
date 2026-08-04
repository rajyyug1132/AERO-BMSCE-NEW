/* ===========================================================
   AeroBMSCE — Join the Network

   Alumni sign-ups are written straight into the Supabase `alumni`
   table. RLS lets anyone insert but nothing read back, so a stranger
   can add themselves and cannot enumerate the directory.

   Rows land with approved = false. A Core admin flips that flag in the
   Supabase dashboard before an entry appears anywhere public.

   Unlike the Google Forms approach this replaced, the write is a real
   request we can read the result of — so a failure is reported rather
   than silently swallowed.
=========================================================== */

(function(){
  "use strict";

  const FALLBACK_EMAIL = 'aerobmsce@bmsce.ac.in';
  async function getClient(){
    if (!window.aeroClientAsync) return null;
    try { return await window.aeroClientAsync(); } catch { return null; }
  }

  const modal     = document.getElementById('networkModal');
  const openBtn   = document.getElementById('networkOpen');
  const closeBtn  = document.getElementById('networkClose');
  const form      = document.getElementById('networkForm');
  const statusEl  = document.getElementById('networkStatus');
  const submitBtn = document.getElementById('networkSubmit');

  if (!modal || !openBtn) return;

  let lastFocused = null;

  /* ---------- open / close ---------- */
  function openModal(){
    lastFocused = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('open'));
    document.body.style.overflow = 'hidden';
    modal.querySelector('input')?.focus();
  }

  function closeModal(){
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { modal.hidden = true; }, 300);
    lastFocused?.focus();
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  /* keep tabbing inside the dialog while it is open */
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = modal.querySelectorAll(
      'button, input, select, textarea, a[href]'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first){
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last){
      e.preventDefault(); first.focus();
    }
  });

  function setStatus(msg, state){
    statusEl.textContent = msg || '';
    statusEl.className = 'form-status' + (msg ? ' show' : '') + (state ? ' is-' + state : '');
  }

  /* ---------- submit ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.name?.trim()){
      setStatus('Enter your name.', 'error');
      document.getElementById('netName').focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')){
      setStatus('Enter a valid email address.', 'error');
      document.getElementById('netEmail').focus();
      return;
    }

    const originalLabel = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setStatus('Adding you to the directory…');

    // Supabase unavailable (offline, blocked CDN) — fall back to email
    // so the button is never a dead end.
    const supabase = await getClient();
    if (!supabase){
      const body = Object.entries(data).map(([k, v]) => k + ': ' + v).join('\n');
      window.location.href = 'mailto:' + FALLBACK_EMAIL +
        '?subject=' + encodeURIComponent('AeroBMSCE alumni network') +
        '&body=' + encodeURIComponent(body);
      setStatus('Opening your email app — send the draft and you are in.', 'ok');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
      return;
    }

    try {
      const year = parseInt(data.year, 10);
      const { error } = await supabase.from('alumni').insert({
        full_name:    data.name.trim(),
        email:        data.email.trim().toLowerCase(),
        grad_year:    Number.isFinite(year) ? year : null,
        role_title:   data.role?.trim()  || null,
        organisation: data.org?.trim()   || null,
        team:         data.team          || null,
        help_with:    data.help          || null,
        linkedin:     data.link?.trim()  || null
      });

      if (error){
        // 23505 is a unique violation — they are already on the list
        if (error.code === '23505'){
          setStatus("You're already on the list. We'll be in touch.", 'ok');
          setTimeout(closeModal, 2200);
          return;
        }
        throw error;
      }

      form.reset();
      setStatus("You're in. We'll be in touch before the next season.", 'ok');
      setTimeout(closeModal, 2400);
    } catch (err) {
      setStatus('That did not send. Email us at ' + FALLBACK_EMAIL + '.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  });

})();
