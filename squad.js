/* ===========================================================
   AeroBMSCE — Squad cards

   ---- EDITING THE ROSTER --------------------------------------------
   Everything the Squad page shows comes from ROSTER below. Only `name`,
   `role` and `division` are required. Every other field is optional and
   the card simply omits what is missing rather than showing an empty
   slot — so a member with no photograph gets an initials tile, and one
   with no bio is not clickable.

     {
       name:     'Full Name',              // required
       role:     'Structures Lead',        // required
       division: 'Airframe',               // required, groups the card
       lead:     true,                     // optional, gold treatment
       photo:    'assets/squad/name.webp', // optional, square ~600px
       skills:   ['Composites', 'CAD'],    // optional, max 3 shown
       bio:      'One or two sentences.',  // optional, enables the panel
       links: { linkedin: 'https://…', github: 'https://…' }
     }

   Photographs: square, roughly 600x600, saved as WebP in assets/squad/.
=========================================================== */

(function(){
  "use strict";

  const ROSTER = [
    // ---------- Core Command ----------
    { name: 'Yyug Mohapatro', role: 'Tech Lead',        division: 'Core Command', lead: true },
    { name: 'A. Rao',         role: 'Captain',          division: 'Core Command' },
    { name: 'P. Nair',        role: 'Vice Captain',     division: 'Core Command' },
    { name: 'K. Mehta',       role: 'Chief Engineer',   division: 'Core Command' },

    // ---------- Systems Integration ----------
    { name: 'S. Verma',       role: 'Systems Lead',      division: 'Systems Integration' },
    { name: 'A. Kumar',       role: 'Flight Controller', division: 'Systems Integration' },
    { name: 'R. Das',         role: 'Sensor Systems',    division: 'Systems Integration' },

    // ---------- Airframe ----------
    { name: 'M. Sharma',      role: 'Structures Lead',      division: 'Airframe' },
    { name: 'F. Quereshi',    role: 'Composites',           division: 'Airframe' },
    { name: 'N. Iyer',        role: 'CAD / Manufacturing',  division: 'Airframe' }
  ];

  const DIVISIONS = ['Core Command', 'Systems Integration', 'Airframe'];

  const mount = document.getElementById('squadMount');
  if (!mount) return;

  /* ---------- helpers ---------- */
  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, c => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
    ));
  }

  function safeUrl(u){
    if (!u) return null;
    try {
      const p = new URL(u, window.location.origin);
      return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : null;
    } catch { return null; }
  }

  function initials(name){
    return String(name || '?').split(/\s+/).slice(0, 2)
      .map(w => w[0]?.toUpperCase() || '').join('');
  }

  const ICONS = {
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.5 8.65 21 11 21 14.1V21h-4v-6.1c0-1.45-.03-3.32-2.02-3.32-2.02 0-2.33 1.58-2.33 3.21V21H9z"/></svg>',
    github:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z"/></svg>',
    email:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M3 6.5l9 6 9-6"/></svg>'
  };

  /* ---------- card ---------- */
  function card(m, idx){
    const hasBio = Boolean(m.bio);
    const links  = Object.entries(m.links || {})
      .map(([k, v]) => {
        const href = k === 'email' ? ('mailto:' + v) : safeUrl(v);
        if (!href || !ICONS[k]) return '';
        return `<a class="sq-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer"
                   aria-label="${esc(m.name)} on ${esc(k)}">${ICONS[k]}</a>`;
      }).join('');

    const skills = (m.skills || []).slice(0, 3)
      .map(s => `<span class="sq-skill">${esc(s)}</span>`).join('');

    const media = m.photo
      ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy" width="600" height="600">`
      : `<span class="sq-initials" aria-hidden="true">${esc(initials(m.name))}</span>`;

    return `
    <article class="sq-card${m.lead ? ' sq-card--lead' : ''}${hasBio ? ' is-expandable' : ''}"
             ${hasBio ? `tabindex="0" role="button" aria-label="Read more about ${esc(m.name)}" data-bio="${idx}"` : ''}>
      <div class="sq-photo">
        ${media}
        ${m.lead ? '<span class="sq-badge">Lead</span>' : ''}
      </div>
      <div class="sq-body">
        <h4 class="sq-name">${esc(m.name)}</h4>
        <p class="sq-role">${esc(m.role)}</p>
        ${skills ? `<div class="sq-skills">${skills}</div>` : ''}
        ${links  ? `<div class="sq-links">${links}</div>` : ''}
        ${hasBio ? '<span class="sq-more">Read more →</span>' : ''}
      </div>
    </article>`;
  }

  /* ---------- render ---------- */
  mount.innerHTML = DIVISIONS.map((div, di) => {
    const members = ROSTER.filter(m => m.division === div);
    if (!members.length) return '';
    return `
    <div class="team-block reveal">
      <div class="team-block-head">
        <span class="team-block-idx">${String(di + 1).padStart(2, '0')}</span>
        <h3>${esc(div)}</h3>
        <span class="team-count">${members.length} member${members.length === 1 ? '' : 's'}</span>
      </div>
      <div class="sq-grid">
        ${members.map(m => card(m, ROSTER.indexOf(m))).join('')}
      </div>
    </div>`;
  }).join('');

  // keep the headcount honest — derived, never hand-typed
  const tally = document.getElementById('squadTally');
  if (tally) tally.textContent = `Personnel · ${ROSTER.length} active`;

  /* ---------- detail panel ---------- */
  const panel = document.createElement('div');
  panel.className = 'modal sq-modal';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.hidden = true;
  panel.innerHTML = `
    <div class="modal-panel sq-modal-panel">
      <button type="button" class="modal-close" aria-label="Close">&times;</button>
      <div class="sq-modal-body"></div>
    </div>`;
  document.body.appendChild(panel);

  const body     = panel.querySelector('.sq-modal-body');
  const closeBtn = panel.querySelector('.modal-close');
  let lastFocused = null;

  function open(i){
    const m = ROSTER[i];
    if (!m) return;
    lastFocused = document.activeElement;

    const skills = (m.skills || [])
      .map(s => `<li>${esc(s)}</li>`).join('');
    const links = Object.entries(m.links || {}).map(([k, v]) => {
      const href = k === 'email' ? ('mailto:' + v) : safeUrl(v);
      if (!href || !ICONS[k]) return '';
      return `<a class="sq-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer"
                 aria-label="${esc(k)}">${ICONS[k]}</a>`;
    }).join('');

    body.innerHTML = `
      <div class="sq-modal-photo">
        ${m.photo
          ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}">`
          : `<span class="sq-initials sq-initials--lg">${esc(initials(m.name))}</span>`}
      </div>
      <div class="sq-modal-text">
        <span class="section-tag">${esc(m.division)}</span>
        <h3 class="modal-title">${esc(m.name)}</h3>
        <p class="sq-modal-role">${esc(m.role)}</p>
        <p class="sq-modal-bio">${esc(m.bio)}</p>
        ${skills ? `<h4 class="sq-modal-h">Works on</h4><ul class="sq-modal-list">${skills}</ul>` : ''}
        ${links  ? `<h4 class="sq-modal-h">Connect</h4><div class="sq-links">${links}</div>` : ''}
      </div>`;

    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('open'));
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close(){
    panel.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { panel.hidden = true; }, 300);
    lastFocused?.focus();
  }

  mount.addEventListener('click', (e) => {
    const c = e.target.closest('[data-bio]');
    if (c && !e.target.closest('.sq-link')) open(Number(c.dataset.bio));
  });
  mount.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const c = e.target.closest('[data-bio]');
    if (c){ e.preventDefault(); open(Number(c.dataset.bio)); }
  });

  closeBtn.addEventListener('click', close);
  panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) close();
  });

  // let the shared reveal observer pick up the freshly built blocks
  document.dispatchEvent(new CustomEvent('aero:content-added'));
})();
