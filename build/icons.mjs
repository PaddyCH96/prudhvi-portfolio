// ─────────────────────────────────────────────────────────────
// Icon-set generator: one committed SVG in, the whole browser-chrome asset set
// out (D-14).
//
// The source, `src/assets/icon/mark.svg`, is a hand-authored design artifact and
// is committed. Only the raster derivatives below are generated, and they are
// gitignored — they are reproducible from the mark, and the build gate
// guarantees they exist. Nothing here converts a font glyph to a path; the mark
// already contains paths, so resvg needs no font at all and
// `loadSystemFonts: false` costs nothing and saves the 8x default font scan.
//
// The ICO is built by `png-to-ico`, not by hand-packing an ICONDIR. The
// 0-means-256 width quirk and the PNG-vs-BMP payload rules are exactly what the
// package exists to handle, and it is pure JS with `pngjs` as its sole
// dependency — no second native binary. A general-purpose image-processing
// native library is deliberately NOT added here: resvg already rasterises this
// SVG at any size we ask for, so a second platform-specific binary would be
// strictly more supply-chain and install-time risk for zero gain.
//
// Every write path is a literal joined to `outDir`. Nothing is derived from
// data, so there is no path-traversal surface in this module at all.
//
// Nothing is wrapped in a catch. A mark that fails to rasterise must abort the
// build (D-10) rather than ship a blank tab icon that is invisible to the author
// and visible to every visitor.
// ─────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

// Derived, not literal: this generator carried its own hardcoded copy of the
// name — including the retired "Paddy" nickname — until this edit. src/data/
// profile.js is the single source for both, same as astro.config.mjs and
// build/card.mjs.
import { profile } from '../src/data/profile.js';

/**
 * The complete generated set, in write order. The integration asserts the
 * returned list against this, and plan 03-06 emits the <link> tags that
 * reference these exact names — so the filenames are a contract.
 */
export const ICON_FILES = [
  'favicon.svg',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'favicon.ico',
  'site.webmanifest',
];

/**
 * The manifest, verbatim from the UI-SPEC browser-chrome contract.
 *
 * `display: 'browser'` is deliberate — this is a portfolio site, not an app
 * shell, and a standalone display mode would strip the URL bar from a bookmark
 * launch for no benefit.
 */
export const WEB_MANIFEST = {
  name: profile.name,
  short_name: profile.short,
  theme_color: '#0d0d0d',
  background_color: '#0d0d0d',
  display: 'browser',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
};

/**
 * Rasterise the mark into the full icon set and write it to `outDir`.
 *
 * `favicon.svg` is a byte copy of the source, not a re-serialisation: a
 * round-trip through a parser would be a silent opportunity for the vector the
 * browser scales to drift from the vector the rasters came from, which is the
 * whole failure D-14 exists to prevent.
 *
 * @param {string} srcSvgPath path to the committed mark
 * @param {string} outDir directory to write into (`public/`)
 * @returns {Promise<string[]>} the filenames written, for the caller to assert and log
 */
export async function generateIcons(srcSvgPath, outDir) {
  const svg = fs.readFileSync(srcSvgPath, 'utf8');

  /** @param {number} w @returns {Buffer} */
  const at = (w) =>
    new Resvg(svg, {
      fitTo: { mode: 'width', value: w },
      font: { loadSystemFonts: false },
    })
      .render()
      .asPng();

  fs.mkdirSync(outDir, { recursive: true });

  fs.copyFileSync(srcSvgPath, path.join(outDir, 'favicon.svg'));
  fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), at(180));
  fs.writeFileSync(path.join(outDir, 'icon-192.png'), at(192));
  fs.writeFileSync(path.join(outDir, 'icon-512.png'), at(512));

  // The two resolutions the ICO carries. 16 is the tab strip, 32 is the
  // bookmark bar and the Windows taskbar; larger sizes belong in the PNG set
  // above, where they do not pay the ICO container's per-image overhead.
  fs.writeFileSync(path.join(outDir, 'favicon.ico'), await pngToIco([at(16), at(32)]));

  fs.writeFileSync(
    path.join(outDir, 'site.webmanifest'),
    JSON.stringify(WEB_MANIFEST, null, 2) + '\n'
  );

  return [...ICON_FILES];
}
