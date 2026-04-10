/* ============================================ */
/* share.js                                     */
/* Canvas-based badge generator + sharing       */
/* ============================================ */

(function () {
  'use strict';

  const SITE_URL = 'https://tuladagolas.hu';

  // ============================================
  // Badge config (coordinates on 1080×1350 canvas)
  // ============================================
  const W = 1080;
  const H = 1350;
  const BG_SRC = 'assets/badge_schema.webp';

  // Grid area
  const GRID = { x: 50, y: 130, size: 930 };

  // Percentage text ("XX%") – right-aligned
  const PCT = {
    x: 540,
    y: 1080,
    font: '500 177px "Inter"',
    color: '#ffffff',
    align: 'right',
    baseline: 'top'
  };

  // Footer text (two lines, mixed colors)
  const FOOT = {
    x: 188,
    y1: 1290,
    y2: 1330,
    font: '600 26px "Inter"',
    colorDefault: '#141414',
    colorHighlight: '#ff6a00',
    baseline: 'bottom'
  };

  // Grid cell colors
  const COLOR_ORBAN = '#FF6A00';
  const COLOR_FREE = '#2A2A2A';

  // ============================================
  // Helpers
  // ============================================
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /** Draw text segments with different colors, left-to-right */
  function drawMixedText(ctx, segments, x, y) {
    let curX = x;
    for (const seg of segments) {
      ctx.fillStyle = seg.color;
      ctx.fillText(seg.text, curX, y);
      curX += ctx.measureText(seg.text).width;
    }
  }

  // ============================================
  // Generate badge canvas
  // ============================================
  async function generateBadge(birthDate, orbanResult) {
    const C = window.Calculator;
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
    const today = new Date();
    const percent = Math.round(orbanResult.percent);
    const counts = C.calculateWeekCounts(birthDate);

    // Wait for font + background image
    await document.fonts.ready;
    const bgImg = await loadImage(BG_SRC);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 1) Background image
    ctx.drawImage(bgImg, 0, 0, W, H);

    // 2) Grid – pixel-perfect rendering with integer math
    const totalDays = Math.max(0, Math.floor((today - birth) / 86400000));
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
    const side = Math.max(1, Math.ceil(Math.sqrt(totalWeeks)));
    const MS_PER_WEEK = 7 * 86400000;

    // Always 1px gap – solid grid background prevents Moiré
    const gap = 1;
    const cellSize = Math.floor((GRID.size - (side - 1) * gap) / side);
    const actualGridSize = cellSize * side + gap * (side - 1);
    const gridOffsetX = GRID.x + Math.floor((GRID.size - actualGridSize) / 2);
    const gridOffsetY = GRID.y + Math.floor((GRID.size - actualGridSize) / 2);

    // Clip to grid area
    ctx.save();
    ctx.beginPath();
    ctx.rect(GRID.x, GRID.y, GRID.size, GRID.size);
    ctx.clip();

    // Fill grid background solid (gap color) – hides background image in gaps
    ctx.fillStyle = '#111111';
    ctx.fillRect(GRID.x, GRID.y, GRID.size, GRID.size);

    // Draw cells
    // Disable image smoothing for sharp pixel edges
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < totalWeeks; i++) {
      const col = i % side;
      const row = Math.floor(i / side);
      const cx = gridOffsetX + col * (cellSize + gap);
      const cy = gridOffsetY + row * (cellSize + gap);

      const weekStart = new Date(birth.getTime() + i * MS_PER_WEEK);
      const isOrban = C.isWeekOrban(weekStart);

      ctx.fillStyle = isOrban ? COLOR_ORBAN : COLOR_FREE;
      ctx.fillRect(cx, cy, cellSize, cellSize);
    }

    // Markers drawn AFTER all cells
    // First week: white filled circle
    const fx = gridOffsetX;
    const fy = gridOffsetY;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(
      fx + cellSize / 2,
      fy + cellSize / 2,
      Math.max(2, cellSize * 0.28),
      0, Math.PI * 2
    );
    ctx.fill();

    // Current (last) week: white X
    if (totalWeeks > 1) {
      const lastCol = (totalWeeks - 1) % side;
      const lastRow = Math.floor((totalWeeks - 1) / side);
      const lx = gridOffsetX + lastCol * (cellSize + gap);
      const ly = gridOffsetY + lastRow * (cellSize + gap);
      const pad = Math.max(2, cellSize * 0.22);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, cellSize * 0.12);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lx + pad, ly + pad);
      ctx.lineTo(lx + cellSize - pad, ly + cellSize - pad);
      ctx.moveTo(lx + cellSize - pad, ly + pad);
      ctx.lineTo(lx + pad, ly + cellSize - pad);
      ctx.stroke();
    }

    ctx.restore(); // remove clip

    // 3) Percentage text
    ctx.font = PCT.font;
    ctx.fillStyle = PCT.color;
    ctx.textAlign = PCT.align;
    ctx.textBaseline = PCT.baseline;
    ctx.fillText(`${percent}%`, PCT.x, PCT.y);

    // 4) Footer text (mixed colors)
    ctx.font = FOOT.font;
    ctx.textAlign = 'left';
    ctx.textBaseline = FOOT.baseline;

    // Line 1: "Életem X hetéből  Y héten"
    drawMixedText(ctx, [
      { text: `Életem ${C.formatNumber(counts.totalWeeks)} hetéből  `, color: FOOT.colorDefault },
      { text: `${C.formatNumber(counts.orbanWeeks)} héten`, color: FOOT.colorHighlight }
    ], FOOT.x, FOOT.y1);

    // Line 2: "Orbán Viktor volt a miniszterelnök."
    drawMixedText(ctx, [
      { text: 'Orbán Viktor ', color: FOOT.colorHighlight },
      { text: 'volt a miniszterelnök.', color: FOOT.colorDefault }
    ], FOOT.x, FOOT.y2);

    return canvas;
  }

  // ============================================
  // Analytics: virtual pageview for CF Web Analytics
  // ============================================
  function trackVirtualPageview(path) {
    try {
      if (window.__cfBeacon && window.__cfBeacon.spa) {
        // CF beacon SPA mode – trigger via history
        history.pushState(null, '', path);
        history.replaceState(null, '', location.pathname + location.hash);
      }
    } catch (e) {
      // silent fail – analytics should never break the app
    }
  }

  // ============================================
  // Render share section
  // ============================================
  function renderShareSection(birthDate, orbanResult) {
    const section = document.getElementById('share-section');
    if (!section) return;

    const percent = Math.round(orbanResult.percent);

    section.innerHTML = `
      <div class="share-intro">
        <div class="share-intro__inner">
          <h2 class="section__title">OSZD MEG AZ EREDMÉNYT</h2>
          <ol class="share-steps">
            <li><strong>Töltsd le</strong> az eredményedet mutató képet.</li>
            <li><strong>Posztold</strong> Facebookra, Instagramra, TikTokra – bárhová.</li>
            <li><strong>Írd mellé</strong> a véleményed + ezt: „Számold ki a sajátodat: <span class="share-steps__url">tuladagolas.hu</span>"</li>
          </ol>
        </div>
      </div>

      <div class="container share-container">
        <div class="share-card" id="share-card">
          <div class="share-card__loading">Kép generálása...</div>
        </div>

        <button type="button" class="btn btn--primary btn--block btn--large" id="download-btn" disabled>
          ⬇ Kép letöltése
        </button>

        <button type="button" class="btn btn--outline btn--block" id="share-link">
          🔗 Link másolása (tuladagolas.hu)
        </button>
      </div>
    `;

    // Generate badge canvas and insert as preview
    const cardEl = document.getElementById('share-card');
    const downloadBtn = document.getElementById('download-btn');

    generateBadge(birthDate, orbanResult)
      .then((canvas) => {
        canvas.id = 'badge-canvas';
        cardEl.innerHTML = '';
        cardEl.appendChild(canvas);
        downloadBtn.disabled = false;

        // Wire download
        downloadBtn.addEventListener('click', () => {
          canvas.toBlob((blob) => {
            if (!blob) {
              alert('Nem sikerült a kép generálása.');
              return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tuladagolas-eletem-${percent}szazalek.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            // Track download as virtual pageview for CF Web Analytics
            trackVirtualPageview('/download');
          }, 'image/png');
        });
      })
      .catch((err) => {
        console.error('Badge generation failed:', err);
        cardEl.innerHTML = '<p style="color:var(--text-secondary);text-align:center;">Nem sikerült a kép generálása.</p>';
        downloadBtn.hidden = true;
      });

    // Link copy
    const linkBtn = document.getElementById('share-link');
    linkBtn.addEventListener('click', async () => {
      const originalText = linkBtn.textContent;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(SITE_URL);
        } else {
          const ta = document.createElement('textarea');
          ta.value = SITE_URL;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        linkBtn.textContent = 'Másolva! ✓';
        trackVirtualPageview('/link-copy');
      } catch (err) {
        linkBtn.textContent = 'Hiba 😞';
      }
      setTimeout(() => { linkBtn.textContent = originalText; }, 2000);
    });
  }

  // ============================================
  // Export
  // ============================================
  window.Share = {
    renderShareSection
  };
})();
