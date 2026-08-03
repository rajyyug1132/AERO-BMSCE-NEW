/* ===========================================================
   AeroBMSCE — interactions
   Starfield canvas, scroll reveal, nav state, countdown, counters
=========================================================== */

(function(){
  "use strict";

  /* ---------- Starfield canvas ---------- */
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let w, h;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars(){
    const count = Math.min(160, Math.floor((w * h) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      baseAlpha: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.15 + 0.02,
      twinkleOffset: Math.random() * Math.PI * 2,
      // most sparks read gold (cosmetics); a minority glow brick-red (background accent)
      ember: Math.random() < 0.28
    }));
  }

  let t = 0;
  function drawStars(){
    ctx.clearRect(0, 0, w, h);
    t += 0.01;
    for (const s of stars){
      s.y += s.speed;
      if (s.y > h) s.y = 0;
      const twinkle = reduceMotion ? 1 : (Math.sin(t + s.twinkleOffset) * 0.3 + 0.7);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.ember
        ? `rgba(196, 80, 47, ${s.baseAlpha * twinkle})`
        : `rgba(244, 210, 140, ${s.baseAlpha * twinkle})`;
      ctx.fill();
    }
    requestAnimationFrame(drawStars);
  }

  window.addEventListener('resize', resize);
  resize();
  drawStars();

  /* ---------- Nav scroll state ---------- */
  const nav = document.getElementById('nav');
  if (nav){
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reading progress ---------- */
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar){
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progressBar.style.width = Math.min(pct, 100) + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const hasMenu = Boolean(navToggle && mobileOverlay);

  function setMenu(open){
    if (!hasMenu) return;
    navToggle.classList.toggle('open', open);
    mobileOverlay.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) mobileOverlay.querySelector('a')?.focus();
    else navToggle.focus();
  }

  if (hasMenu){
    navToggle.addEventListener('click', () => {
      setMenu(!mobileOverlay.classList.contains('open'));
    });
    mobileOverlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => setMenu(false));
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal, .hero-title');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));

  /* stagger hero step reveal a touch */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.hero-content .eyebrow')?.classList.add('in-view');
  });

  /* ---------- Counter animation ---------- */
  const counters = document.querySelectorAll('.stat-num');
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      function tick(now){
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(tick);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterIO.observe(c));

  /* ---------- Countdown to next flight line ---------- */
  // Target: next manifest event window — adjust as real dates are confirmed.
  const target = new Date('2026-09-20T09:00:00+05:30').getTime();
  const cdD = document.getElementById('cd-d');
  const cdH = document.getElementById('cd-h');
  const cdM = document.getElementById('cd-m');
  const cdS = document.getElementById('cd-s');

  function pad(n){ return String(n).padStart(2, '0'); }

  function updateCountdown(){
    const now = Date.now();
    let diff = target - now;
    if (diff < 0) diff = 0;
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    if (cdD) cdD.textContent = pad(d);
    if (cdH) cdH.textContent = pad(h);
    if (cdM) cdM.textContent = pad(m);
    if (cdS) cdS.textContent = pad(s);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- Rotating CAD model (real turntable render, image sequence) ---------- */
  const FRAME_COUNT = 60;
  const framePaths = Array.from({ length: FRAME_COUNT }, (_, i) =>
    `assets/plane/frame_${String(i).padStart(2, '0')}.webp`
  );
  const planeFrameEl = document.getElementById('planeFrame');

  if (planeFrameEl){
    // preload the sequence so playback doesn't stutter
    const frameImages = framePaths.map((src) => {
      const im = new Image();
      im.src = src;
      return im;
    });

    let currentFrame = 0;
    let frameAccumulator = 0;
    const BASE_SPEED = 0.1;   // frames advanced per ~16.7ms tick when idle
    let rotationSpeed = BASE_SPEED;
    let lastTime = performance.now();

    function tick(now){
      const dt = now - lastTime;
      lastTime = now;
      if (!reduceMotion){
        frameAccumulator += rotationSpeed * (dt / 16.7);
        while (Math.abs(frameAccumulator) >= 1){
          const step = frameAccumulator > 0 ? 1 : -1;
          currentFrame = (currentFrame + step + FRAME_COUNT) % FRAME_COUNT;
          frameAccumulator -= step;
        }
        planeFrameEl.src = framePaths[currentFrame];
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // cursor steers spin speed/direction — leaving drifts back to a slow idle turn
    const steerTarget = document.querySelector('.hero-model-stage') ||
                        document.getElementById('hero');
    if (steerTarget){
      steerTarget.addEventListener('mousemove', (e) => {
        const rect = steerTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        rotationSpeed = BASE_SPEED + px * 1.6;
      });
      steerTarget.addEventListener('mouseleave', () => {
        rotationSpeed = BASE_SPEED;
      });

      // touch: drag across the model to scrub through frames
      steerTarget.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        if (!t) return;
        const rect = steerTarget.getBoundingClientRect();
        const px = (t.clientX - rect.left) / rect.width - 0.5;
        rotationSpeed = BASE_SPEED + px * 1.6;
      }, { passive: true });
      steerTarget.addEventListener('touchend', () => {
        rotationSpeed = BASE_SPEED;
      });
    }
  }

  /* ---------- Hero glow parallax on pointer move ---------- */
  const heroGlow = document.querySelector('.hero-glow');
  const heroForGlow = document.getElementById('hero');
  if (heroForGlow && heroGlow && !reduceMotion){
    heroForGlow.addEventListener('mousemove', (e) => {
      const rect = heroForGlow.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      heroGlow.style.transform = `translate(calc(-50% + ${px * 40}px), ${py * 40}px)`;
    });
  }

  /* ---------- Forms ----------
     Set FORM_ENDPOINT to a Formspree (or similar) URL to receive submissions
     as email. Leave it empty and the form falls back to opening the visitor's
     mail client with everything already filled in, so it never dead-ends. */
  const FORM_ENDPOINT = '';
  const CONTACT_EMAIL = 'aerobmsce@bmsce.ac.in';

  document.querySelectorAll('form[data-form]').forEach((form) => {
    const status = form.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    function setStatus(msg, state){
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status show' + (state ? ' is-' + state : '');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const subject = form.dataset.subject || 'AeroBMSCE enquiry';

      if (!FORM_ENDPOINT){
        const body = Array.from(data.entries())
          .map(([k, v]) => k + ': ' + v)
          .join('\n');
        window.location.href = 'mailto:' + CONTACT_EMAIL +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
        setStatus('Opening your email app — send the draft to reach us.', 'ok');
        return;
      }

      const originalLabel = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn){
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }
      setStatus('Transmitting…');

      try {
        data.append('_subject', subject);
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error('Bad response ' + res.status);
        form.reset();
        setStatus("Transmission received. We'll respond within 48 hours.", 'ok');
      } catch (err) {
        setStatus('That didn’t send. Email us directly at ' + CONTACT_EMAIL + '.', 'error');
      } finally {
        if (submitBtn){
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
        }
      }
    });
  });

  /* ---------- Airframe explorer ---------- */
  const viewer = document.getElementById('explorerViewer');
  if (viewer){
    const frameEl  = document.getElementById('explorerFrame');
    const range    = document.getElementById('explorerRange');
    const degOut   = document.getElementById('explorerDeg');
    const playBtn  = document.getElementById('explorerPlay');
    const prevBtn  = document.getElementById('explorerPrev');
    const nextBtn  = document.getElementById('explorerNext');
    const detail   = document.getElementById('subsystemDetail');
    const subs     = Array.from(document.querySelectorAll('.subsystem'));

    let frame = 0;
    let autoplay = !reduceMotion;
    let dragging = false;
    let dragStartX = 0;
    let dragStartFrame = 0;
    let glideTarget = null;

    function render(){
      frameEl.src = framePaths[frame];
      range.value = frame;
      degOut.textContent = Math.round(frame * (360 / FRAME_COUNT));
    }

    function setFrame(n){
      frame = ((Math.round(n) % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
      render();
    }

    // shortest-path glide toward a subsystem's view
    function glideTo(target){
      glideTarget = target;
      autoplay = false;
      syncPlayBtn();
    }

    function syncPlayBtn(){
      playBtn.innerHTML = autoplay ? '&#10073;&#10073;' : '&#9654;';
      playBtn.setAttribute('aria-label', autoplay ? 'Pause rotation' : 'Play rotation');
      playBtn.setAttribute('aria-pressed', String(autoplay));
    }

    let last = performance.now();
    function loop(now){
      const dt = now - last;
      last = now;

      if (glideTarget !== null){
        let diff = glideTarget - frame;
        if (diff >  FRAME_COUNT / 2) diff -= FRAME_COUNT;
        if (diff < -FRAME_COUNT / 2) diff += FRAME_COUNT;
        if (Math.abs(diff) < 0.6){
          setFrame(glideTarget);
          glideTarget = null;
        } else {
          setFrame(frame + diff * 0.16);
        }
      } else if (autoplay && !dragging){
        setFrame(frame + (dt / 16.7) * 0.12);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* drag to rotate — pointer events cover mouse, touch and pen */
    viewer.addEventListener('pointerdown', (e) => {
      dragging = true;
      glideTarget = null;
      dragStartX = e.clientX;
      dragStartFrame = frame;
      viewer.setPointerCapture(e.pointerId);
    });
    viewer.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const delta = (e.clientX - dragStartX) / viewer.offsetWidth;
      setFrame(dragStartFrame + delta * FRAME_COUNT * 1.4);
    });
    ['pointerup', 'pointercancel'].forEach(evt =>
      viewer.addEventListener(evt, () => { dragging = false; })
    );

    range.addEventListener('input', () => {
      glideTarget = null;
      autoplay = false;
      syncPlayBtn();
      setFrame(parseInt(range.value, 10));
    });

    prevBtn.addEventListener('click', () => { autoplay = false; syncPlayBtn(); setFrame(frame - 3); });
    nextBtn.addEventListener('click', () => { autoplay = false; syncPlayBtn(); setFrame(frame + 3); });
    playBtn.addEventListener('click', () => { autoplay = !autoplay; glideTarget = null; syncPlayBtn(); });

    /* subsystem selection */
    subs.forEach((btn) => {
      btn.addEventListener('click', () => {
        subs.forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');

        glideTo(parseInt(btn.dataset.frame, 10));

        detail.classList.add('is-swapping');
        setTimeout(() => {
          detail.querySelector('.detail-id').textContent    = btn.dataset.id;
          detail.querySelector('.detail-title').textContent = btn.dataset.title;
          detail.querySelector('.detail-spec').textContent  = btn.dataset.spec;
          detail.querySelector('.detail-body').textContent  = btn.dataset.body;
          detail.classList.remove('is-swapping');
        }, 150);
      });
    });

    syncPlayBtn();
    render();
  }

  /* ---------- Gallery lightbox ---------- */
  const tiles = Array.from(document.querySelectorAll('.media-tile'));
  if (tiles.length){
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML =
      '<button class="lightbox-close" aria-label="Close viewer">&times;</button>' +
      '<button class="lightbox-nav lightbox-prev" aria-label="Previous photo">&#8249;</button>' +
      '<button class="lightbox-nav lightbox-next" aria-label="Next photo">&#8250;</button>' +
      '<figure class="lightbox-figure">' +
        '<img alt="">' +
        '<figcaption class="lightbox-caption">' +
          '<span class="lb-id"></span><span class="lb-title"></span><span class="lb-meta"></span>' +
        '</figcaption>' +
      '</figure>' +
      '<span class="lightbox-count"></span>';
    document.body.appendChild(box);

    const lbImg   = box.querySelector('img');
    const lbId    = box.querySelector('.lb-id');
    const lbTitle = box.querySelector('.lb-title');
    const lbMeta  = box.querySelector('.lb-meta');
    const lbCount = box.querySelector('.lightbox-count');
    let index = 0;
    let lastFocused = null;

    function show(i){
      index = (i + tiles.length) % tiles.length;
      const tile = tiles[index];
      const img = tile.querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbId.textContent    = tile.querySelector('.media-cap-id')?.textContent || '';
      lbTitle.textContent = tile.querySelector('.media-cap-title')?.textContent || '';
      lbMeta.textContent  = tile.querySelector('.media-cap-meta')?.textContent || '';
      lbCount.textContent = (index + 1) + ' / ' + tiles.length;
    }

    function open(i){
      lastFocused = document.activeElement;
      show(i);
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
      box.querySelector('.lightbox-close').focus();
    }

    function close(){
      box.classList.remove('open');
      document.body.style.overflow = '';
      lastFocused?.focus();
    }

    tiles.forEach((tile, i) => {
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-label', 'View photo: ' + (tile.querySelector('.media-cap-title')?.textContent || ''));
      tile.addEventListener('click', () => open(i));
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(i); }
      });
    });

    box.querySelector('.lightbox-close').addEventListener('click', close);
    box.querySelector('.lightbox-prev').addEventListener('click', () => show(index - 1));
    box.querySelector('.lightbox-next').addEventListener('click', () => show(index + 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });

    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  /* ---------- Escape closes the mobile menu ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hasMenu && mobileOverlay.classList.contains('open')) setMenu(false);
  });

  /* ---------- Smooth scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1){
        const target = document.querySelector(id);
        if (target){
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

})();
