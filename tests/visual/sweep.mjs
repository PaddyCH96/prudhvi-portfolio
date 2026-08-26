#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// DSGN-04 responsive + accessibility sweep.
//
// Tier 2. Slow, needs a real browser, and is NEVER part of `npm run build`
// (RESEARCH Pitfall 4) — it is a phase gate and a Phase 4 re-verification
// tool. Cloudflare Pages must set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 so a
// build that never opens a browser never downloads one.
//
// It exists because the things that matter most on the new hero cannot be
// checked statically: rendered element height, absence of horizontal
// overflow, whether four stat cards actually fit above the fold on a phone,
// and whether the shipped CSS produces the composite background the contrast
// table only predicts. Those need a layout engine and real pixels.
//
// Run: npm run verify:visual   (build first — it inspects dist/)
// ─────────────────────────────────────────────────────────────

import { createServer } from 'node:http';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, normalize, resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
import { chromium } from 'playwright';
import { contrastRatio } from '../helpers/contrast.mjs';

const DIST = 'dist';
const WIDTHS = [375, 768, 1280];
const THEMES = ['light', 'dark'];
const TAP_MIN = 44;

// Published composite floors (03-UI-SPEC § Color), measured at the worst
// frame — opacity 1.0, which is also the at-rest reduced-motion state, so
// `reducedMotion: 'reduce'` makes the worst frame deterministic.
const HERO_FLOOR = { light: 5.83, dark: 8.35 };

// D-04's acceptance test. Both are measured and both are reported: 667 is
// the iPhone SE, 812 the modern iPhone. Reporting only the one that passes
// would be choosing the viewport rather than verifying the rule.
const FOLDS = [667, 812];

// Expected related-row columns per width (03-UI-SPEC § Responsive Contract).
const RELATED_COLUMNS = { 375: 1, 768: 2, 1280: 3 };

// ── Static server over the built output ──────────────────────
// Binds an ephemeral port on localhost and serves only already-public built
// output, torn down on exit (T-03-45).
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

function startServer(root) {
  const base = resolve(root);
  const server = createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (p.endsWith('/')) p += 'index.html';
    else if (!extname(p)) p += '/index.html';
    const file = resolve(base, '.' + normalize(p));
    if (!file.startsWith(base) || !existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('not found');
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((ok) =>
    server.listen(0, '127.0.0.1', () => ok({ server, port: server.address().port }))
  );
}

// ── Page list, derived from the build ────────────────────────
// Never a literal count: publishing one more markdown file must not turn
// this sweep red (03-VALIDATION § Open Risk).
function htmlRoutes(root) {
  return readdirSync(root, { recursive: true })
    .map(String)
    .filter((p) => p.endsWith('.html'))
    .map((p) => '/' + p.split(/[\\/]/).join('/'))
    .map((r) => (r.endsWith('/index.html') ? r.slice(0, -'index.html'.length) : r))
    .sort();
}

// ── 1×1 PNG decode ───────────────────────────────────────────
// Playwright hands back a PNG; there is no pixel-reading API and no JS in the
// page can see a composited backdrop, so the screenshot IS the measurement.
// For a 1×1 image every PNG filter type reduces to the raw sample (the left,
// up and upper-left neighbours are all zero), so no reconstruction is needed.
function decodePixel(buf) {
  let off = 8;
  let width, height, bitDepth, colourType;
  const idat = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colourType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (width !== 1 || height !== 1) throw new Error(`expected a 1x1 clip, got ${width}x${height}`);
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  const bpp = { 0: 1, 2: 3, 6: 4 }[colourType];
  if (!bpp) throw new Error(`unsupported colour type ${colourType}`);
  const raw = inflateSync(Buffer.concat(idat));
  const px = raw.subarray(1, 1 + bpp);
  const [r, g, b] = colourType === 0 ? [px[0], px[0], px[0]] : [px[0], px[1], px[2]];
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function cssColourToHex(value) {
  const v = value.trim();
  const m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (m) {
    return (
      '#' +
      m
        .slice(1, 4)
        .map((n) => Math.round(Number(n)).toString(16).padStart(2, '0'))
        .join('')
    );
  }
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return '#' + v.slice(1).split('').map((c) => c + c).join('').toLowerCase();
  }
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  throw new Error(`cannot read colour: ${value}`);
}

// ── Result table ─────────────────────────────────────────────
const results = [];
function record(page, width, theme, check, ok, detail) {
  results.push({ page, width, theme, check, ok, detail });
}

async function main() {
  if (!existsSync(DIST)) {
    console.error(`${DIST}/ not found — run \`npm run build\` first.`);
    process.exit(1);
  }
  const routes = htmlRoutes(DIST);
  if (routes.length === 0) {
    console.error(`no HTML in ${DIST}/ — the build produced nothing to sweep.`);
    process.exit(1);
  }
  const { server, port } = await startServer(DIST);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  let tapControlsSeen = 0;

  try {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          // The at-rest state IS the worst animation frame (opacity 1.0), so
          // forcing reduced motion makes the pixel sample deterministic.
          reducedMotion: 'reduce',
          colorScheme: theme,
          deviceScaleFactor: 1,
        });
        // The site's own explicit override path: the inline head script reads
        // localStorage['theme'] and sets data-theme before first paint.
        await context.addInitScript((t) => {
          try {
            localStorage.setItem('theme', t);
          } catch {
            /* storage unavailable */
          }
        }, theme);

        for (const route of routes) {
          const page = await context.newPage();
          await page.goto(origin + route, { waitUntil: 'load' });
          await page.waitForTimeout(60);

          const activeTheme = await page.evaluate(() =>
            document.documentElement.getAttribute('data-theme')
          );
          record(route, width, theme, 'theme applied', activeTheme === theme, `data-theme=${activeTheme}`);

          // ── C-11 overflow ─────────────────────────────────
          if (width === 375 || width === 1280) {
            const o = await page.evaluate(() => ({
              scrollWidth: document.documentElement.scrollWidth,
              innerWidth: window.innerWidth,
            }));
            record(
              route,
              width,
              theme,
              'no h-overflow',
              o.scrollWidth <= o.innerWidth,
              `scrollWidth ${o.scrollWidth} vs ${o.innerWidth}`
            );
          }

          // ── C-9 tap targets ───────────────────────────────
          if (width === 375) {
            const controls = await page.evaluate((MIN) => {
              const out = [];
              for (const el of document.querySelectorAll('a, button, [role="button"]')) {
                if (!el.getClientRects().length) continue; // not rendered
                const r = el.getBoundingClientRect();
                const cs = getComputedStyle(el);
                const declared = parseFloat(cs.minHeight);
                const cls =
                  el.className && typeof el.className === 'string' && el.className.trim()
                    ? '.' + el.className.trim().split(/\s+/).join('.')
                    : el.tagName.toLowerCase() + (el.id ? '#' + el.id : '');
                out.push({
                  label: cls,
                  height: Math.round(r.height * 100) / 100,
                  minHeight: Number.isFinite(declared) ? declared : 0,
                  under: r.height < MIN - 0.01,
                  undeclared: !(Number.isFinite(declared) && declared >= MIN),
                });
              }
              return out;
            }, TAP_MIN);
            tapControlsSeen += controls.length;
            const under = controls.filter((c) => c.under);
            const undeclared = controls.filter((c) => c.undeclared);
            record(
              route,
              width,
              theme,
              'tap >=44px',
              under.length === 0,
              `${controls.length} controls, ${under.length} under` +
                (under.length ? ': ' + under.map((c) => `${c.label} ${c.height}px`).join(', ') : '')
            );
            record(
              route,
              width,
              theme,
              'tap min-height declared',
              undeclared.length === 0,
              `${undeclared.length} not backed by min-height>=44` +
                (undeclared.length
                  ? ': ' +
                    undeclared
                      .map((c) => `${c.label} (min-height:${c.minHeight}px, renders ${c.height}px)`)
                      .join(', ')
                  : '')
            );
          }

          // ── D-04 above the fold, and the hero pixel + token walk ──
          if (route === '/') {
            if (width === 375) {
              const stats = await page.evaluate(() =>
                [...document.querySelectorAll('.stat')].map((el) => {
                  const r = el.getBoundingClientRect();
                  return Math.round((r.y + window.scrollY + r.height) * 100) / 100;
                })
              );
              const deepest = Math.max(...stats);
              for (const fold of FOLDS) {
                record(
                  route,
                  width,
                  theme,
                  `stats above fold @${fold}h`,
                  stats.length === 4 && deepest <= fold,
                  `${stats.length} cards, deepest edge ${deepest}px vs ${fold}px ` +
                    (deepest <= fold
                      ? `(${Math.round(fold - deepest)}px spare)`
                      : `(${Math.round(deepest - fold)}px short)`)
                );
              }
            }

            // Sampled composite contrast: screenshot a 1×1 clip inside the
            // hero field but outside any glyph, and score the real pixel.
            // Blending order and stacking contexts can diverge from the
            // arithmetic, so the table is a prediction and this is the proof.
            for (const sel of ['.hero-title', '.hero-blurb']) {
              const probe = await page.evaluate((s) => {
                const el = document.querySelector(s);
                const hero = document.querySelector('#top');
                if (!el || !hero) return null;
                const e = el.getBoundingClientRect();
                const h = hero.getBoundingClientRect();
                return {
                  colour: getComputedStyle(el).color,
                  x: Math.round(h.right - 4),
                  y: Math.round(e.y + e.height / 2),
                };
              }, sel);
              if (!probe) {
                record(route, width, theme, `hero pixel ${sel}`, false, 'element not found');
                continue;
              }
              const shot = await page.screenshot({
                clip: { x: probe.x, y: probe.y, width: 1, height: 1 },
              });
              const field = decodePixel(shot);
              const ink = cssColourToHex(probe.colour);
              const ratio = Math.round(contrastRatio(field, ink) * 100) / 100;
              const floor = HERO_FLOOR[theme];
              record(
                route,
                width,
                theme,
                `hero contrast ${sel}`,
                ratio >= floor,
                `${ink} on sampled ${field} = ${ratio}:1 (floor ${floor}:1)`
              );
            }

            // Colour rule 1 / Prohibition 3: --muted (3.86:1) and --link
            // (3.91:1) are prohibited on the hero field in ANY state.
            const walk = await page.evaluate(() => {
              const norm = (v) => v.trim().toLowerCase();
              const banned = new Map();
              for (const token of ['--muted', '--link']) {
                const probe = document.createElement('span');
                probe.style.color = `var(${token})`;
                probe.style.position = 'absolute';
                probe.style.opacity = '0';
                document.body.appendChild(probe);
                banned.set(norm(getComputedStyle(probe).color), token);
                probe.remove();
              }
              const offenders = [];
              const hero = document.querySelector('#top');
              const walker = document.createTreeWalker(hero, NodeFilter.SHOW_TEXT);
              for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                if (!n.nodeValue.trim()) continue;
                const el = n.parentElement;
                const c = norm(getComputedStyle(el).color);
                if (banned.has(c)) {
                  offenders.push(
                    `${el.tagName.toLowerCase()}."${n.nodeValue.trim().slice(0, 24)}" = ${banned.get(c)}`
                  );
                }
              }
              return { offenders, banned: [...banned.keys()] };
            });
            record(
              route,
              width,
              theme,
              'hero token walk',
              walk.offenders.length === 0,
              walk.offenders.length
                ? walk.offenders.join('; ')
                : `0 nodes resolve to --muted/--link (${walk.banned.join(', ')})`
            );

            // Hover is a state the static walk cannot reach.
            const hoverSel = '.hero-secondary a';
            const hoverCount = await page.locator(hoverSel).count();
            if (hoverCount) {
              const bad = [];
              for (let i = 0; i < hoverCount; i++) {
                const link = page.locator(hoverSel).nth(i);
                await link.hover();
                const c = await link.evaluate((el) => getComputedStyle(el).color.trim().toLowerCase());
                if (walk.banned.includes(c)) bad.push(`${await link.innerText()} = ${c}`);
              }
              record(
                route,
                width,
                theme,
                'hero hover token',
                bad.length === 0,
                bad.length ? bad.join('; ') : `${hoverCount} hero links clean on hover`
              );
            }
          }

          // ── Related row layout ────────────────────────────
          if (/^\/projects\/[^/]+\/$/.test(route)) {
            const cols = await page.evaluate(() => {
              const cards = [...document.querySelectorAll('.more .more-card')];
              if (!cards.length) return { total: 0, cols: 0 };
              const tops = cards.map((c) => Math.round(c.getBoundingClientRect().y));
              const first = Math.min(...tops);
              return { total: cards.length, cols: tops.filter((t) => t === first).length };
            });
            record(
              route,
              width,
              theme,
              'related row',
              cols.total === 3 && cols.cols === RELATED_COLUMNS[width],
              `${cols.total} cards, ${cols.cols}-up (expected ${RELATED_COLUMNS[width]}-up)`
            );
          }

          await page.close();
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  // ── Report ─────────────────────────────────────────────────
  const failed = results.filter((r) => !r.ok);
  const pad = (s, n) => String(s).padEnd(n);
  const wPage = Math.max(6, ...results.map((r) => r.page.length));
  const wCheck = Math.max(6, ...results.map((r) => r.check.length));

  console.log('');
  console.log(
    `DSGN-04 sweep — ${routes.length} pages x ${WIDTHS.length} widths x ${THEMES.length} themes`
  );
  console.log(
    `reduced motion forced (worst frame, opacity 1.0); ${tapControlsSeen} tap targets measured at 375px`
  );
  console.log('');
  console.log(`${pad('page', wPage)}  ${pad('w', 5)} ${pad('theme', 6)} ${pad('check', wCheck)}  result`);
  console.log('-'.repeat(wPage + wCheck + 30));
  for (const r of results) {
    console.log(
      `${pad(r.page, wPage)}  ${pad(r.width, 5)} ${pad(r.theme, 6)} ${pad(r.check, wCheck)}  ${
        r.ok ? 'PASS' : 'FAIL'
      }  ${r.detail}`
    );
  }
  console.log('');
  console.log(`${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log('');
    console.log('FAILURES:');
    for (const r of failed) console.log(`  ${r.page} @${r.width} ${r.theme} — ${r.check}: ${r.detail}`);
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
