/* ============================================ */
/* calculator.js                                */
/* Pure calculation functions                   */
/* ============================================ */

(function () {
  'use strict';

  // ============================================
  // Konstansok
  // ============================================
  const ORBAN_PERIODS = [
    { start: '1998-07-06', end: '2002-05-27', cycle: 1 },
    { start: '2010-05-29', end: '2014-05-09', cycle: 2 },
    { start: '2014-05-10', end: '2018-05-17', cycle: 3 },
    { start: '2018-05-18', end: '2022-05-15', cycle: 4 },
    { start: '2022-05-16', end: '2026-05-20', cycle: 5 }
  ].map((p) => ({
    start: new Date(p.start),
    end: new Date(p.end),
    cycle: p.cycle
  }));

  const ELECTIONS = [
    '1990-03-25', '1994-05-08', '1998-05-10',
    '2002-04-07', '2006-04-09', '2010-04-11',
    '2014-04-06', '2018-04-08', '2022-04-03',
    '2026-04-12'
  ].map((d) => new Date(d));

  const ELECTION_DATE = new Date('2026-04-12T00:00:00');
  const VOTING_AGE_CUTOFF = new Date('2008-04-12');

  const MS_PER_DAY = 86400000;

  // ============================================
  // Segédek
  // ============================================
  function toDate(input) {
    if (input instanceof Date) return input;
    return new Date(input);
  }

  function startOfDay(d) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function diffDays(a, b) {
    const da = startOfDay(a).getTime();
    const db = startOfDay(b).getTime();
    return Math.floor((db - da) / MS_PER_DAY);
  }

  function maxDate(a, b) {
    return a > b ? a : b;
  }

  function minDate(a, b) {
    return a < b ? a : b;
  }

  // ============================================
  // calculateAge
  // ============================================
  function calculateAge(birthDate) {
    const birth = toDate(birthDate);
    const today = new Date();
    const days = Math.max(0, diffDays(birth, today));
    const weeks = Math.floor(days / 7);

    let years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      years--;
    }
    years = Math.max(0, years);

    return { days, weeks, years };
  }

  // ============================================
  // calculateOrbanDays
  // ============================================
  function calculateOrbanDays(birthDate) {
    const birth = toDate(birthDate);
    const today = new Date();
    const totalDays = Math.max(0, diffDays(birth, today));

    let orbanDays = 0;
    const cycles = [];

    ORBAN_PERIODS.forEach((period) => {
      const overlapStart = maxDate(birth, period.start);
      const overlapEnd = minDate(today, period.end);

      if (overlapEnd > overlapStart) {
        const days = diffDays(overlapStart, overlapEnd);
        if (days > 0) {
          orbanDays += days;
          cycles.push({ cycle: period.cycle, days });
        }
      }
    });

    const percent = totalDays > 0 ? (orbanDays / totalDays) * 100 : 0;

    return {
      orbanDays,
      totalDays,
      percent,
      percentRounded: Math.round(percent),
      cycles
    };
  }

  // ============================================
  // calculateFunFacts
  // ============================================
  function calculateFunFacts(birthDate) {
    const birth = toDate(birthDate);
    const today = new Date();
    const days = Math.max(0, diffDays(birth, today));

    // Szívverések: átlagosan 100/perc
    const heartbeats = days * 24 * 60 * 100;

    // Megtett út a Nap körül: átlagos pálya ~940 millió km / év
    const kmAroundSun = Math.round((days / 365.25) * 940_000_000);

    // Lélegzetvételek: átlagosan 16/perc
    const breaths = days * 24 * 60 * 16;

    // Választások, amelyek a felhasználó élete alatt történtek (múltbeliek,
    // beleértve a születési napot és a mai napot)
    const electionsLived = ELECTIONS.filter((d) => {
      return d >= startOfDay(birth) && d <= startOfDay(today);
    }).length;

    // Orbán-kormányok száma: ciklusok, amelyek legalább 1 napot átfednek
    // a [birth, today] intervallummal
    const orbanGovernments = ORBAN_PERIODS.filter((p) => {
      const overlapStart = maxDate(birth, p.start);
      const overlapEnd = minDate(today, p.end);
      return diffDays(overlapStart, overlapEnd) > 0;
    }).length;

    return {
      days,
      heartbeats,
      kmAroundSun,
      breaths,
      electionsLived,
      orbanGovernments
    };
  }

  // ============================================
  // canVote
  // ============================================
  function canVote(birthDate) {
    const birth = startOfDay(toDate(birthDate));
    return birth <= VOTING_AGE_CUTOFF;
  }

  // ============================================
  // getCountdown
  // ============================================
  function getCountdown() {
    const now = new Date();
    const diff = ELECTION_DATE.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    const days = Math.floor(diff / MS_PER_DAY);
    const hours = Math.floor((diff % MS_PER_DAY) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return { days, hours, minutes, seconds, isPast: false };
  }

  // ============================================
  // isWeekOrban – hét közepe (kedd) dátuma alapján
  // ============================================
  function isWeekOrban(weekStartDate) {
    // Hét közepe: +3 nap a kezdettől (ha vasárnap a kezdet, szerda lesz;
    // ha hétfő, csütörtök – mindenképp a hét közepe tájára esik)
    const mid = new Date(weekStartDate);
    mid.setDate(mid.getDate() + 3);
    const midTime = startOfDay(mid).getTime();

    return ORBAN_PERIODS.some((p) => {
      return midTime >= startOfDay(p.start).getTime() &&
             midTime <= startOfDay(p.end).getTime();
    });
  }

  // Visszaadja, melyik Orbán-ciklus érvényes egy adott dátumra, vagy null
  function getCycleForDate(date) {
    const t = startOfDay(toDate(date)).getTime();
    for (const p of ORBAN_PERIODS) {
      if (t >= startOfDay(p.start).getTime() && t <= startOfDay(p.end).getTime()) {
        return p.cycle;
      }
    }
    return null;
  }

  // ============================================
  // Formázók
  // ============================================
  const nfHu = new Intl.NumberFormat('hu-HU');

  function formatNumber(n) {
    return nfHu.format(Math.round(n));
  }

  function formatBigNumber(n) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) {
      return '~' + (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' milliárd';
    }
    if (abs >= 1_000_000) {
      return '~' + (n / 1_000_000).toFixed(1).replace('.', ',') + ' millió';
    }
    if (abs >= 1_000) {
      return nfHu.format(Math.round(n));
    }
    return nfHu.format(Math.round(n));
  }

  // ============================================
  // Dátum formázás (tooltip és megjelenítés)
  // ============================================
  const dateFormatterHu = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  function formatDateHu(date) {
    return dateFormatterHu.format(toDate(date));
  }

  // ============================================
  // Export
  // ============================================
  window.Calculator = {
    ORBAN_PERIODS,
    ELECTIONS,
    ELECTION_DATE,
    VOTING_AGE_CUTOFF,
    diffDays,
    calculateAge,
    calculateOrbanDays,
    calculateFunFacts,
    canVote,
    getCountdown,
    isWeekOrban,
    getCycleForDate,
    formatNumber,
    formatBigNumber,
    formatDateHu
  };
})();
