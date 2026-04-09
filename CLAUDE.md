# CLAUDE.md – tuladagolas.hu

## Projekt áttekintés

A **tuladagolas.hu** egy magyar nyelvű politikai kalkulátor-weboldal, amely a felhasználó születési dátuma alapján kiszámítja, életének hány százalékát töltötte Orbán Viktor miniszterelnöksége alatt. A cél: a fiatal választópolgárok mobilizálása a **2026. április 12-i országgyűlési választásra**.

**Hangvétel:** Érzelmileg erős, drámai, adatvezérelt. A végén pozitív, cselekvésre ösztönző.

---

## Tech Stack

| Réteg | Technológia |
|---|---|
| Frontend | Vanilla HTML + CSS + JavaScript (no framework) |
| Képgenerálás | html2canvas (CDN) |
| Analitika | Cloudflare Web Analytics (beacon snippet) |
| Hosting | Cloudflare Pages (static site, no build step) |
| Domain | tuladagolas.hu → Cloudflare DNS |
| Verziókezelés | Git + GitHub repo |

### Miért vanilla?
- Nincs build step → azonnali Cloudflare Pages deploy
- Egyszerű, gyorsan iterálható
- Kalkulátor-jellegű oldalhoz nem kell framework

---

## Fájlstruktúra

```
tuladagolas.hu/
├── CLAUDE.md
├── index.html              # Landing page + eredmény oldal (SPA)
├── css/
│   └── style.css           # Teljes stíluslap
├── js/
│   ├── app.js              # Fő alkalmazáslogika, routing
│   ├── calculator.js       # Összes kalkuláció
│   ├── grid.js             # "Life in Weeks" grid renderelés
│   └── share.js            # Képgenerálás + megosztás
├── assets/
│   ├── OV-tabletta_01.png  # Tabletta logó/hero kép
│   ├── og-image.png        # Open Graph kép (1200×630)
│   └── favicon.ico
├── _headers                # Cloudflare Pages headers (cache, security)
└── _redirects              # Cloudflare Pages redirects (ha kell)
```

---

## Design rendszer

### Színek

```css
:root {
  /* Fő színek */
  --orban-orange: #FF6B00;
  --orban-orange-light: #FF8C33;
  --orban-orange-glow: rgba(255, 107, 0, 0.3);

  /* Háttér – sötét, drámai */
  --bg-dark: #0A0A0A;
  --bg-dark-secondary: #141414;
  --bg-card: #1A1A1A;

  /* Szöveg */
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0A0;
  --text-muted: #666666;

  /* Grid színek */
  --grid-orban: var(--orban-orange);
  --grid-free: #2A2A2A;
  --grid-border: #333333;

  /* Pozitív záró szekció */
  --bg-light: #FAFAFA;
  --text-dark: #1A1A1A;
  --cta-green: #00C853;
  --cta-green-hover: #00E676;

  /* Állapotok */
  --error: #FF3D3D;
}
```

### Tipográfia

- **Címek:** Inter (Google Fonts), font-weight: 900
- **Szövegtörzs:** Inter, font-weight: 400 / 600
- **Statisztikák / nagy számok:** font-variant-numeric: tabular-nums
- Google Fonts import: `Inter:wght@400;600;700;900`

### Reszponzivitás

- **Mobile-first** megközelítés
- Breakpoints: 480px / 768px / 1024px / 1280px
- A grid mobilon kisebb cellákkal, de ugyanúgy működjön
- Érintés-barát gombok (min. 44×44px tap target)

---

## Oldalszerkezet

### 1. Landing Page (`#landing`)

#### 1.1 Header
- Tabletta logó (OV-tabletta_01.png) bal oldalon, kisméretű
- "tuladagolas.hu" szöveg mellette

#### 1.2 Hero szekció
- Nagy tabletta kép, középen (hero elem)
- Főcím: **"Túladagolás"** (nagy, drámai tipográfia)
- Alcím: rövid, megragadó, pl. "Mennyi Orbán van az életedben?"
- **Születési dátum beviteli mező** (natív date input, mobilbarát)
- "Számold ki!" CTA gomb (narancssárga)

#### 1.3 Bemutatkozás szekció
- Szöveg: a szerző a Miskolci Egyetem docense; ha megint a Fidesz nyer, 2 éven belül olyan hallgatók kezdenek, akiknek születésükkor is Orbán volt a miniszterelnök; ezer ok van leváltani, de ez önmagában is elég.
- Aláírás: **[PLACEHOLDER: Szerző neve, beosztás, Miskolci Egyetem]**
  - A szerzőnek ezt saját magának kell beírnia.

#### 1.4 "Ezer ok" linkgyűjtemény
- 5–6 kártya, CSS grid layout (2×3 vagy 3×2)
- Mindegyik kártya: indexkép + cím + rövid leírás + külső link (target="_blank")
- **[PLACEHOLDER: URL-ek, képek, címek később töltendők]**
- Készítsünk egy egyszerű adatstruktúrát a JS-ben, ami alapján a kártyák generálódnak:
```javascript
const RESOURCE_LINKS = [
  {
    title: "Placeholder cím",
    description: "Rövid leírás",
    url: "https://example.com",
    thumbnail: "assets/thumb-placeholder.jpg"
  },
  // ... 5-6 elem
];
```

---

### 2. Eredmény oldal (`#results`)

Az oldal a dátum beküldése után jelenik meg. SPA-logika: a `#landing` szekció elrejtése, `#results` megjelenítése. Smooth scroll az oldal tetejére.

#### 2.1 Visszaszámlálás a választásig
- **Csak ha 2026. április 12. még nem múlt el**
- Drámai, nagy számok: X nap Y óra Z perc a választásig
- Élő visszaszámlálás (setInterval, másodperces frissítés)
- Ha a választás már elmúlt: ezt a szekciót ne jelenítsd meg

#### 2.2 Fun fact statisztikák
Animált számok (count-up effekt, IntersectionObserver triggerrel):

| Statisztika | Számítás | Megjelenítés |
|---|---|---|
| Életkorod napokban | `Math.floor((now - birth) / 86400000)` | "X nap" |
| Szívverések | `days × 24 × 60 × 100` | "~X milliárd" |
| Megtett út a Nap körül | `days / 365.25 × 940_000_000` | "X millió km" |
| Lélegzetvételek | `days × 24 × 60 × 16` | "~X millió" |
| Magyar ogy. választások az életedben | Programozott lista | "X választás" |
| Orbán-kormányok száma | Ciklusok overlap | "X kormány" |

Formázás: magyar lokalizáció, ezres elválasztó (szóköz), kerekítés.

#### 2.3 FŐ STATISZTIKA – Orbán-százalék
- **"Az életed X%-a Orbán-kormányzás alatt telt el."**
- Az X% legyen óriási, narancssárga, vizuálisan domináns
- Count-up animáció 0%-tól X%-ig
- Alatta kisebb betűvel: "Ez Y nap a Z napodból."

#### 2.4 "Life in Weeks" grid (Az életed hetekben)
- Minden cella = 1 hét
- **Narancssárga (#FF6B00):** Orbán-kormányzás alatti hét
- **Sötétszürke (#2A2A2A):** Minden más hét
- Elrendezés: sorok = évek, oszlopok = hetek (52 oszlop/sor)
- **Csak az eddigi élet** (nem a teljes várható élettartam)
- Az utolsó sor lehet töredékes (nem feltétlenül 52 hét)
- Évszám-jelölés a sorok mellett (minden 5. vagy 10. év)
- Hover/tap: tooltip a dátummal és állapottal
- Jelmagyarázat: ■ Orbán-kormányzás | ■ Egyéb időszak
- CSS Grid vagy Canvas – CSS Grid preferált a tooltipek miatt

#### 2.5 Megosztás szekció

**Design referencia:** ottleszek0412.hu megosztási kártya mintájára.

Layout (fentről lefelé):

```
┌─────────────────────────────────────┐
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │   MEGOSZTHATÓ KÉP/KÁRTYA   │   │
│   │   (sötét háttér)            │   │
│   │                             │   │
│   │   ┌─ Grid (kicsi) ───────┐ │   │
│   │   │ ■■■■□□■■■■■■□□□□□□   │ │   │
│   │   │ ■■■■■■■■□□□□□□□□□□   │ │   │
│   │   └───────────────────────┘ │   │
│   │                             │   │
│   │   "Az életem 67%-a          │   │
│   │    Orbánt tartalmaz."       │   │
│   │                             │   │
│   │   🟠 tuladagolas.hu         │   │
│   └─────────────────────────────┘   │
│                                     │
│   "Oszd meg te is!"                 │
│                                     │
│   ┌──────────┐ ┌────┐ ┌─────────┐  │
│   │ Facebook │ │  X │ │ 🔗 Link │  │
│   └──────────┘ └────┘ └─────────┘  │
│                                     │
│   ┌─────────────────────────────┐   │
│   │    ⬇ Kép letöltése          │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Megosztható kártya** (`.share-card`):
- Sötét háttér (--bg-dark-secondary), lekerekített sarkok (border-radius: 16px)
- Tartalom:
  - "Life in Weeks" grid kompakt változata (kisebb cellák, nincs tooltip)
  - **"Az életem X%-a Orbánt tartalmaz."** – nagy, fehér szöveg, X% narancssárga kiemelés
  - Alul: tabletta ikon + "tuladagolas.hu" branding
- Ez a div lesz a html2canvas capture target

**"Oszd meg te is!"** szöveg – centered, text-secondary szín

**Megosztás gombok** – 3 db, egymás mellett, egyenlő szélességű:
- Outlined stílus (border, nem filled), lekerekített sarkok
- `Facebook` | `X` | `🔗 Link`
- Facebook: `https://www.facebook.com/sharer/sharer.php?u=https://tuladagolas.hu`
- X: `https://twitter.com/intent/tweet?text=Az%20életem%20X%25-a%20Orbánt%20tartalmaz.%20Számold%20ki%20a%20sajátodat!&url=https://tuladagolas.hu`
- Link: `navigator.clipboard.writeText('https://tuladagolas.hu')` + "Másolva! ✓" feedback

**"Kép letöltése"** gomb:
- Teljes szélességű, filled, narancssárga (--orban-orange)
- Ikon: ⬇ letöltés ikon
- Kattintásra: html2canvas → `.share-card` → PNG → `tuladagolas-az-eletem.png` fájlnév

**html2canvas:**
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js`
- Lazy load: dinamikus `<script>` inject, csak amikor az eredményoldal megjelenik
- A `.share-card` div fix méretű legyen a képgeneráláshoz (pl. 600×800px vagy 1080×1080px – social media optimális)
- Fallback: ha html2canvas nem töltődik be, a "Kép letöltése" gomb rejtve marad

#### 2.6 Záró CTA szekció
- **Háttérszín: világos** (`--bg-light`) – éles kontraszt a sötét oldallal
- Vizuális váltás: a sötétből világosba átmenet szimbolizálja a reményt

**18+ felhasználóknak** (szavazhatnak 2026.04.12-én):
- Nagy cím: **"Szavazz április 12-én!"**
- Visszaszámlálás (kompakt)
- Motiváló szöveg: "A te szavazatod számít. Változtass!"
- Megosztás gombok (ismétlés)

**18 alatt** (NEM szavazhatnak):
- "Te még nem szavazhatsz, de a hangod így is számít!"
- "Oszd meg azokkal, akik igen!"
- Megosztás gombok

### Szavazójog logika
```
A 2026.04.12-i választáson az szavazhat, aki legkésőbb
2026.04.12-én betölti a 18. életévét.
→ birthDate <= 2008-04-12
```

---

## Orbán Viktor miniszterelnöki időszakai

```javascript
const ORBAN_PERIODS = [
  { start: '1998-07-06', end: '2002-05-27', cycle: 1 },
  { start: '2010-05-29', end: '2014-05-09', cycle: 2 },
  { start: '2014-05-10', end: '2018-05-17', cycle: 3 },
  { start: '2018-05-18', end: '2022-05-15', cycle: 4 },
  { start: '2022-05-16', end: '2026-05-20', cycle: 5 },
];
```

> **Megjegyzés:** Az 5. ciklus végdátuma becsült (az új kormány megalakulásáig).
> A számítás a `min(mai nap, ciklus vége)` logikát használja.

---

## Magyar országgyűlési választások listája (fun fact-hez)

```javascript
const ELECTIONS = [
  '1990-03-25', '1994-05-08', '1998-05-10',
  '2002-04-07', '2006-04-09', '2010-04-11',
  '2014-04-06', '2018-04-08', '2022-04-03',
  '2026-04-12',
];
```

---

## Kalkulációs logika

### Orbán-százalék
```
orbánNapok = 0
FOR EACH period IN ORBAN_PERIODS:
  overlapStart = max(birthDate, period.start)
  overlapEnd = min(today, period.end)
  IF overlapEnd > overlapStart:
    orbánNapok += diffInDays(overlapStart, overlapEnd)

totalDays = diffInDays(birthDate, today)
orbanPercent = (orbánNapok / totalDays) × 100
```

### Szavazójog
```
canVote = birthDate <= new Date('2008-04-12')
```

### Input validáció
- Min.: 1920-01-01
- Max.: mai nap
- Jövőbeli dátum → hibaüzenet: "Még nem születtél meg! 😉"
- Érvénytelen formátum → hibaüzenet

---

## SEO & Open Graph

```html
<title>Túladagolás – Mennyi Orbán van az életedben?</title>
<meta name="description" content="Számold ki, életed hány százalékát töltötted Orbán Viktor miniszterelnöksége alatt. Szavazz 2026. április 12-én!">

<!-- Open Graph -->
<meta property="og:title" content="Túladagolás – Mennyi Orbán van az életedben?">
<meta property="og:description" content="Számold ki, életed hány százalékát töltötted Orbán Viktor miniszterelnöksége alatt.">
<meta property="og:image" content="https://tuladagolas.hu/assets/og-image.png">
<meta property="og:url" content="https://tuladagolas.hu">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">

<!-- Twitter/X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Túladagolás – Mennyi Orbán van az életedben?">
<meta name="twitter:description" content="Számold ki a sajátodat!">
<meta name="twitter:image" content="https://tuladagolas.hu/assets/og-image.png">
```

---

## Teljesítmény

- Lighthouse: 90+ minden kategóriában
- First Contentful Paint: < 1.5s
- Teljes méret: < 500KB (képek nélkül)
- html2canvas: lazy load (dinamikus script inject az eredményoldalon)
- Képek: lazy loading (`loading="lazy"`) az "ezer ok" szekcióban
- CSS/JS: minified a production deployban (opcionális, Cloudflare auto-minify)

---

## Akadálymentesség

- Szemantikus HTML5 elemek (header, main, section, footer, nav)
- `aria-label` a grid cellákon
- Billentyűzet-navigáció: Tab/Enter a fő interakciókhoz
- Színkontraszt: WCAG AA
- `prefers-reduced-motion`: animációk kikapcsolása
- `prefers-color-scheme`: nem releváns (fixed dark theme)

---

## Cloudflare Pages Deployment

1. GitHub repo létrehozása (pl. `tuladagolas-hu`)
2. Cloudflare Pages → Create project → Connect GitHub
3. Build settings: Framework preset = None, Build command = (üres), Output directory = `/`
4. Custom domain: tuladagolas.hu
5. DNS: Cloudflare DNS-re irányítás (CNAME a Cloudflare Pages-re)

### `_headers` fájl
```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### Cloudflare Web Analytics
```html
<!-- Az index.html végére, </body> elé -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
  data-cf-beacon='{"token": "PLACEHOLDER_TOKEN"}'></script>
```

---

## Fejlesztési konvenciók

- **Magyar nyelv** minden UI szövegben
- **Angol nyelv** a kódban (változónevek, függvénynevek, kommentek)
- CSS: BEM-jellegű (`.grid__cell`, `.grid__cell--orban`, `.hero__title`)
- JS: ES6+ szintaxis, `const`/`let`, arrow functions, template literals
- Moduláris JS: minden fájl egy felelősségi körrel
- Dátumkezelés: natív `Date` API – nincs szükség external library-re
- Számformázás: `Intl.NumberFormat('hu-HU')` 
- Nincs jQuery, nincs lodash, nincs semmi extra dependency (html2canvas kivétel)

---

## Tesztelési checklist

- [ ] Születési dátum: 2008-04-12 → éppen szavazhat (boundary case)
- [ ] Születési dátum: 2008-04-13 → NEM szavazhat
- [ ] Születési dátum: 1998-07-06 → Orbán 1. ciklus indulása
- [ ] Születési dátum: 1990-01-01 → több ciklus átfedés
- [ ] Születési dátum: 2020-01-01 → fiatal, magas Orbán%
- [ ] Születési dátum: 1950-01-01 → idős, sok hét a gridben
- [ ] Mobil nézet: grid olvasható, gombok tapelhetők
- [ ] Megosztás: FB/X linkek működnek, kép generálódik
- [ ] html2canvas: a generált kép tartalmazza a gridet + szöveget

---

## TODO / Placeholder-ek (a szerzőnek kell kitöltenie)

- [ ] `[PLACEHOLDER: Szerző neve, beosztás]` – bemutatkozás szekció
- [ ] `[PLACEHOLDER: "Ezer ok" URL-ek és indexképek]` – linkgyűjtemény
- [ ] `OV-tabletta_01.png` – végleges verzió az assets/ mappába
- [ ] `og-image.png` (1200×630) – Open Graph kép elkészítése
- [ ] `favicon.ico` – honlap ikon
- [ ] Cloudflare Web Analytics token beillesztése
- [ ] Záró CTA szövegek végleges megfogalmazása
- [ ] Bemutatkozás szöveg végleges változata
