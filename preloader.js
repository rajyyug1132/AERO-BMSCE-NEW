/* ===========================================================
   AeroBMSCE — Preloader

   Shows once per browser session. Navigating between pages after the
   first load skips it (an inline <head> script sets html.pre-seen), so
   it reads as a title card rather than a toll booth.

   The overlay never traps the site: a CSS failsafe animation clears it
   at 4.5s even if this file fails to parse. This script only makes it
   leave sooner and reports honest progress.
=========================================================== */

(function(){
  "use strict";

  const el = document.querySelector('.preloader');
  if (!el) return;

  // already shown this session — the boot script hid it, just drop it
  if (document.documentElement.classList.contains('pre-seen')){
    el.remove();
    return;
  }

  const fill   = el.querySelector('.pre-fill');
  const pct    = el.querySelector('.pre-pct');
  const status = el.querySelector('.pre-status b');

  // the CSS sweep is the no-JS fallback; we are here, so take over
  el.classList.remove('no-js');

  const PHASES = ['systems', 'airframe', 'telemetry', 'go'];
  let shown = 0;

  /* ---------- honest progress ----------
     Weighted: the DOM being parsed is most of the perceived wait, the
     images that follow are the rest. We never invent a number that is
     ahead of reality — value only moves when something actually landed. */
  let target = 0;
  let current = 0;

  function paint(){
    current += (target - current) * 0.18;
    if (target >= 100 && target - current < 0.5) current = 100;
    const v = Math.round(current);
    if (fill) fill.style.width = v + '%';
    if (pct)  pct.textContent  = String(v).padStart(3, '0') + '%';

    const phase = Math.min(PHASES.length - 1, Math.floor(v / 26));
    if (phase !== shown && status){
      shown = phase;
      status.textContent = PHASES[phase];
    }
    if (v < 100) requestAnimationFrame(paint);
  }
  requestAnimationFrame(paint);

  // DOM parsed
  document.addEventListener('DOMContentLoaded', () => {
    target = Math.max(target, 45);
    trackImages();
  });
  if (document.readyState !== 'loading'){ target = 45; trackImages(); }

  /* count only images that are actually above the fold — waiting on
     lazy-loaded gallery photos would hold the curtain for no reason */
  function trackImages(){
    const imgs = Array.from(document.images)
      .filter(i => i.loading !== 'lazy' && !i.closest('.preloader'));
    if (!imgs.length){ target = 90; return; }

    let done = 0;
    const tick = () => {
      done++;
      target = Math.max(target, 45 + Math.round((done / imgs.length) * 45));
    };
    imgs.forEach(i => {
      if (i.complete) tick();
      else { i.addEventListener('load', tick, { once:true });
             i.addEventListener('error', tick, { once:true }); }
    });
  }

  function finish(){
    target = 100;
    try { sessionStorage.setItem('aeroPreloaded', '1'); } catch(e){}
    // let the bar visibly reach 100 before the curtain lifts
    setTimeout(() => {
      el.classList.add('is-done');
      document.body.classList.add('pre-cleared');
      setTimeout(() => el.remove(), 700);
    }, 420);
  }

  window.addEventListener('load', finish);
  // hard ceiling — a single stalled asset must not hold the page
  setTimeout(finish, 3200);

})();
