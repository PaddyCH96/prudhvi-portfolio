// ─────────────────────────────────────────────────────────────
// Gate: the share-card RENDERER contract.
//
// This file asserts the renderer directly — it reads nothing under dist/. The
// complementary check, that the built HTML actually carries the og:image tags
// pointing at these files, lives in tests/gates/og.test.mjs.
//
// The same rule that governs ogroutes.test.mjs governs this file: NO ROUTE
// COUNT IS EVER PINNED TO A LITERAL. The record list is derived from
// ogRoutes(readBlogEntries()), because src/content/blog/hello.md is one
// `draft: false` away from adding a route and a hardcoded expectation would
// turn publishing a post into a build failure naming none of the actual cause.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { verifyFonts } from '../../build/verify-fonts.mjs';
import { readBlogEntries } from '../../build/integration.mjs';
import {
  cardTree,
  measureSlot,
  renderCard,
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_INNER_WIDTH,
} from '../../build/card.mjs';
import { ogRoutes } from '../../src/data/og-routes.js';

const PNG_MAGIC = '89504e470d0a1a0a';

const fonts = await verifyFonts();
const routes = ogRoutes(readBlogEntries());
const records = Object.values(routes);

/** Every card is rendered once and the results reused, to stay inside the suite budget. */
const rendered = new Map();
for (const record of records) {
  rendered.set(record.path, await renderCard(record, fonts));
}

/**
 * Depth-first walk yielding every node in a satori tree.
 * @param {any} node
 * @returns {Generator<any>}
 */
function* walk(node) {
  if (!node || typeof node !== 'object') return;
  yield node;
  const kids = node.props?.children;
  if (Array.isArray(kids)) for (const kid of kids) yield* walk(kid);
  else if (kids && typeof kids === 'object') yield* walk(kids);
}

/**
 * The row holding the headline slot: the node whose direct children include the
 * slot text. Its child count is what tells us whether a unit element exists.
 * @param {any} tree
 * @param {string} slot
 */
function slotRowOf(tree, slot) {
  for (const node of walk(tree)) {
    const kids = node.props?.children;
    if (Array.isArray(kids) && kids.some((kid) => kid?.props?.children === slot)) return node;
  }
  return null;
}

describe('share card renderer', () => {
  test('every route renders a real PNG at the card dimensions', () => {
    assert.ok(records.length > 0, 'no share-card records were derived');

    for (const record of records) {
      const { png } = rendered.get(record.path);
      assert.equal(
        png.subarray(0, 8).toString('hex'),
        PNG_MAGIC,
        `${record.path} did not render PNG magic bytes`
      );
      // IHDR width and height live at byte offsets 16 and 20.
      assert.equal(png.readUInt32BE(16), CARD_WIDTH, `${record.path} width`);
      assert.equal(png.readUInt32BE(20), CARD_HEIGHT, `${record.path} height`);
    }
  });

  test('the hash is 8 lowercase hex chars and is stable for the same record', async () => {
    for (const record of records) {
      const { hash } = rendered.get(record.path);
      assert.match(hash, /^[0-9a-f]{8}$/, `${record.path} hash shape`);
    }

    // D-12's cache busting only works if the hash is reproducible.
    const sample = records[0];
    const again = await renderCard(sample, fonts);
    assert.equal(again.hash, rendered.get(sample.path).hash, 'hash is not stable across renders');
  });

  test('the hash tracks content — different text yields a different hash', async () => {
    const base = { eyebrow: 'Writing', title: 'One', slot: 'A', unit: null };
    const other = { ...base, title: 'Two' };

    const a = await renderCard(base, fonts);
    const b = await renderCard(other, fonts);
    assert.notEqual(a.hash, b.hash, 'two different cards produced the same hash');
  });

  test('every headline slot fits the inner box', async () => {
    for (const record of records) {
      const width = await measureSlot(record, fonts);
      assert.ok(
        width <= CARD_INNER_WIDTH,
        `${record.path} slot '${record.slot}' measures ${Math.round(width)}px, past ${CARD_INNER_WIDTH}px`
      );
    }
  });

  test('the unit element exists only when the record carries a unit', () => {
    const withUnit = { eyebrow: 'E', title: 'T', slot: '0.54', unit: 'Hit Rate' };
    const withoutUnit = { eyebrow: 'E', title: 'T', slot: '0.54', unit: null };

    const rowWith = slotRowOf(cardTree(withUnit), withUnit.slot);
    const rowWithout = slotRowOf(cardTree(withoutUnit), withoutUnit.slot);

    assert.ok(rowWith && rowWithout, 'the slot row was not found in the tree');
    assert.equal(rowWith.props.children.length, 2, 'a unit record should render one unit element');
    assert.equal(
      rowWithout.props.children.length,
      1,
      'a null-unit record should render no unit element'
    );
  });

  test('an empty slot fails rather than rendering a blank headline (D-08)', async () => {
    await assert.rejects(
      () => renderCard({ eyebrow: 'E', title: 'T', slot: '', unit: null }, fonts),
      /slot is empty/,
      'an empty slot must never render'
    );
  });
});
