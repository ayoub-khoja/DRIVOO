import path from 'node:path'
import fs from 'node:fs'
import * as logger from './logger'

/**
 * Arabic font support for PDFKit.
 *
 * PDFKit lays text out through fontkit, which already applies the OpenType Arabic
 * features (init / medi / fina / rlig) and returns right-to-left runs in visual
 * order. No reshaping or bidi pass is needed here - the only missing piece is a
 * font, since the 14 built-in PDF fonts are Latin only.
 *
 * Amiri (SIL Open Font License) is used: the full TTF from `@expo-google-fonts/amiri`
 * covers Arabic, Latin, digits and punctuation in one file, so a mixed line such as
 * "110 km/h" inside Arabic text renders without any glyph gap.
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
