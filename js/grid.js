/* ============================================ */
/* grid.js                                      */
/* Life in Weeks grid renderer                  */
/* ============================================ */

(function () {
  'use strict';

  const WEEKS_PER_ROW = 52;
  const MS_PER_WEEK = 7 * 86400000;

  /**
   * Renders a "Life in Weeks" grid into the given container.
   * @param {Date|string} birthDate
   * @param {HTMLElement} container
   * @param {Object} options
   * @param {boolean} [options.compact=false] – kisebb cellák, share kártyához
   * @param {boolean} [options.showTooltip=true]
   * @param {boolean} [options.showYearLabels=true]
   */
  function renderLifeGrid(birthDate, container, options) {
    if (!container) return;
    options = options || {};
    const compact = !!options.compact;
    const showTooltip = options.showTooltip !== false && !compact;

    const C = window.Calculator;
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
    const today = new Date();

    // Clear
    container.innerHTML = '';
    container.classList.add('life-grid');
    if (compact) container.classList.add('life-grid--compact');
    else container.classList.remove('life-grid--compact');

    const totalDays = Math.max(0, Math.floor((today - birth) / 86400000));
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

    // Négyzet-grid minden módban:
    // cols = rows = ceil(√hetek), így a grid mindig kvadratikus,
    // a cellák szintén négyzetek, és kitöltik a rendelkezésre álló teret.
    // Fiatalabb → kevesebb cella → nagyobb cellák.
    // Idősebb → több cella → kisebb cellák.
    const side = Math.max(1, Math.ceil(Math.sqrt(totalWeeks)));
    container.style.setProperty('--grid-cols', side);

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(birth.getTime() + i * MS_PER_WEEK);
      const isOrban = C.isWeekOrban(weekStart);

      const cell = document.createElement('div');
      let cls = 'grid-cell' + (isOrban ? ' grid-cell--orban' : '');
      if (i === 0) cls += ' grid-cell--first';
      if (i === totalWeeks - 1) cls += ' grid-cell--current';
      cell.className = cls;

      if (showTooltip) {
        // data attributes for tooltip
        cell.dataset.date = weekStart.toISOString().slice(0, 10);
        cell.dataset.orban = isOrban ? '1' : '0';
        if (isOrban) {
          const cycle = C.getCycleForDate(weekStart) ||
                        C.getCycleForDate(new Date(weekStart.getTime() + 3 * 86400000));
          if (cycle) cell.dataset.cycle = cycle;
        }
      }
      fragment.appendChild(cell);
    }

    container.appendChild(fragment);

    // Tooltip (delegated listeners – a single pair per render)
    if (showTooltip) {
      attachTooltip(container);
    }
  }

  // ============================================
  // Tooltip – delegált eseménykezelés
  // ============================================
  function attachTooltip(container) {
    // Remove any previous tooltip listeners by cloning -> skip; instead,
    // use a single tooltip element appended to body once
    let tooltip = document.getElementById('grid-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'grid-tooltip';
      tooltip.className = 'grid-tooltip';
      tooltip.hidden = true;
      document.body.appendChild(tooltip);
    }

    // Avoid double-binding
    if (container.dataset.tooltipBound === '1') return;
    container.dataset.tooltipBound = '1';

    const C = window.Calculator;

    function show(cell, clientX, clientY) {
      const dateStr = cell.dataset.date;
      const isOrban = cell.dataset.orban === '1';
      const cycle = cell.dataset.cycle;

      if (!dateStr) return;

      const weekStart = new Date(dateStr);
      const rangeLabel = C.formatWeekRange(weekStart);
      let stateLabel = 'más kormány';
      if (isOrban) {
        const cycleNum = parseInt(cycle, 10);
        stateLabel = (cycleNum && C.CYCLE_NAMES[cycleNum - 1]) || 'Orbán-kormány';
      }

      tooltip.textContent = `${rangeLabel} – ${stateLabel}`;
      tooltip.hidden = false;

      // Position (viewport coordinates) – clamp to screen edges
      const rect = tooltip.getBoundingClientRect();
      let left = clientX + 12;
      let top = clientY + 12;
      if (left + rect.width > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - rect.width - 12);
      }
      if (left < 12) left = 12;
      if (top + rect.height > window.innerHeight - 12) {
        top = clientY - rect.height - 12;
      }
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }

    function hide() {
      tooltip.hidden = true;
    }

    container.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('.grid-cell');
      if (cell) show(cell, e.clientX, e.clientY);
    });

    container.addEventListener('mousemove', (e) => {
      const cell = e.target.closest('.grid-cell');
      if (cell) show(cell, e.clientX, e.clientY);
    });

    container.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget || !container.contains(e.relatedTarget)) {
        hide();
      } else if (!e.relatedTarget.classList.contains('grid-cell')) {
        hide();
      }
    });

    // Touch: tap to show for 2s
    container.addEventListener('click', (e) => {
      const cell = e.target.closest('.grid-cell');
      if (!cell) return;
      const rect = cell.getBoundingClientRect();
      show(cell, rect.left + rect.width / 2, rect.top);
      clearTimeout(container._tooltipTimeout);
      container._tooltipTimeout = setTimeout(hide, 2000);
    });
  }

  // ============================================
  // Export
  // ============================================
  window.Grid = {
    renderLifeGrid
  };
})();
