/* ============================================ */
/* share.js                                     */
/* html2canvas lazy loader + social sharing     */
/* ============================================ */

(function () {
  'use strict';

  const SITE_URL = 'https://tuladagolas.hu';
  const H2C_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

  let h2cPromise = null;

  // ============================================
  // html2canvas lazy loader
  // ============================================
  function loadHtml2Canvas() {
    if (h2cPromise) return h2cPromise;
    h2cPromise = new Promise((resolve, reject) => {
      if (window.html2canvas) {
        resolve(window.html2canvas);
        return;
      }
      const script = document.createElement('script');
      script.src = H2C_URL;
      script.async = true;
      script.onload = () => {
        if (window.html2canvas) resolve(window.html2canvas);
        else reject(new Error('html2canvas loaded but not defined'));
      };
      script.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(script);
    });
    return h2cPromise;
  }

  // ============================================
  // Render share section (called from app.js on showResults)
  // ============================================
  function renderShareSection(birthDate, orbanResult) {
    const section = document.getElementById('share-section');
    if (!section) return;

    const percent = Math.round(orbanResult.percent);

    section.innerHTML = `
      <div class="container share-container">
        <div class="share-card" id="share-card">
          <div class="share-card__grid" id="share-card-grid"></div>
          <p class="share-card__text">
            Az életem <span class="share-card__percent">${percent}%</span>-a<br>
            Orbánt tartalmaz.
          </p>
          <div class="share-card__brand">
            <img src="assets/OV-tabletta_01.png" alt="" width="24" height="24">
            <span>tuladagolas.hu</span>
          </div>
        </div>

        <p class="share-title">Oszd meg te is!</p>

        <div class="share-buttons">
          <button type="button" class="btn btn--outline share-btn" id="share-facebook">
            Facebook
          </button>
          <button type="button" class="btn btn--outline share-btn" id="share-twitter">
            X
          </button>
          <button type="button" class="btn btn--outline share-btn" id="share-link">
            🔗 Link
          </button>
        </div>

        <button type="button" class="btn btn--primary btn--block btn--large" id="download-btn">
          ⬇ Kép letöltése
        </button>
      </div>
    `;

    // Render compact grid in share card
    if (window.Grid && typeof window.Grid.renderLifeGrid === 'function') {
      const gridEl = document.getElementById('share-card-grid');
      window.Grid.renderLifeGrid(birthDate, gridEl, { compact: true, showTooltip: false });
    }

    // Share text
    const shareText = `Az életem ${percent}%-a Orbánt tartalmaz. Számold ki a sajátodat!`;

    // Facebook
    document.getElementById('share-facebook').addEventListener('click', () => {
      const url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(SITE_URL);
      window.open(url, '_blank', 'noopener,width=600,height=500');
    });

    // X (Twitter)
    document.getElementById('share-twitter').addEventListener('click', () => {
      const url = 'https://twitter.com/intent/tweet?text=' +
        encodeURIComponent(shareText) +
        '&url=' + encodeURIComponent(SITE_URL);
      window.open(url, '_blank', 'noopener,width=600,height=500');
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
      } catch (err) {
        linkBtn.textContent = 'Hiba 😞';
      }
      setTimeout(() => { linkBtn.textContent = originalText; }, 2000);
    });

    // Download button – wire + preload html2canvas
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.addEventListener('click', () => downloadImage(percent));

    // Preload html2canvas in background; hide button if it fails
    loadHtml2Canvas().catch(() => {
      downloadBtn.hidden = true;
    });
  }

  // ============================================
  // Download image
  // ============================================
  async function downloadImage(percent) {
    const card = document.getElementById('share-card');
    const btn = document.getElementById('download-btn');
    if (!card || !btn) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Generálás...';

    try {
      const h2c = await loadHtml2Canvas();
      card.classList.add('share-card--capture');
      // Allow layout to settle
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = await h2c(card, {
        backgroundColor: '#141414',
        scale: 2,
        useCORS: true,
        logging: false
      });

      card.classList.remove('share-card--capture');

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
      }, 'image/png');
    } catch (err) {
      console.error('Download image failed:', err);
      alert('Nem sikerült a kép letöltése. Próbáld újra!');
      card.classList.remove('share-card--capture');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  // ============================================
  // Export
  // ============================================
  window.Share = {
    renderShareSection,
    loadHtml2Canvas
  };
})();
