/* ===========================================================
   AeroBMSCE — Flight Deck

   The page ships hidden behind a gate and only reveals itself once a
   session is confirmed. That is a courtesy, not a security control —
   the real protection is Row Level Security on the server. Anyone can
   read this file; nobody can read the data without a valid session.
=========================================================== */

(function(){
  "use strict";

  const LOGIN = 'login.html';

  const gate    = document.getElementById('dashGate');
  const shell   = document.getElementById('dashShell');
  const feedEl  = document.getElementById('feed');
  const form    = document.getElementById('updateForm');

  let supabase = null;
  let me       = null;   // profiles row
  let filter   = 'all';
  let cache    = [];     // last fetched updates

  /* ---------- helpers ---------- */
  const $ = (id) => document.getElementById(id);

  // Only http(s) survives. Anything else (javascript:, data:, vbscript:)
  // becomes null and the link is simply not rendered. The database now
  // enforces this too; this is the second layer.
  function safeUrl(u){
    if (!u) return null;
    try {
      const parsed = new URL(u, window.location.origin);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : null;
    } catch { return null; }
  }

  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, c => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
    ));
  }

  function ago(iso){
    const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (secs < 60)     return 'just now';
    if (secs < 3600)   return Math.floor(secs / 60) + 'm ago';
    if (secs < 86400)  return Math.floor(secs / 3600) + 'h ago';
    if (secs < 604800) return Math.floor(secs / 86400) + 'd ago';
    return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
  }

  function initials(name){
    return String(name || '?')
      .split(/\s+/).slice(0, 2)
      .map(w => w[0]?.toUpperCase() || '')
      .join('');
  }

  function setStatus(el, msg, state){
    el.textContent = msg || '';
    el.className = 'form-status' + (msg ? ' show' : '') + (state ? ' is-' + state : '');
  }

  /* ---------- boot ---------- */
  async function boot(){
    try {
      supabase = await window.aeroClientAsync();
    } catch {
      gate.innerHTML =
        '<div class="dash-gate-inner"><p class="mono">Could not reach the authentication service.<br>' +
        'Check your connection or disable any ad blocker, then reload.</p></div>';
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session){
      window.location.replace(LOGIN);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, division')
      .eq('id', session.user.id)
      .single();

    if (error || !profile){
      // Signed in but no profile row — the trigger should prevent this.
      gate.innerHTML =
        '<div class="dash-gate-inner"><p class="mono">Your account has no profile yet.<br>' +
        'Ask a Core admin to check it.</p></div>';
      return;
    }

    me = profile;
    paintIdentity();

    gate.hidden  = true;
    shell.hidden = false;

    if (me.role === 'admin') $('adminPanel').hidden = false;

    await Promise.all([loadStats(), loadFeed()]);
    if (me.role === 'admin') loadPending();

    // a sign-out in another tab should not leave this one open
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.replace(LOGIN);
    });
  }

  function paintIdentity(){
    const first = (me.full_name || '').split(/\s+/)[0] || 'there';
    $('dashFirst').textContent = first;
    $('dashName').textContent  = me.full_name || '—';
    $('dashRole').textContent  = me.role;
    $('dashRole').classList.add('is-' + me.role);
  }

  /* ---------- stats ---------- */
  async function loadStats(){
    const { data, error } = await supabase.rpc('dashboard_stats');
    if (error || !data) return;
    $('statUpdates').textContent  = data.total_updates ?? 0;
    $('statWins').textContent     = data.wins_this_month ?? 0;
    $('statBlockers').textContent = data.open_blockers ?? 0;
    $('statMembers').textContent  = data.members ?? 0;
    $('pendingCount').textContent = data.pending_alumni ?? 0;
  }

  /* ---------- feed ---------- */
  async function loadFeed(){
    const { data, error } = await supabase
      .from('updates')
      .select('id, workstream, kind, title, detail, proof_url, resolved, created_at, author_id, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(60);

    if (error){
      feedEl.innerHTML = '<p class="feed-empty mono">Could not load the feed.</p>';
      return;
    }
    cache = data || [];
    renderFeed();
  }

  function renderFeed(){
    let rows = cache;
    if (filter === 'mine')         rows = rows.filter(r => r.author_id === me.id);
    else if (filter !== 'all')     rows = rows.filter(r => r.kind === filter);

    if (!rows.length){
      feedEl.innerHTML = '<p class="feed-empty mono">Nothing here yet. Post the first update.</p>';
      return;
    }

    feedEl.innerHTML = rows.map(r => {
      const mine   = r.author_id === me.id;
      const author = r.profiles?.full_name || 'Unknown';
      const isOpenBlocker = r.kind === 'blocker' && !r.resolved;

      return `
      <article class="upd upd--${esc(r.kind)}${r.resolved ? ' is-resolved' : ''}">
        <span class="upd-avatar" aria-hidden="true">${esc(initials(author))}</span>
        <div class="upd-body">
          <div class="upd-meta">
            <span class="upd-kind">${esc(r.kind)}</span>
            <span class="upd-stream">${esc(r.workstream)}</span>
            <span class="upd-dot">·</span>
            <span class="upd-author">${esc(author)}</span>
            <span class="upd-dot">·</span>
            <time datetime="${esc(r.created_at)}">${esc(ago(r.created_at))}</time>
            ${r.resolved ? '<span class="upd-flag">resolved</span>' : ''}
          </div>
          <h3 class="upd-title">${esc(r.title)}</h3>
          ${r.detail ? `<p class="upd-detail">${esc(r.detail)}</p>` : ''}
          ${safeUrl(r.proof_url) ? `<a class="upd-proof" href="${esc(safeUrl(r.proof_url))}" target="_blank" rel="noopener noreferrer">View proof ↗</a>` : ''}
          ${(isOpenBlocker && (mine || me.role === 'admin'))
            ? `<button type="button" class="upd-action" data-resolve="${esc(r.id)}">Mark resolved</button>` : ''}
          ${(mine || me.role === 'admin')
            ? `<button type="button" class="upd-action upd-action--danger" data-delete="${esc(r.id)}">Delete</button>` : ''}
        </div>
      </article>`;
    }).join('');
  }

  /* filters */
  document.querySelectorAll('.feed-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.feed-filter').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      filter = btn.dataset.filter;
      renderFeed();
    });
  });

  /* feed actions — delegated, so re-renders keep working */
  feedEl.addEventListener('click', async (e) => {
    const resolveId = e.target.closest('[data-resolve]')?.dataset.resolve;
    const deleteId  = e.target.closest('[data-delete]')?.dataset.delete;

    if (resolveId){
      const { error } = await supabase.from('updates')
        .update({ resolved: true }).eq('id', resolveId);
      if (!error){ await Promise.all([loadFeed(), loadStats()]); }
    }

    if (deleteId){
      if (!confirm('Delete this update? This cannot be undone.')) return;
      const { error } = await supabase.from('updates').delete().eq('id', deleteId);
      if (!error){ await Promise.all([loadFeed(), loadStats()]); }
    }
  });

  /* ---------- composer ---------- */
  const titleEl = $('upTitle');
  titleEl.addEventListener('input', () => {
    $('titleCount').textContent = titleEl.value.length;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = $('updateStatus');
    const btn = $('updateSubmit');

    const title = titleEl.value.trim();
    if (title.length < 3){
      setStatus(statusEl, 'Say a little more about what happened.', 'error');
      titleEl.focus();
      return;
    }

    const proof = $('upProof').value.trim();
    if (proof && !/^https?:\/\//i.test(proof)){
      setStatus(statusEl, 'The proof link needs to start with http:// or https://', 'error');
      $('upProof').focus();
      return;
    }

    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Posting…';
    setStatus(statusEl, '');

    const { error } = await supabase.from('updates').insert({
      author_id:  me.id,
      kind:       $('upKind').value,
      workstream: $('upWorkstream').value,
      title,
      detail:     $('upDetail').value.trim() || null,
      proof_url:  proof || null
    });

    btn.disabled = false;
    btn.innerHTML = label;

    if (error){
      setStatus(statusEl, error.message || 'That did not post.', 'error');
      return;
    }

    form.reset();
    $('titleCount').textContent = '0';
    setStatus(statusEl, 'Posted.', 'ok');
    setTimeout(() => setStatus(statusEl, ''), 2500);
    await Promise.all([loadFeed(), loadStats()]);
  });

  /* ---------- admin: alumni queue ---------- */
  async function loadPending(){
    const queue = $('adminQueue');
    const { data, error } = await supabase
      .from('alumni')
      .select('id, full_name, email, grad_year, role_title, organisation, team, help_with, linkedin, created_at')
      .eq('approved', false)
      .order('created_at', { ascending: false });

    if (error){
      queue.innerHTML = '<p class="feed-empty mono">Could not load the queue.</p>';
      return;
    }
    if (!data.length){
      queue.innerHTML = '<p class="feed-empty mono">Nothing waiting.</p>';
      return;
    }

    queue.innerHTML = data.map(a => `
      <div class="queue-row">
        <div class="queue-who">
          <span class="queue-name">${esc(a.full_name)}</span>
          <span class="queue-detail">${esc([a.role_title, a.organisation].filter(Boolean).join(' · ') || '—')}</span>
          <span class="queue-meta mono">${esc(a.email)}${a.grad_year ? ' · ' + esc(a.grad_year) : ''}${a.team ? ' · ' + esc(a.team) : ''}</span>
          ${safeUrl(a.linkedin) ? `<a class="queue-link" href="${esc(safeUrl(a.linkedin))}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>` : ''}
        </div>
        <div class="queue-actions">
          <button type="button" class="btn btn-primary" data-approve="${esc(a.id)}">Approve</button>
          <button type="button" class="upd-action upd-action--danger" data-reject="${esc(a.id)}">Reject</button>
        </div>
      </div>`).join('');
  }

  $('adminQueue')?.addEventListener('click', async (e) => {
    const approveId = e.target.closest('[data-approve]')?.dataset.approve;
    const rejectId  = e.target.closest('[data-reject]')?.dataset.reject;

    if (approveId){
      const { error } = await supabase.from('alumni')
        .update({ approved: true }).eq('id', approveId);
      if (!error){ await Promise.all([loadPending(), loadStats()]); }
    }

    if (rejectId){
      if (!confirm('Reject and delete this submission?')) return;
      const { error } = await supabase.from('alumni').delete().eq('id', rejectId);
      if (!error){ await Promise.all([loadPending(), loadStats()]); }
    }
  });

  /* ---------- sign out ---------- */
  $('signOut').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.replace(LOGIN);
  });

  boot();
})();
