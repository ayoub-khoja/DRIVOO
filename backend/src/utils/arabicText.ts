import path from 'node:path'
import fs from 'node:fs'
import * as logger from './logger'

/**
 * Arabic font support for PDFKit.
 *
 * Amiri + fontkit shape Arabic and resolve RTL. Avoid Unicode bidi control
 * characters (no glyphs in Amiri → ▯, and they scramble word order).
 */

const FONT_DIR = 'node_modules/@expo-google-fonts/amiri'

export const ARABIC_FONT = 'Amiri'
export const ARABIC_FONT_BOLD = 'Amiri-Bold'

let cachedFonts: Record<string, Buffer> | null | undefined

/**
 * Load and cache the Amiri faces. Resolves to null when the package is missing, so
 * callers can fall back to a French-only document instead of failing.
 *
 * @returns {Record<string, Buffer> | null}
 */
export const loadArabicFonts = (): Record<string, Buffer> | null => {
  if (cachedFonts !== undefined) {
    return cachedFonts
  }

  const files: [string, string][] = [
    [ARABIC_FONT, '400Regular/Amiri_400Regular.ttf'],
    [ARABIC_FONT_BOLD, '700Bold/Amiri_700Bold.ttf'],
  ]

  try {
    const fonts: Record<string, Buffer> = {}
    for (const [name, file] of files) {
      fonts[name] = fs.readFileSync(path.join(process.cwd(), FONT_DIR, file))
    }
    cachedFonts = fonts
  } catch (err) {
    logger.info('[arabicText] Amiri font unavailable, Arabic column will be skipped', err)
    cachedFonts = null
  }

  return cachedFonts
}

/** OpenType feature that keeps Arabic words in visual RTL order in PDFKit. */
export const ARABIC_TEXT_FEATURES: ('rtla')[] = ['rtla']

/**
 * `rtla` also mirrors digit runs (110 → 011), parentheses (() → )),
 * and Latin runs ("Ayoub" → "buoyA"). Pre-adjust those in logical source
 * so the visual result stays correct after shaping.
 *
 * Latin phrases use NBSP so PDFKit does not wrap mid-name; a line that
 * starts with Latin leaves the following Arabic unshaped/reversed.
 */
export const prepareArabicForPdf = (text: string): string =>
  (text || '')
    .replace(/\d+/g, (digits) => digits.split('').reverse().join(''))
    .replace(/[()]/g, (ch) => (ch === '(' ? ')' : '('))
    .replace(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[\s'’.-]*[A-Za-zÀ-ÖØ-öø-ÿ]+)*/g, (latin) =>
      latin.replace(/ /g, '\u00A0').split('').reverse().join(''),
    )
    // Keep Latin on the same line as the preceding Arabic word.
    .replace(/(\S)\s+(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1\u00A0')

/** Shared PDFKit options for Arabic paragraphs (whole-string layout, no LTR word splitting). */
export const arabicTextOptions = (
  width: number,
  extra?: { lineBreak?: boolean },
): {
  width: number
  align: 'right'
  features: ('rtla')[]
  lineBreak?: boolean
} => ({
  width,
  align: 'right',
  features: ARABIC_TEXT_FEATURES,
  ...extra,
})
