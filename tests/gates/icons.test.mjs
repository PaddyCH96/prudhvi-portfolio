// ─────────────────────────────────────────────────────────────
// Gate: the generated browser-chrome icon set.
//
// This file asserts the OUTPUT, not the generator, because the failure this
// exists to catch is structural: a `favicon.ico` that is really a renamed PNG
// is the classic way a favicon "works" in Chrome and silently fails in a
// Windows bookmark bar. Nothing about the filename proves the container, so the
// ICONDIR is parsed byte by byte and every raster's dimensions are read from
// its IHDR rather than from its name.
//
// The set is generated into `public/` by the asset-pipeline hook, so this suite
// generates it directly rather than depending on a prior `astro build` having
// been run — the gate must be meaningful on a cold checkout.
// ─────────────────────────────────────────────────────────────

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateIcons, ICON_FILES, WEB_MANIFEST } from '../../build/icons.mjs';

const PUBLIC_DIR = fileURLToPath(new URL('../../public/', import.meta.url));
const MARK_SVG = fileURLToPath(new URL('../../src/assets/icon/mark.svg', import.meta.url));

const PNG_MAGIC = '89504e470d0a1a0a';

/** @type {string[]} */
let written;

before(async () => {
  written = await generateIcons(MARK_SVG, PUBLIC_DIR);
});

/** @param {string} name */
const read = (name) => fs.readFileSync(path.join(PUBLIC_DIR, name));

/**
 * A PNG's real dimensions live in the IHDR chunk: 8 bytes of signature, a
 * 4-byte length, the 4-byte type `IHDR`, then width and height as big-endian
 * uint32. Reading them here is the point of the test — the filename is exactly
 * the thing under suspicion.
 *
 * @param {Buffer} buf
 * @returns {{width: number, height: number}}
 */
function pngSize(buf) {
  assert.equal(buf.subarray(0, 8).toString('hex'), PNG_MAGIC, 'not a PNG');
  assert.equal(buf.subarray(12, 16).toString('ascii'), 'IHDR', 'first chunk is not IHDR');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('generated icon set', () => {
  test('generateIcons returns the full contract and every file exists', () => {
    assert.deepEqual([...written].sort(), [...ICON_FILES].sort());
    for (const name of ICON_FILES) {
      assert.ok(
        fs.existsSync(path.join(PUBLIC_DIR, name)),
        `public/${name} was named in the contract but not written`
      );
    }
  });

  test('favicon.svg is byte-identical to the committed mark', () => {
    assert.ok(
      read('favicon.svg').equals(fs.readFileSync(MARK_SVG)),
      'favicon.svg drifted from src/assets/icon/mark.svg — it must be a byte copy'
    );
  });
});

describe('favicon.ico container', () => {
  test('is a genuine multi-resolution ICO, not a renamed PNG', () => {
    const ico = read('favicon.ico');

    assert.notEqual(
      ico.subarray(0, 8).toString('hex'),
      PNG_MAGIC,
      'favicon.ico is a PNG wearing an .ico name'
    );

    // ICONDIR: reserved uint16 = 0, type uint16 = 1 (icon, not cursor), count uint16.
    assert.equal(ico.readUInt16LE(0), 0, 'ICONDIR reserved field must be 0');
    assert.equal(ico.readUInt16LE(2), 1, 'ICONDIR type must be 1 (icon)');
    assert.equal(ico.readUInt16LE(4), 2, 'expected exactly 2 images in the ICO');
  });

  test('carries 16x16 and 32x32 entries', () => {
    const ico = read('favicon.ico');
    const count = ico.readUInt16LE(4);

    const widths = [];
    const heights = [];
    for (let i = 0; i < count; i++) {
      // Each ICONDIRENTRY is 16 bytes, starting at offset 6. Byte 0 is width,
      // byte 1 is height, each stored as a uint8 where 0 means 256.
      const base = 6 + i * 16;
      widths.push(ico[base] || 256);
      heights.push(ico[base + 1] || 256);

      // The payload must actually be inside the file.
      const size = ico.readUInt32LE(base + 8);
      const offset = ico.readUInt32LE(base + 12);
      assert.ok(size > 0, 'ICONDIRENTRY declares a zero-length image');
      assert.ok(
        offset + size <= ico.length,
        'ICONDIRENTRY points past the end of the file'
      );
    }

    assert.deepEqual(widths.sort((a, b) => a - b), [16, 32]);
    assert.deepEqual(heights.sort((a, b) => a - b), [16, 32]);
  });
});

describe('raster dimensions read from IHDR', () => {
  for (const [name, expected] of [
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ]) {
    test(`${name} is ${expected}x${expected}`, () => {
      assert.deepEqual(pngSize(read(name)), { width: expected, height: expected });
    });
  }
});

describe('site.webmanifest', () => {
  test('parses and matches the browser-chrome contract', () => {
    const manifest = JSON.parse(read('site.webmanifest').toString('utf8'));

    assert.equal(manifest.name, WEB_MANIFEST.name);
    assert.equal(manifest.short_name, WEB_MANIFEST.short_name);
    assert.equal(manifest.theme_color, WEB_MANIFEST.theme_color);
    assert.equal(manifest.background_color, WEB_MANIFEST.background_color);
    assert.equal(manifest.display, WEB_MANIFEST.display);
    assert.equal(manifest.icons.length, 2);
  });

  test('every declared icon src exists on disk at its declared size', () => {
    const manifest = JSON.parse(read('site.webmanifest').toString('utf8'));

    for (const icon of manifest.icons) {
      assert.ok(icon.src.startsWith('/'), `icon src ${icon.src} must be root-relative`);
      const file = path.join(PUBLIC_DIR, icon.src.slice(1));
      assert.ok(fs.existsSync(file), `manifest points at ${icon.src}, which does not exist`);

      // A manifest that lies about its sizes is worse than one that omits them:
      // the OS picks by the declared value and scales the mismatch.
      const [declared] = icon.sizes.split('x').map(Number);
      assert.deepEqual(pngSize(fs.readFileSync(file)), {
        width: declared,
        height: declared,
      });
    }
  });
});
