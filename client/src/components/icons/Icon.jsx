/**
 * Icon — the whole icon set for the noir detective rebrand.
 *
 * Hand-rolled inline SVG. No icon-library dependency, no emoji.
 * Every glyph is drawn on a 24x24 grid, stroked with currentColor so the
 * colour always comes from CSS (a semantic token, never a literal).
 *
 * Usage
 *   <Icon name="crown" size={28} />
 *   <Icon name="clock" className="timer__icon" />
 *   <Icon name="door-open" title="Leave room" />     <- announced to AT
 *   <Icon name="mask" aria-label="Your role" />      <- or label it yourself
 *
 * An unknown name renders nothing rather than a broken box, so a typo
 * degrades quietly instead of shipping an empty square to production.
 *
 * Styling: colour comes from `color`, so a parent rule like
 *   .role-card__icon { color: var(--role-king); }
 * is all that is needed. The `icon` base class is always applied; pass
 * className to add your own.
 *
 * Names: users, user, user-plus, plus, arrow-right, arrow-left, check, x,
 * copy, refresh, play, send, dots, crown, gem, shield, mask, fingerprint,
 * magnify, search, door-open, key, lock, clock, hourglass, chat, smile, eye,
 * eye-off, coin, flame, trophy, gavel, scale, alert, info, skull, moon, sun.
 */

const GLYPHS = {
  /* ---- people ---- */

  users: (
    <>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.25a3.25 3.25 0 0 1 0 5.9" />
      <path d="M17.6 14.5A6 6 0 0 1 21.5 20" />
    </>
  ),

  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),

  "user-plus": (
    <>
      <circle cx="9.5" cy="8" r="3.25" />
      <path d="M3 20.5a6.5 6.5 0 0 1 13 0" />
      <path d="M19 7.75v5.5M16.25 10.5h5.5" />
    </>
  ),

  /* ---- actions ---- */

  plus: <path d="M12 5v14M5 12h14" />,

  "arrow-right": (
    <path d="M4 12h15M13 6l6 6-6 6" />
  ),

  "arrow-left": (
    <path d="M20 12H5M11 6l-6 6 6 6" />
  ),

  check: (
    <path d="M4 12.5 9 17.5 20 6.5" />
  ),

  x: (
    <path d="M6 6l12 12M18 6L6 18" />
  ),

  copy: (
    <>
      <rect x="8.75" y="8.75" width="11.5" height="11.5" rx="1" />
      <path d="M15.25 8.75v-2a1.5 1.5 0 0 0-1.5-1.5H6.5A1.5 1.5 0 0 0 5 6.75V14a1.5 1.5 0 0 0 1.5 1.5h2.25" />
    </>
  ),

  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-8.5-8.5c2.35 0 4.6.94 6.25 2.59L20.5 8.25" />
      <path d="M20.5 3.5v4.75h-4.75" />
    </>
  ),

  play: (
    <path d="M8.25 5.25 19 12 8.25 18.75Z" />
  ),

  send: (
    <>
      <path d="M20.75 3.25 3.25 10.5l6.5 2.6 2.6 6.5L20.75 3.25Z" />
      <path d="M9.75 13.1 20.75 3.25" />
    </>
  ),

  dots: (
    <path d="M5.25 12h.01M12 12h.01M18.75 12h.01" />
  ),

  /* ---- roles ---- */

  /* King — three points, a band, one jewel. */
  crown: (
    <>
      <path d="M3.5 16.25 5 7.25 9.25 11 12 4.5 14.75 11 19 7.25 20.5 16.25Z" />
      <rect x="3.5" y="16.25" width="17" height="3.5" rx="0.75" />
      <path d="M12 16.95 13.05 18 12 19.05 10.95 18Z" />
    </>
  ),

  /* Queen — brilliant cut: table, girdle, pavilion facets. */
  gem: (
    <>
      <path d="M6 4.5h12l3 6-9 9.5L3 10.5z" />
      <path d="M3 10.5h18" />
      <path d="M6 4.5 8.5 10.5M12 4.5v6M18 4.5 15.5 10.5" />
      <path d="M8.5 10.5 12 20M15.5 10.5 12 20" />
    </>
  ),

  /* Police — outline quartered by a spine and a chief line. */
  shield: (
    <>
      <path d="M12 3.25 19.5 6v6.25c0 4.6-3.15 7.4-7.5 8.5-4.35-1.1-7.5-3.9-7.5-8.5V6z" />
      <path d="M12 3.25v17.5" />
      <path d="M4.5 10h15" />
    </>
  ),

  /* Thief — domed masquerade mask, two almond eye slits. */
  mask: (
    <>
      <path d="M2.75 9.75C2.75 6.9 6.8 4.5 12 4.5s9.25 2.4 9.25 5.25c0 5-4.15 10-9.25 10s-9.25-5-9.25-10Z" />
      <path d="M5 11.6c1-1.7 3.8-1.7 4.8 0-1 1.7-3.8 1.7-4.8 0Z" />
      <path d="M14.2 11.6c1-1.7 3.8-1.7 4.8 0-1 1.7-3.8 1.7-4.8 0Z" />
    </>
  ),

  /* Investigation — concentric broken ridges around a core, with a
     delta formed by short arcs bridging each gap. */
  fingerprint: (
    <>
      <path d="M9.93 11.65A2.2 2.2 0 1 0 12 10.2" />
      <path d="M11.71 9.11A3.3 3.3 0 0 0 9.01 11.01" />
      <path d="M10.5 16.53A4.4 4.4 0 1 0 7.67 11.64" />
      <path d="M6.52 11.92A5.5 5.5 0 0 0 9.68 17.38" />
      <path d="M18.2 14.66A6.6 6.6 0 1 0 9.74 18.6" />
      <path d="M10.01 19.84A7.7 7.7 0 0 0 18.98 15.65" />
      <path d="M15.01 4.13A8.8 8.8 0 1 0 19.62 16.8" />
    </>
  ),

  /* ---- room / table ---- */

  magnify: (
    <>
      <circle cx="10.5" cy="10.5" r="6.25" />
      <path d="M15.1 15.1 20.5 20.5" />
    </>
  ),

  "door-open": (
    <>
      <path d="M4.75 20.5V4.25A.75.75 0 0 1 5.5 3.5h3M4.75 20.5H8.5" />
      <path d="M8.5 4.75 16.75 7.5v11L8.5 19.75Z" />
      <path d="M14.75 12v2.4" />
    </>
  ),

  key: (
    <>
      <circle cx="7.25" cy="12" r="3.75" />
      <circle cx="7.25" cy="12" r="1.25" />
      <path d="M11 12h9.25" />
      <path d="M16.75 12v3M20 12v1.75" />
    </>
  ),

  lock: (
    <>
      <rect x="4.75" y="10.25" width="14.5" height="10.25" rx="1.25" />
      <path d="M8.25 10.25V7.5a3.75 3.75 0 0 1 7.5 0v2.75" />
      <path d="M12 13.25v2.75" />
    </>
  ),

  /* ---- table / status ---- */

  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.25V12l3.5 2" />
    </>
  ),

  hourglass: (
    <>
      <path d="M6.5 3.5h11M6.5 20.5h11" />
      <path d="M6.5 3.5c0 3.4 5.5 6.1 5.5 8.5s-5.5 5.1-5.5 8.5" />
      <path d="M17.5 3.5c0 3.4-5.5 6.1-5.5 8.5s5.5 5.1 5.5 8.5" />
    </>
  ),

  chat: (
    <path d="M6 4.25h12.5A3.25 3.25 0 0 1 21.75 7.5v7A3.25 3.25 0 0 1 18.5 17.75h-9l-4.5 3.25v-3.25A3.25 3.25 0 0 1 3 15V7.5A3.25 3.25 0 0 1 6 4.25Z" />
  ),

  smile: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.25 9.75v1M14.75 9.75v1" />
      <path d="M8.25 14.25a4.6 4.6 0 0 0 7.5 0" />
    </>
  ),

  eye: (
    <>
      <path d="M2.5 12S6.2 5.75 12 5.75 21.5 12 21.5 12 17.8 18.25 12 18.25 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </>
  ),

  "eye-off": (
    <>
      <path d="M2.5 12S6.2 5.75 12 5.75 21.5 12 21.5 12 17.8 18.25 12 18.25 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.9" />
      <path d="M4 4 20 20" />
    </>
  ),

  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 9.25v5.75" />
      <path d="M10.25 10.75 12 9.25l1.75 1.5" />
    </>
  ),

  flame: (
    <>
      <path d="M12 2.75c.35 2.1 1.6 3.4 3.15 4.9 1.6 1.55 2.6 3.2 2.6 5.1A5.75 5.75 0 0 1 12 21a5.75 5.75 0 0 1-5.75-8.25c0-1.9 1-3.55 2.6-5.1C10.4 6.15 11.65 4.85 12 2.75Z" />
      <path d="M12 13.25c1.5 1.5 2.25 2.75 2.25 3.9a2.25 2.25 0 0 1-4.5 0c0-1.15.75-2.4 2.25-3.9Z" />
    </>
  ),

  trophy: (
    <>
      <path d="M8.25 4.25h7.5v4.75a3.75 3.75 0 0 1-7.5 0Z" />
      <path d="M8.25 5.75H6.4a1.9 1.9 0 0 0 0 3.8h1.85" />
      <path d="M15.75 5.75h1.85a1.9 1.9 0 0 1 0 3.8H15.75" />
      <path d="M12 12.75v4.5" />
      <path d="M10.25 17.25h3.5v3h-3.5z" />
      <path d="M8.75 20.25h6.5" />
    </>
  ),

  /* Verdict — gavel head, handle, sound block. */
  gavel: (
    <>
      <rect x="3" y="4" width="10" height="6" rx="0.75" transform="rotate(-45 8 7)" />
      <path d="M10.3 9.3 20.25 19.25" />
      <path d="M4.25 18.25h4.5v3h-4.5z" />
      <path d="M2.75 21.25h7.5" />
    </>
  ),

  scale: (
    <>
      <path d="M12 3.75v16.5" />
      <path d="M8.75 20.25h6.5" />
      <path d="M5.5 7.5h13" />
      <path d="M5.5 7.5 3.5 12.5M5.5 7.5l2 5" />
      <path d="M3 12.5h5a2.5 2.5 0 0 1-5 0Z" />
      <path d="M18.5 7.5 16.5 12.5M18.5 7.5l2 5" />
      <path d="M16 12.5h5a2.5 2.5 0 0 1-5 0Z" />
    </>
  ),

  /* ---- signals ---- */

  alert: (
    <>
      <path d="M12 4.25 21.3 20.25H2.7Z" />
      <path d="M12 10v4.25" />
      <path d="M12 17v.01" />
    </>
  ),

  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11.25v5.25" />
      <path d="M12 7.75v.01" />
    </>
  ),

  skull: (
    <>
      <path d="M12 3.2c-4.35 0-7.8 3.1-7.8 7.1 0 2.3 1 4.1 2.55 5.35v2.3c0 1.1.9 2 2 2h6.5c1.1 0 2-.9 2-2v-2.3c1.55-1.25 2.55-3.05 2.55-5.35 0-4-3.45-7.1-7.8-7.1Z" />
      <circle cx="9.3" cy="11.2" r="1.6" />
      <circle cx="14.7" cy="11.2" r="1.6" />
      <path d="M12 13.6 10.9 15.9h2.2Z" />
    </>
  ),

  /* ---- ambience ---- */

  moon: (
    <path d="M18 18.02A8.5 8.5 0 1 1 18 5.98 8.5 8.5 0 0 0 18 18.02Z" />
  ),

  sun: (
    <>
      <circle cx="12" cy="12" r="4.25" />
      <path d="M16.25 12H18.5M15.01 8.99 16.6 7.4M12 7.75V5.5M8.99 8.99 7.4 7.4M7.75 12H5.5M8.99 15.01 7.4 16.6M12 16.25v2.25M15.01 15.01 16.6 16.6" />
    </>
  ),
};

/* `search` is a second name for the same glyph — an alias so a call site can
   use whichever word reads better in context. */
GLYPHS.search = GLYPHS.magnify;

/* Names are kebab-case. A camelCase or PascalCase spelling is folded to
   kebab before the lookup, so `doorOpen`, `DoorOpen` and `door-open` all
   resolve to the same glyph instead of silently rendering nothing. */
function resolve(name) {
  if (typeof name !== 'string') return undefined;
  if (GLYPHS[name]) return GLYPHS[name];
  const kebab = name.trim().replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return GLYPHS[kebab];
}

export default function Icon({ name, size = 20, className = '', title, ...rest }) {
  const glyph = resolve(name);

  // Unknown name: render nothing rather than a broken box.
  if (!glyph) return null;

  // Decorative by default (most icons sit next to real text and would only
  // create noise for a screen reader). Pass title, aria-label or
  // aria-labelledby to announce it instead.
  const labelled = Boolean(title) || 'aria-label' in rest || 'aria-labelledby' in rest;
  const a11y = labelled
    ? {
        role: 'img',
        ...(title && !('aria-label' in rest) ? { 'aria-label': title } : null),
      }
    : { 'aria-hidden': 'true', focusable: 'false' };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={['icon', className].filter(Boolean).join(' ')}
      {...rest}
      {...a11y}
    >
      {title ? <title>{title}</title> : null}
      {glyph}
    </svg>
  );
}
