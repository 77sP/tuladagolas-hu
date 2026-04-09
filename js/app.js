/* ============================================ */
/* app.js                                       */
/* Main application logic, routing, wiring     */
/* ============================================ */

(function () {
  'use strict';

  // ============================================
  // Ezer ok – placeholder adatok
  // [PLACEHOLDER: a szerző tölti ki végleges URL-ekkel, képekkel, címekkel]
  // ============================================
  const RESOURCE_LINKS = [
    {
      title: '[PLACEHOLDER] Ok #1',
      description: 'Rövid leírás arról, miért érdemes olvasni ezt a forrást.',
      url: 'https://example.com',
      thumbnail: 'assets/OV-tabletta_01.png'
    },
    {
      title: '[PLACEHOLDER] Ok #2',
      description: 'Rövid leírás arról, miért érdemes olvasni ezt a forrást.',
      url: 'https://example.com',
      thumbnail: 'assets/OV-tabletta_01.png'
    },
    {
      title: '[PLACEHOLDER] Ok #3',
      description: 'Rövid leírás arról, miért érdemes olvasni ezt a forrást.',
      url: 'https://example.com',
      thumbnail: 'assets/OV-tabletta_01.png'
    },
    {
      title: '[PLACEHOLDER] Ok #4',
      description: 'Rövid leírás arról, miért érdemes olvasni ezt a forrást.',
      url: 'https://example.com',
      thumbnail: 'assets/OV-tabletta_01.png'
    },
    {
      title: '[PLACEHOLDER] Ok #5',
      description: 'Rövid leírás arról, miért érdemes olvasni ezt a forrást.',
      url: 'https://example.com',
      thumbnail: 'assets/OV-tabletta_01.png'
    },
    {
      title: '[PLACEHOLDER] Ok #6',
      description: 'Rövid leírás arról, miért érdemes olvasni ezt a forrást.',
      url: 'https://example.com',
      thumbnail: 'assets/OV-tabletta_01.png'
    }
  ];

  // ============================================
  // Input validáció
  // ============================================
  function validateBirthDate(value) {
    if (!value) {
      return { valid: false, error: 'Kérlek, add meg a születési dátumodat.' };
    }

    const birth = new Date(value);
    if (isNaN(birth.getTime())) {
      return { valid: false, error: 'Érvénytelen dátum formátum.' };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (birth > today) {
      return { valid: false, error: 'Még nem születtél meg! 😉' };
    }

    const minDate = new Date('1920-01-01');
    if (birth < minDate) {
      return { valid: false, error: 'Érvénytelen dátum (1920 előtti).' };
    }

    return { valid: true, date: birth };
  }

  // ============================================
  // Resource cards renderelése
  // ============================================
  function renderResources() {
    const grid = document.getElementById('resources-grid');
    if (!grid) return;

    const fragment = document.createDocumentFragment();

    RESOURCE_LINKS.forEach((link) => {
      const card = document.createElement('a');
      card.className = 'resource-card';
      card.href = link.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.setAttribute('role', 'listitem');

      card.innerHTML = `
        <img src="${link.thumbnail}" alt="" class="resource-card__image" loading="lazy" width="400" height="225">
        <div class="resource-card__body">
          <h3 class="resource-card__title">${escapeHtml(link.title)}</h3>
          <p class="resource-card__description">${escapeHtml(link.description)}</p>
          <span class="resource-card__link">Olvasd el →</span>
        </div>
      `;

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================
  // Fun facts kártya definíciók
  // ============================================
  const FUN_FACT_DEFS = [
    {
      icon: '📅',
      label: 'nap az életedben',
      value: (f, C) => C.formatNumber(f.days)
    },
    {
      icon: '❤️',
      label: 'szívverés',
      value: (f, C) => C.formatBigNumber(f.heartbeats)
    },
    {
      icon: '🌍',
      label: 'km a Nap körül',
      value: (f, C) => C.formatBigNumber(f.kmAroundSun)
    },
    {
      icon: '🫁',
      label: 'lélegzetvétel',
      value: (f, C) => C.formatBigNumber(f.breaths)
    },
    {
      icon: '🗳️',
      label: 'országgyűlési választás az életedben',
      value: (f, C) => C.formatNumber(f.electionsLived)
    },
    {
      icon: '🏛️',
      label: 'Orbán-kormány az életedben',
      value: (f, C) => C.formatNumber(f.orbanGovernments)
    }
  ];

  // ============================================
  // Count-up animáció
  // ============================================
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateNumber(el, to, duration, formatter) {
    // Skip animation on hidden documents or reduced-motion preferences –
    // requestAnimationFrame is throttled/paused when the tab isn't visible
    if (prefersReducedMotion() || document.hidden) {
      el.textContent = formatter(to);
      return;
    }
    // Always set the final value immediately as a safety fallback, then animate
    const start = performance.now();
    const from = 0;
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      const value = from + (to - from) * eased;
      el.textContent = formatter(value);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = formatter(to);
    }
    requestAnimationFrame(frame);
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ============================================
  // Fun facts renderelés
  // ============================================
  function renderFunFacts(funFacts) {
    const grid = document.getElementById('fun-facts-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const C = window.Calculator;

    FUN_FACT_DEFS.forEach((def) => {
      const card = document.createElement('div');
      card.className = 'fun-fact';
      card.innerHTML = `
        <div class="fun-fact__icon" aria-hidden="true">${def.icon}</div>
        <div class="fun-fact__value">${def.value(funFacts, C)}</div>
        <div class="fun-fact__label">${def.label}</div>
      `;
      grid.appendChild(card);
    });
  }

  // ============================================
  // Main stat (Orbán-százalék) renderelés
  // ============================================
  function renderMainStat(orbanResult) {
    const C = window.Calculator;
    const percentEl = document.getElementById('main-stat-percent');
    const subEl = document.getElementById('main-stat-sub');

    if (!percentEl || !subEl) return;

    const target = orbanResult.percent;
    animateNumber(percentEl, target, 1500, (v) => {
      return v.toFixed(v >= 10 ? 0 : 1).replace('.', ',') + '%';
    });

    subEl.textContent = `Ez ${C.formatNumber(orbanResult.orbanDays)} nap a ${C.formatNumber(orbanResult.totalDays)} napodból.`;
  }

  // ============================================
  // Countdown
  // ============================================
  let countdownIntervalId = null;

  function startCountdown() {
    const C = window.Calculator;
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');
    const wrap = document.getElementById('countdown-wrap');
    if (!wrap || !daysEl) return;

    function tick() {
      const cd = C.getCountdown();
      if (cd.isPast) {
        wrap.hidden = true;
        if (countdownIntervalId) {
          clearInterval(countdownIntervalId);
          countdownIntervalId = null;
        }
        return;
      }
      wrap.hidden = false;
      daysEl.textContent = cd.days;
      hoursEl.textContent = String(cd.hours).padStart(2, '0');
      minutesEl.textContent = String(cd.minutes).padStart(2, '0');
      secondsEl.textContent = String(cd.seconds).padStart(2, '0');
    }

    tick();
    countdownIntervalId = setInterval(tick, 1000);
  }

  function stopCountdown() {
    if (countdownIntervalId) {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }
    if (ctaCountdownIntervalId) {
      clearInterval(ctaCountdownIntervalId);
      ctaCountdownIntervalId = null;
    }
  }

  // ============================================
  // SPA routing: showResults / showLanding
  // ============================================
  let currentBirthDate = null;

  function showResults(birthDate) {
    const C = window.Calculator;
    currentBirthDate = birthDate;

    const orbanResult = C.calculateOrbanDays(birthDate);
    const funFacts = C.calculateFunFacts(birthDate);

    renderMainStat(orbanResult);
    renderFunFacts(funFacts);
    startCountdown();

    // Grid (Phase 5)
    if (window.Grid && typeof window.Grid.renderLifeGrid === 'function') {
      const gridEl = document.getElementById('life-grid');
      if (gridEl) {
        window.Grid.renderLifeGrid(birthDate, gridEl);
      }
    }

    // Share (Phase 6)
    if (window.Share && typeof window.Share.renderShareSection === 'function') {
      window.Share.renderShareSection(birthDate, orbanResult);
    }

    // CTA (Phase 7)
    renderCTA(birthDate);

    // Swap sections
    document.getElementById('landing').hidden = true;
    document.getElementById('results').hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement ? 'instant' : 'auto' });

    if (location.hash !== '#results') {
      history.pushState({ view: 'results' }, '', '#results');
    }
  }

  function showLanding() {
    stopCountdown();
    document.getElementById('results').hidden = true;
    document.getElementById('landing').hidden = false;
    window.scrollTo({ top: 0 });
    if (location.hash === '#results') {
      history.pushState({ view: 'landing' }, '', location.pathname);
    }
  }

  // ============================================
  // CTA szekció – age-branching
  // ============================================
  function renderCTA(birthDate) {
    const C = window.Calculator;
    const section = document.getElementById('cta-section');
    if (!section) return;

    const eligible = C.canVote(birthDate);

    if (eligible) {
      section.innerHTML = `
        <div class="container cta-inner">
          <h2 class="cta-title">Szavazz április 12-én!</h2>
          <p class="cta-lead">A te szavazatod számít. Változtass!</p>
          <div class="cta-countdown" id="cta-countdown" aria-live="polite">
            <span id="cta-cd-days">0</span> nap
            <span id="cta-cd-hours">00</span>:<span id="cta-cd-minutes">00</span>:<span id="cta-cd-seconds">00</span>
          </div>
          <p class="cta-body">
            2026. április 12-én tartják az országgyűlési választást.
            Ez a te alkalmad, hogy változtass. Ne add át másnak a döntést!
          </p>
          <button type="button" class="btn btn--green btn--large" id="cta-share-scroll">
            Megosztom a barátaimmal
          </button>
        </div>
      `;

      // Start CTA countdown (separate from top countdown)
      startCtaCountdown();

      const scrollBtn = document.getElementById('cta-share-scroll');
      if (scrollBtn) {
        scrollBtn.addEventListener('click', () => {
          document.getElementById('share-section').scrollIntoView({ behavior: 'smooth' });
        });
      }
    } else {
      section.innerHTML = `
        <div class="container cta-inner">
          <h2 class="cta-title">Te még nem szavazhatsz…</h2>
          <p class="cta-lead">…de a hangod így is számít!</p>
          <p class="cta-body">
            Még nem vagy 18, ezért 2026. április 12-én nem adhatsz le szavazatot.
            De ott vannak a szüleid, a nagyszüleid, a tanáraid, a barátaid.
            <strong>Oszd meg velük ezt az oldalt!</strong>
          </p>
          <button type="button" class="btn btn--green btn--large" id="cta-share-scroll">
            Megosztom a családdal
          </button>
        </div>
      `;

      const scrollBtn = document.getElementById('cta-share-scroll');
      if (scrollBtn) {
        scrollBtn.addEventListener('click', () => {
          document.getElementById('share-section').scrollIntoView({ behavior: 'smooth' });
        });
      }
    }
  }

  // CTA countdown – separate interval
  let ctaCountdownIntervalId = null;
  function startCtaCountdown() {
    const C = window.Calculator;
    const daysEl = document.getElementById('cta-cd-days');
    const hoursEl = document.getElementById('cta-cd-hours');
    const minutesEl = document.getElementById('cta-cd-minutes');
    const secondsEl = document.getElementById('cta-cd-seconds');
    if (!daysEl) return;

    if (ctaCountdownIntervalId) clearInterval(ctaCountdownIntervalId);

    function tick() {
      const cd = C.getCountdown();
      if (cd.isPast) {
        const wrap = document.getElementById('cta-countdown');
        if (wrap) wrap.hidden = true;
        clearInterval(ctaCountdownIntervalId);
        ctaCountdownIntervalId = null;
        return;
      }
      daysEl.textContent = cd.days;
      hoursEl.textContent = String(cd.hours).padStart(2, '0');
      minutesEl.textContent = String(cd.minutes).padStart(2, '0');
      secondsEl.textContent = String(cd.seconds).padStart(2, '0');
    }
    tick();
    ctaCountdownIntervalId = setInterval(tick, 1000);
  }

  // ============================================
  // Init
  // ============================================
  function init() {
    // Input max attribute to today
    const input = document.getElementById('birth-date');
    if (input) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      input.max = `${yyyy}-${mm}-${dd}`;
    }

    // Form submit
    const form = document.getElementById('calc-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }

    // Recalculate buttons (top + bottom)
    ['recalculate-btn', 'recalculate-btn-top'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', showLanding);
      }
    });

    // hashchange (browser back/forward)
    window.addEventListener('hashchange', () => {
      if (location.hash === '#results' && currentBirthDate) {
        document.getElementById('landing').hidden = true;
        document.getElementById('results').hidden = false;
      } else {
        document.getElementById('results').hidden = true;
        document.getElementById('landing').hidden = false;
        stopCountdown();
      }
    });

    // Render resources
    renderResources();
  }

  function handleSubmit(e) {
    e.preventDefault();

    const input = document.getElementById('birth-date');
    const errorEl = document.getElementById('input-error');

    const result = validateBirthDate(input.value);

    if (!result.valid) {
      errorEl.textContent = result.error;
      input.focus();
      return;
    }

    errorEl.textContent = '';
    showResults(result.date);
  }

  // ============================================
  // DOM ready
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for testing / other modules
  window.App = {
    validateBirthDate: validateBirthDate
  };
})();
