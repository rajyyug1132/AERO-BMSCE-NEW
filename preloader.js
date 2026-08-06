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

  /* On a warm cache window.load fires in about 150ms, the bar snapped
     straight to 100 and the whole curtain was gone inside a blink — which
     is why it looked like it never ran. A splash the visitor cannot see is
     just a delay. Hold it for a floor of 1.5s measured from first paint,
     and let the bar actually travel that distance. */
  const MIN_VISIBLE = 1500;
  const startedAt = performance.now();
  const elapsed = () => performance.now() - startedAt;

  /* ---------- honest progress ----------
     Weighted: the DOM being parsed is most of the perceived wait, the
     images that follow are the rest. We never invent a number that is
     ahead of reality — value only moves when something actually landed. */
  let target = 0;
  let current = 0;

  function paint(){
    /* The bar shows whichever is LOWER: what has actually loaded, or what
       the clock has earned. Real progress can never be overstated, and a
       fully cached page still gets a bar that travels rather than one that
       is already full before it is visible. */
    const floorPace = (elapsed() / MIN_VISIBLE) * 100;
    let aim = Math.min(target, floorPace);
    if (target >= 100 && elapsed() >= MIN_VISIBLE) aim = 100;

    current += (aim - current) * 0.16;
    if (aim >= 100 && aim - current < 0.5) current = 100;
    const v = Math.round(current);
    if (fill) fill.style.width = v + '%';
    if (pct)  pct.textContent  = String(v).padStart(3, '0') + '%';

    const phase = Math.min(PHASES.length - 1, Math.floor(v / 26));
    if (phase !== shown && status){
      shown = phase;
      status.textContent = PHASES[phase];
    }
    // keep ticking until the curtain is actually gone; stopping at 100
    // left the loop dead if target arrived before the floor did
    if (!cleared) requestAnimationFrame(paint);
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

  let cleared = false;

  function finish(){
    if (cleared) return;          // load and the ceiling both call this
    cleared = true;
    target = 100;
    try { sessionStorage.setItem('aeroPreloaded', '1'); } catch(e){}

    // serve the remainder of the floor, then let the bar land on 100
    // before the curtain lifts
    const wait = Math.max(0, MIN_VISIBLE - elapsed()) + 380;
    setTimeout(() => {
      el.classList.add('is-done');
      document.body.classList.add('pre-cleared');
      setTimeout(() => el.remove(), 700);
    }, wait);
  }

  window.addEventListener('load', finish);
  // hard ceiling — a single stalled asset must not hold the page
  setTimeout(finish, 3600);

})();
