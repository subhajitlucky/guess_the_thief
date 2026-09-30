/**
 * design-audit.mjs — checks the noir design system actually holds.
 *
 * A rebrand can look fine in one component and silently rot in the twelfth:
 * someone hardcodes #f0b429 instead of var(--accent), someone drops a 32px
 * tap target, someone picks a grey that fails contrast on the near-black
 * ground. None of that is visible without checking every file.
 *
 * Run: node scripts/design-audit.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CLIENT = new URL('../../client/src', import.meta.url).pathname;
const TOKENS = join(CLIENT, 'styles/tokens.css');

let failures = 0;
let warnings = 0;
const fail = (m) => { failures++; console.log(`  FAIL  ${m}`); };
const warn = (m) => { warnings++; console.log(`  WARN  ${m}`); };
const ok = (m) => console.log(`  PASS  ${m}`);

// ---------------------------------------------------------------- file walk

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

// ------------------------------------------------------------ colour maths

const hex = (h) => {
  const s = h.replace('#', '');
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const lin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
function contrast(fg, bg) {
  const a = luminance(hex(fg));
  const b = luminance(hex(bg));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

// -------------------------------------------------------------- token read

console.log('\n1. Token layer');
const tokens = readFileSync(TOKENS, 'utf8');
const tokenValue = (name) => {
  const m = new RegExp(`--${name}:\\s*([^;]+);`).exec(tokens);
  if (!m) return null;
  const v = m[1].trim();
  const ref = /^var\(--([a-z0-9-]+)\)$/.exec(v);
  if (ref) return tokenValue(ref[1]);
  return v;
};

for (const t of ['bg-base', 'text-primary', 'text-secondary', 'text-muted', 'accent', 'accent-contrast']) {
  tokenValue(t) ? null : fail(`token --${t} is missing`);
}
ok('core tokens resolve');
if (tokens.includes('prefers-reduced-motion')) ok('reduced-motion honoured globally');
else fail('no prefers-reduced-motion block in tokens.css');

// --------------------------------------------------------------- contrast

console.log('\n2. WCAG contrast on the noir ground');
const bg = tokenValue('bg-base');
const pairs = [
  ['text-primary', 4.5],
  ['text-secondary', 4.5],
  ['text-muted', 4.5],
  ['text-faint', 3.0],
  ['accent', 4.5],
  ['role-king', 3.0],
  ['role-queen', 3.0],
  ['role-police', 3.0],
  ['role-thief', 3.0],
  ['success', 3.0],
  ['danger', 3.0],
];
for (const [name, min] of pairs) {
  const v = tokenValue(name);
  if (!v) { fail(`--${name} missing`); continue; }
  const ratio = contrast(v, bg);
  const pass = ratio >= min;
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  --${name} ${ratio.toFixed(2)}:1 (needs ${min})`);
  if (!pass) failures++;
}
const onAccent = contrast(tokenValue('accent-contrast'), tokenValue('accent'));
console.log(`  ${onAccent >= 4.5 ? 'PASS' : 'FAIL'}  --accent-contrast on --accent ${onAccent.toFixed(2)}:1 (needs 4.5)`);
if (onAccent < 4.5) failures++;

// --------------------------------------------------------- no raw literals

console.log('\n3. No raw colour literals outside tokens.css');
const styleFiles = walk(CLIENT, ['.css']);
let literalHits = 0;
for (const f of styleFiles) {
  if (f === TOKENS) continue;
  const body = readFileSync(f, 'utf8');
  const hits = [...body.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g)];
  // Comments legitimately mention colours; strip them first.
  const code = body.replace(/\/\*[\s\S]*?\*\//g, '');
  const real = [...code.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g)];
  if (real.length) {
    literalHits += real.length;
    fail(`${relative(CLIENT, f)}: ${real.length} raw colour literal(s) — use a semantic token`);
  }
  void hits;
}
if (!literalHits) ok(`${styleFiles.length} style files are fully tokenised`);

// ------------------------------------------------------------------- emoji

console.log('\n4. No emoji left in component source');
const jsxFiles = walk(CLIENT, ['.jsx', '.js']);
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

// Emoji quoted inside a string literal are DATA, not chrome: the reaction
// picker sends them over the socket for other players to see. Emoji in bare
// JSX text are chrome and must become <Icon />.
const stripQuotedStrings = (line) =>
  line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '``');

let emojiHits = 0;
for (const f of jsxFiles) {
  const body = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  body.split('\n').forEach((line, i) => {
    if (!EMOJI.test(line)) return;
    if (!EMOJI.test(stripQuotedStrings(line))) return; // data, not chrome
    emojiHits++;
    console.log(`       ${relative(CLIENT, f)}:${i + 1}  ${line.trim().slice(0, 70)}`);
  });
}
if (emojiHits === 0) ok('no emoji used as UI chrome (quoted data emoji are allowed)');
else fail(`${emojiHits} emoji used as UI chrome — use <Icon />`);

// ------------------------------------------------------------- touch sizes

console.log('\n5. Touch targets');
const allCss = styleFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
const smallPads = [...allCss.matchAll(/padding:\s*(\d+(?:\.\d+)?)px/g)]
  .map((m) => Number(m[1]))
  .filter((v) => v > 0 && v < 12);
if (smallPads.length) warn(`${smallPads.length} sub-12px paddings (fine for inline text, check they are not interactive)`);
else ok('no suspiciously small fixed paddings');
if (allCss.includes('var(--touch-target)') || allCss.includes('min-height: 44px') || allCss.includes('44px')) {
  ok('44px touch target referenced');
} else fail('no 44px touch target anywhere');

// ----------------------------------------------------------------- fonts

console.log('\n6. Typography wired up');
const html = readFileSync(new URL('../../client/index.html', import.meta.url).pathname, 'utf8');
// Google Fonts encodes spaces as '+' in the query string, so normalise before
// matching or a correctly loaded face reads as missing.
const htmlFlat = html.replace(/\+/g, ' ');
for (const f of ['Bodoni Moda', 'Archivo', 'IBM Plex Mono']) {
  htmlFlat.includes(f) ? ok(`${f} loaded`) : fail(`${f} not loaded in index.html`);
}
if (allCss.includes('var(--font-display)')) ok('--font-display in use');
else fail('--font-display unused');
if (allCss.includes('var(--font-mono)')) ok('--font-mono in use');
else fail('--font-mono unused');

// ----------------------------------------------------------------- report

console.log(`\n${failures === 0 ? 'AUDIT CLEAN' : failures + ' FAILURE(S)'}${warnings ? `, ${warnings} warning(s)` : ''}`);
process.exit(failures === 0 ? 0 : 1);
