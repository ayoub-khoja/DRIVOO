/**
 * French number spelling, used for the legal wording printed at the bottom of an
 * invoice: "Arrêtée la présente facture à la somme de : Quatre cent cinquante-et-un dinars."
 *
 * Follows the classic (non-rectified) French orthography used on Tunisian invoices:
 * "et-un" for 21/31/../71, "quatre-vingts" only when it ends the group, plural "cents"
 * only when it ends the group, invariable "mille".
 */

const UNITS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf',
]

const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt']

/**
 * Spell an integer strictly below 100.
 */
const spellBelowHundred = (n: number): string => {
  if (n < 20) {
    return UNITS[n]
  }

  const ten = Math.floor(n / 10)
  const unit = n % 10

  // 70-79 and 90-99 are built on soixante/quatre-vingt + 10..19
  if (ten === 7 || ten === 9) {
    const base = TENS[ten]
    const rest = UNITS[10 + unit]
    // 71 = soixante-et-onze, but 91 = quatre-vingt-onze (no "et")
    if (unit === 1 && ten === 7) {
      return `${base}-et-${rest}`
    }
    return `${base}-${rest}`
  }

  const base = TENS[ten]
  if (unit === 0) {
    // quatre-vingts takes an "s" when nothing follows
    return ten === 8 ? `${base}s` : base
  }
  // 21, 31, 41, 51, 61 take "et un"; 81 does not
  if (unit === 1 && ten !== 8) {
    return `${base}-et-un`
  }
  return `${base}-${UNITS[unit]}`
}

/**
 * Spell an integer strictly below 1000.
 */
const spellBelowThousand = (n: number): string => {
  if (n < 100) {
    return spellBelowHundred(n)
  }

  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const prefix = hundreds === 1 ? 'cent' : `${UNITS[hundreds]} cent`

  if (rest === 0) {
    // "cents" takes an "s" only when it ends the group: deux cents / deux cent un
    return hundreds === 1 ? 'cent' : `${prefix}s`
  }
  return `${prefix} ${spellBelowThousand(rest)}`
}

const SCALES: { value: number, singular: string, plural: string }[] = [
  { value: 1e9, singular: 'milliard', plural: 'milliards' },
  { value: 1e6, singular: 'million', plural: 'millions' },
  { value: 1e3, singular: 'mille', plural: 'mille' },
]

/**
 * Spell a non-negative integer in French.
 *
 * @param {number} value
 * @returns {string}
 */
export const spellInteger = (value: number): string => {
  const n = Math.floor(Math.abs(value))
  if (n === 0) {
    return UNITS[0]
  }

  const parts: string[] = []
  let rest = n

  for (const scale of SCALES) {
    const count = Math.floor(rest / scale.value)
    if (count === 0) {
      continue
    }
    rest %= scale.value

    // "cents"/"quatre-vingts" lose their "s" when a scale word follows:
    // cinq cent mille, quatre-vingt mille — not "cinq cents mille".
    const group = spellBelowThousand(count).replace(/(cent|vingt)s$/, '$1')

    // "mille" is invariable and drops the leading "un": mille, deux mille
    if (scale.value === 1e3) {
      parts.push(count === 1 ? 'mille' : `${group} mille`)
    } else {
      const label = count === 1 ? scale.singular : scale.plural
      parts.push(`${group} ${label}`)
    }
  }

  if (rest > 0) {
    parts.push(spellBelowThousand(rest))
  }

  return parts.join(' ')
}

/**
 * Capitalize the first letter only, the way it is printed on the invoice.
 */
const capitalize = (text: string): string => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text)

/**
 * Spell a monetary amount for the invoice footer wording.
 * The Tunisian dinar is divided into 1000 millimes.
 *
 * @example spellAmount(451) -> "Quatre cent cinquante-et-un dinars"
 * @example spellAmount(451.5, 'TND') -> "Quatre cent cinquante-et-un dinars et cinq cents millimes"
 *
 * @param {number} amount
 * @param {string} [currency='TND']
 * @returns {string}
 */
export const spellAmount = (amount: number, currency = 'TND'): string => {
  const safe = Number.isFinite(amount) ? Math.abs(amount) : 0
  const integer = Math.floor(safe)
  // Round to the millime to avoid 0.4999999 style artefacts
  const fraction = Math.round((safe - integer) * 1000)

  const isDinar = (currency || 'TND').toUpperCase() === 'TND'
  const spelledInteger = spellInteger(integer)
  // "un million de dinars", not "un million dinars": a scale word ending the number takes "de"
  const endsOnScale = /(millions?|milliards?)$/.test(spelledInteger)
  const majorLabel = isDinar
    ? (integer > 1 ? 'dinars' : 'dinar')
    : currency.toUpperCase()

  let text = `${spelledInteger} ${endsOnScale ? 'de ' : ''}${majorLabel}`

  if (fraction > 0) {
    const minorLabel = isDinar
      ? (fraction > 1 ? 'millimes' : 'millime')
      : 'centimes'
    text += ` et ${spellInteger(fraction)} ${minorLabel}`
  }

  return capitalize(text)
}
