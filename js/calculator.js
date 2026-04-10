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
  const ELECTION_START = new Date('2026-04-12T06:00:00');
  const ELECTION_END = new Date('2026-04-12T19:00:00');
  const VOTING_AGE_CUTOFF = new Date('2008-04-12');

  const CYCLE_NAMES = [
    'Első Orbán-kormány',
    'Második Orbán-kormány',
    'Harmadik Orbán-kormány',
    'Negyedik Orbán-kormány',
    'Ötödik Orbán-kormány'
  ];

  const HU_MONTH_NAMES = [
    'január', 'február', 'március', 'április', 'május', 'június',
    'július', 'augusztus', 'szeptember', 'október', 'november', 'december'
  ];

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
  //
  // Három üzemmód:
  //   'before'  – a szavazás kezdete (ápr. 12. 06:00) előtt
  //   'during'  – szavazás alatt (06:00–19:00): a végéig hátralévő idő
  //   'past'    – szavazás után (19:00 után)
  // ============================================
  function getCountdown() {
    const now = new Date();
    let target = null;
    let mode = 'past';

    if (now < ELECTION_START) {
      mode = 'before';
      target = ELECTION_START;
    } else if (now < ELECTION_END) {
      mode = 'during';
      target = ELECTION_END;
    }

    if (mode === 'past') {
      return { mode, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    const diff = target.getTime() - now.getTime();
    const days = Math.floor(diff / MS_PER_DAY);
    const hours = Math.floor((diff % MS_PER_DAY) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return { mode, days, hours, minutes, seconds, isPast: false };
  }

  // ============================================
  // calculateWeekCounts – a grid logikájával azonos hétszámlálás
  // (isWeekOrban minden héthez). Visszaadja a hetek teljes számát,
  // az Orbán-kormány alatti hetek számát, és a többit.
  // ============================================
  function calculateWeekCounts(birthDate) {
    const birth = toDate(birthDate);
    const today = new Date();
    const totalDays = Math.max(0, diffDays(birth, today));
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

    let orbanWeeks = 0;
    const MS_PER_WEEK = 7 * MS_PER_DAY;
    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(birth.getTime() + i * MS_PER_WEEK);
      if (isWeekOrban(weekStart)) orbanWeeks++;
    }

    return {
      totalWeeks,
      orbanWeeks,
      otherWeeks: totalWeeks - orbanWeeks
    };
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

  /**
   * Egy hét időtartamának formázása: weekStart .. weekStart + 6 nap
   * Példák:
   *   azonos hónap: "1991. március 10–16."
   *   hónaphatár:   "1991. március 28. – április 3."
   *   évhatár:      "1999. december 30. – 2000. január 5."
   */
  function formatWeekRange(weekStart) {
    const start = toDate(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const sY = start.getFullYear();
    const eY = end.getFullYear();
    const sM = start.getMonth();
    const eM = end.getMonth();
    const sD = start.getDate();
    const eD = end.getDate();

    if (sY === eY && sM === eM) {
      return `${sY}. ${HU_MONTH_NAMES[sM]} ${sD}–${eD}.`;
    }
    if (sY === eY) {
      return `${sY}. ${HU_MONTH_NAMES[sM]} ${sD}. – ${HU_MONTH_NAMES[eM]} ${eD}.`;
    }
    return `${sY}. ${HU_MONTH_NAMES[sM]} ${sD}. – ${eY}. ${HU_MONTH_NAMES[eM]} ${eD}.`;
  }

  /**
   * Visszaadja a ciklus nevét (pl. "Harmadik Orbán-kormány")
   * vagy null, ha a dátum nem esik egyik Orbán-ciklusba sem.
   */
  function getCycleNameForDate(date) {
    const cycle = getCycleForDate(date);
    if (!cycle) return null;
    return CYCLE_NAMES[cycle - 1] || null;
  }

  // ============================================
  // Export
  // ============================================
  window.Calculator = {
    ORBAN_PERIODS,
    ELECTIONS,
    ELECTION_DATE,
    ELECTION_START,
    ELECTION_END,
    VOTING_AGE_CUTOFF,
    CYCLE_NAMES,
    diffDays,
    calculateAge,
    calculateOrbanDays,
    calculateFunFacts,
    calculateWeekCounts,
    canVote,
    getCountdown,
    isWeekOrban,
    getCycleForDate,
    getCycleNameForDate,
    formatNumber,
    formatBigNumber,
    formatDateHu,
    formatWeekRange
  };
})();
