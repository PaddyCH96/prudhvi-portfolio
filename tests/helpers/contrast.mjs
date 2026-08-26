// WCAG contrast maths, shared by the token gate and the visual sweep.
//
// No dependencies on purpose: this is the helper every contrast assertion in
// Phase 3 leans on, and a wrong answer here would silently pass a failing
// design rather than fail loudly. Short enough to read end to end.

/** Expand #abc to #aabbcc, and strip the leading hash. */
function normalise(hex) {
  const h = hex.trim().replace(/^#/, '');
  if (h.length === 3) return h.split('').map((c) => c + c).join('');
  if (h.length === 6) return h;
  if (h.length === 8) return h.slice(0, 6); // drop alpha; composite() handles blending
  throw new Error(`not a hex colour: ${hex}`);
}

function channels(hex) {
  const h = normalise(hex);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/**
 * WCAG 2.x relative luminance of an opaque sRGB colour.
 * @param {string} hex
 * @returns {number} 0 (black) to 1 (white)
 */
export function relativeLuminance(hex) {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two opaque colours. Order-independent.
 * @returns {number} 1 (identical) to 21 (black on white)
 */
export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Alpha-blend one `rgba(r, g, b, a)` layer over an opaque hex base.
 *
 * The hero stacks translucent layers, so its text sits on a composited colour
 * that appears nowhere in the token table — contrast has to be measured against
 * the blend, not against the token underneath it.
 *
 * @param {string} baseHex opaque backdrop
 * @param {string} overlayRgba e.g. "rgba(255, 255, 255, 0.06)"
 * @returns {string} the resulting opaque colour as #rrggbb
 */
export function composite(baseHex, overlayRgba) {
  const m = overlayRgba
    .trim()
    .match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (!m) throw new Error(`not an rgba() colour: ${overlayRgba}`);

  const [or, og, ob] = [m[1], m[2], m[3]].map(Number);
  const alpha = m[4] === undefined ? 1 : Number(m[4]);
  if (alpha < 0 || alpha > 1) throw new Error(`alpha out of range: ${overlayRgba}`);

  const blended = channels(baseHex).map((base, i) => {
    const over = [or, og, ob][i];
    return Math.round(over * alpha + base * (1 - alpha));
  });

  return '#' + blended.map((v) => v.toString(16).padStart(2, '0')).join('');
}
