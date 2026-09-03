// ─────────────────────────────────────────────────────────────
// Share-card renderer: satori builds the tree, resvg rasterises it, sha256 of
// the PNG names the file (D-05, D-06, D-12).
//
// No JSX. The repo has no JSX toolchain and must not gain one, so the tree is
// built from plain objects through the `h` helper below.
//
// satori implements a small CSS subset: `display: flex` is the ONLY display
// mode — there is no block layout — plus flexDirection, justifyContent,
// alignItems, padding, margin, width/height, backgroundColor, backgroundImage
// linear-gradient, color, fontSize, fontWeight, fontFamily, lineHeight,
// letterSpacing and textTransform. There is no `clamp()`, no `ch` unit, no
// `-webkit-line-clamp`, no cascade and no selectors. A 1px rule is a div with
// `height: 1, backgroundColor: '#2c2c2a'`, not a border shorthand.
//
// The card is ALWAYS dark regardless of viewer theme (D-07): og:image resolves
// at crawl time and the viewer's theme is unknowable. It is also fully neutral
// (D-16, Prohibition 2) — none of the site's link or series accent tokens, and
// no chroma of any kind: every colour below is a neutral. The gate greps this
// file for accent token names, so do not name them even in a comment.
// Weight 700 here is the single documented exception to the site's
// two-weight rule; it is confined to this renderer and never reaches a
// stylesheet.
//
// No SVG string is ever concatenated by hand (T-03-16). satori builds the
// document and escapes every text node.
// ─────────────────────────────────────────────────────────────

import crypto from 'node:crypto';

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Derived, not literal: the domain printed on the card changed once already
// (prudhvik.dev → prudhvi.dev). See the identical note in astro.config.mjs.
import { profile, site } from '../src/data/profile.js';

/**
 * Bumped whenever `cardTree` changes. It is part of the skip-if-unchanged input
 * hash, so a composition edit re-renders every card instead of silently keeping
 * the cards drawn by the previous renderer.
 * @type {string}
 */
export const RENDERER_VERSION = '1';

/** Card canvas, in px. */
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

/** 72px safe padding on all sides; all content lives in the inner 1056 x 486. */
export const CARD_PADDING = 72;
export const CARD_INNER_WIDTH = CARD_WIDTH - CARD_PADDING * 2;

/**
 * satori's element factory. satori accepts plain objects in exactly this shape.
 * @param {string} type
 * @param {Record<string, unknown>} style
 * @param {unknown} [children]
 */
const h = (type, style, children) => ({ type, props: { style, children } });

/**
 * Sentinel background used only by `measureSlot`. It never appears on a real
 * card; it exists so the slot row's rect can be told apart from the root canvas
 * rect satori emits at the full card width.
 */
const MEASURE_FILL = '#010203';

/**
 * Headline-slot step-down ladder, largest first.
 *
 * 104px is the UI-SPEC size and is what every numeric `cardStat` renders at.
 * The D-08 order-2 and order-3 slots are not numbers though — they are
 * `{category} · {status}` chips such as `Full-stack · In progress`, and those
 * measure past the 1056px inner box at 104px. Rather than clip or wrap them
 * (both forbidden), the slot steps down exactly as the title already does
 * (68 → 56 → 46). The floor still throws: stepping down is a type-setting rule,
 * not a licence to overflow.
 */
export const SLOT_SIZES = [104, 84, 68, 56, 46];

/**
 * The title steps down rather than wrapping past two lines. satori has no
 * `clamp()` and no line-clamp, so the step is computed here from the string.
 * @param {string} title
 * @returns {number}
 */
function titleSize(title) {
  if (title.length > 42) return 46;
  if (title.length > 26) return 56;
  return 68;
}

/**
 * The headline slot row: the value at 104px with the unit baseline-aligned
 * beside it. When `unit` is null the unit element is omitted entirely — an
 * empty element would still occupy the gap.
 * @param {{slot: string, unit: string|null}} record
 * @param {Record<string, unknown>} [extraStyle]
 */
function slotRow({ slot, unit }, extraStyle = {}, size = SLOT_SIZES[0]) {
  const scale = size / SLOT_SIZES[0];
  const children = [
    h(
      'div',
      { display: 'flex', fontSize: size, fontWeight: 700, color: '#ffffff', lineHeight: 1 },
      slot
    ),
  ];
  if (unit) {
    children.push(
      h(
        'div',
        {
          display: 'flex',
          fontSize: Math.round(44 * scale),
          fontWeight: 400,
          color: '#898781',
          lineHeight: 1,
          paddingBottom: Math.round(10 * scale),
          marginLeft: Math.round(16 * scale),
        },
        unit
      )
    );
  }
  return h(
    'div',
    { display: 'flex', flexDirection: 'row', alignItems: 'flex-end', ...extraStyle },
    children
  );
}

/**
 * The 1200x630 composition from 03-UI-SPEC § Component Contract 3.
 * @param {{eyebrow: string, title: string, slot: string, unit: string|null}} record
 * @returns {object}
 */
export function cardTree(record, slotSize = SLOT_SIZES[0]) {
  const { eyebrow, title, slot } = record;

  // D-08: the slot can never render empty. A blank headline is a card that
  // makes no claim, which is worse than no card at all.
  if (!slot || !String(slot).trim()) {
    throw new Error(
      `the headline slot is empty. The slot can never render empty — resolve it ` +
        `to the category · status chip instead (D-08).`
    );
  }
  if (!eyebrow || !String(eyebrow).trim()) {
    throw new Error(`the eyebrow is empty. Every card carries a label line.`);
  }
  if (!title || !String(title).trim()) {
    throw new Error(`the title is empty. Every card carries a headline.`);
  }

  return h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      padding: CARD_PADDING,
      backgroundImage: 'linear-gradient(148deg, #161615, #0f0f0e)',
      fontFamily: 'Manrope',
      justifyContent: 'space-between',
    },
    [
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h(
          'div',
          {
            display: 'flex',
            fontSize: 26,
            fontWeight: 400,
            color: '#898781',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          },
          eyebrow
        ),
        h(
          'div',
          {
            display: 'flex',
            fontSize: titleSize(title),
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.08,
            marginTop: 24,
          },
          title
        ),
        slotRow(record, { marginTop: 24 }, slotSize),
      ]),
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h('div', { display: 'flex', height: 1, backgroundColor: '#2c2c2a', marginBottom: 24 }),
        h('div', { display: 'flex', justifyContent: 'space-between', width: '100%' }, [
          h(
            'div',
            { display: 'flex', fontSize: 26, fontWeight: 400, color: '#c3c2b7' },
            profile.name
          ),
          h(
            'div',
            { display: 'flex', fontSize: 26, fontWeight: 400, color: '#898781' },
            site.domain
          ),
        ]),
      ]),
    ]
  );
}

/**
 * Render one record to a PNG and fingerprint it.
 *
 * `loadSystemFonts: false` is mandatory, not an optimisation: it is 8x faster
 * AND it makes C-16's "no locally-installed font in the card path" a structural
 * guarantee rather than an incidental one.
 *
 * The hash is a cache-busting fingerprint (D-12), not a security control.
 *
 * @param {{eyebrow: string, title: string, slot: string, unit: string|null}} record
 * @param {{name: string, data: Buffer, weight: number, style: string}[]} fonts
 * @returns {Promise<{png: Buffer, hash: string}>}
 */
export async function renderCard(record, fonts) {
  const fit = await fitSlot(record, fonts);
  if (!fit.ok) throw new Error(overflowReason(record, fit.width));
  const svg = await satori(cardTree(record, fit.size), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts,
  });
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: CARD_WIDTH },
    font: { loadSystemFonts: false },
  })
    .render()
    .asPng();

  const hash = crypto.createHash('sha256').update(png).digest('hex').slice(0, 8);
  return { png, hash };
}

/**
 * Lay out the headline slot alone and return its rendered width in px, so the
 * D-23 overflow rule is asserted rather than assumed.
 *
 * The row is given a background and placed as the sole child of a row-direction
 * flex root, so it shrinks to its content width; satori emits that width as the
 * background rect, which is the laid-out measurement rather than a guess from
 * character counts.
 *
 * @param {{slot: string, unit: string|null}} record
 * @param {{name: string, data: Buffer, weight: number, style: string}[]} fonts
 * @returns {Promise<number>}
 */
export async function measureSlot(record, fonts) {
  const fit = await fitSlot(record, fonts);
  if (!fit.ok) throw new Error(overflowReason(record, fit.width));
  return fit.width;
}

/**
 * Pick the largest step on the ladder whose laid-out slot fits the inner box.
 *
 * Deliberately does NOT throw: the caller that knows the route pathname is the
 * one that should raise the failure, so it can name the route in the UI-SPEC's
 * error text. `ok: false` means even the smallest step overflows.
 *
 * @param {{slot: string, unit: string|null}} record
 * @param {{name: string, data: Buffer, weight: number, style: string}[]} fonts
 * @returns {Promise<{ok: boolean, size: number, width: number}>}
 */
export async function fitSlot(record, fonts) {
  const smallest = SLOT_SIZES[SLOT_SIZES.length - 1];
  let width = 0;
  for (const size of SLOT_SIZES) {
    width = await measureSlotAt(record, fonts, size);
    if (width <= CARD_INNER_WIDTH) return { ok: true, size, width };
  }
  return { ok: false, size: smallest, width };
}

/**
 * The reason string for a slot that overflows even at the smallest step.
 * @param {{slot: string}} record
 * @param {number} width
 * @returns {string}
 */
export function overflowReason(record, width) {
  return (
    `the headline slot '${record.slot}' measures ${Math.round(width)}px at the smallest ` +
    `step (${SLOT_SIZES[SLOT_SIZES.length - 1]}px), past the ${CARD_INNER_WIDTH}px inner box`
  );
}

/**
 * Lay the slot row out at one specific size and read back its rendered width.
 * @param {{slot: string, unit: string|null}} record
 * @param {{name: string, data: Buffer, weight: number, style: string}[]} fonts
 * @param {number} size
 * @returns {Promise<number>}
 */
async function measureSlotAt(record, fonts, size) {
  const probe = h(
    'div',
    {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fontFamily: 'Manrope',
    },
    [slotRow(record, { backgroundColor: MEASURE_FILL }, size)]
  );

  const svg = await satori(probe, { width: CARD_WIDTH, height: CARD_HEIGHT, fonts });

  // satori always emits a root canvas rect at the full 1200px, so the row is
  // identified by its sentinel fill rather than by taking the widest rect.
  const pattern = new RegExp(`<rect[^>]*\\swidth="([\\d.]+)"[^>]*fill="${MEASURE_FILL}"`, 'g');
  const widths = [...svg.matchAll(pattern)].map((m) => Number(m[1]));
  if (widths.length === 0) {
    throw new Error(
      `measureSlot could not read a laid-out width for slot '${record.slot}'. ` +
        `The satori output carried no background rect, so the overflow rule ` +
        `cannot be asserted — fix the measurement, do not skip it.`
    );
  }
  return Math.max(...widths);
}
