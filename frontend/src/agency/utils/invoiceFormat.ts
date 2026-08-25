/**
 * A Tunisian RIB is the IBAN without its country code and 2 check digits:
 * TN5903211121011500454538 → 03211121011500454538.
 */
export const ribFromIban = (iban?: string | null): string => {
  const clean = (iban || '').replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}/.test(clean)) {
    return ''
  }
  return clean.slice(4)
}

/** "30/08/2025" — the date format used on the printed invoice. */
export const formatInvoiceDate = (value?: string | Date | null): string => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

/** "23-12-2024 à 16:00" — the period format used inside a designation cell. */
export const formatPeriodStamp = (value?: string | null): string => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}-${month}-${date.getFullYear()} à ${hours}:${minutes}`
}

/** Joins the parts of a footer / contact line, dropping the empty ones. */
export const joinParts = (parts: (string | undefined | null)[], separator = ' | '): string =>
  parts.map((part) => (part || '').trim()).filter(Boolean).join(separator)
