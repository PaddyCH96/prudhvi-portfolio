// Build gate: proves every bundled font is a static instance before satori parses it.
// This is a gate, not a fallback — falling back to a system font inside satori would
// silently render a different card than the one that was designed (D-10).
//
// The fonts live under src/assets/ and are read at build time only. They are never
// copied to public/ and no @font-face rule references them: a visitor downloads no
// font, the site keeps its system stack (D-09).
import fs from 'node:fs';

/**
 * Reads a TTF and throws if it carries an `fvar` table (i.e. it is a variable font).
 * Returns the font buffer so callers can hand it straight to satori.
 */
export function assertStaticTtf(path) {
  const b = fs.readFileSync(path);
  const n = b.readUInt16BE(4); // numTables, from the offset table
  const tags = Array.from({ length: n }, (_, i) =>
    b.toString('ascii', 12 + i * 16, 16 + i * 16)
  );
  if (tags.includes('fvar')) {
    throw new Error(
      `${path} is a VARIABLE font (fvar table present). satori parses fonts with ` +
        `opentype.js and throws "Cannot read properties of undefined (reading '256')" on ` +
        `variable fonts. Ship the static instance, not Manrope[wght].ttf.`
    );
  }
  return b;
}

const FACES = [
  { file: 'manrope-v20-latin-regular.ttf', weight: 400 },
  { file: 'manrope-v20-latin-700.ttf', weight: 700 },
];

/** Validates both bundled faces and returns them in the `fonts` array shape satori wants. */
export async function verifyFonts() {
  return FACES.map(({ file, weight }) => ({
    name: 'Manrope',
    data: assertStaticTtf(
      new URL(`../src/assets/fonts/${file}`, import.meta.url).pathname
    ),
    weight,
    style: 'normal',
  }));
}
