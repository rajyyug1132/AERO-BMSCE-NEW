/* ===========================================================
   AeroBMSCE — Join the Network

   Alumni submissions land in a Google Sheet, but the form stays on the
   site. We POST straight to the Google Form endpoint instead of sending
   people to a Google-branded page, so responses arrive exactly where
   Mehak expects them and nobody has to leave.

   ---- WIRING IT UP -----------------------------------------------------
   1. Build the Google Form with these questions, in any order:
        Full name · Graduation year · Email · Current role ·
        Company/institution · Team · How to help · LinkedIn
   2. Open the live form, right-click → View Page Source, and search for
      "entry." — each question has an id like entry.1234567890.
   3. Paste the form id and those entry ids into FORM below.

   The request is sent no-cors, so the browser will not let us read the
   response. That is expected: Google returns an opaque result and the
   submission still lands. We treat a completed request as success, which
   is the standard trade-off for this approach.
=========================================================== */

(function(){
  "use strict";

  const FORM = {
    // https://docs.google.com/forms/d/e/<THIS PART>/viewform
    id: '',
    fields: {
      name:  'entry.0000000001',
      year:  'entry.0000000002',
      email: 'entry.0000000003',
      role:  'entry.0000000004',
      org:   'entry.0000000005',
      team:  'entry.0000000006',
      help:  'entry.0000000007',
      link:  'entry.0000000008'
    }
  };

  const FALLBACK_EMAIL = 'aerobmsce@bmsce.ac.in';

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

    // No Google Form configured yet — fall back to a prefilled email so
    // the button is never a dead end.
    if (!FORM.id){
      const body = Object.entries(data)
        .map(([k, v]) => k + ': ' + v)
        .join('\n');
      window.location.href = 'mailto:' + FALLBACK_EMAIL +
        '?subject=' + encodeURIComponent('AeroBMSCE alumni network') +
        '&body=' + encodeURIComponent(body);
      setStatus('Opening your email app — send the draft and you are in.', 'ok');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
      return;
    }

    try {
      const payload = new FormData();
      Object.entries(FORM.fields).forEach(([key, entryId]) => {
        if (data[key]) payload.append(entryId, data[key]);
      });

      await fetch(
        `https://docs.google.com/forms/d/e/${FORM.id}/formResponse`,
        { method: 'POST', mode: 'no-cors', body: payload }
      );

      form.reset();
      setStatus("You're in. We'll be in touch before the next season.", 'ok');
      setTimeout(closeModal, 2200);
    } catch (err) {
      setStatus('That did not send. Email us at ' + FALLBACK_EMAIL + '.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  });

})();
