/** Shared helpers for agency period-recap views (contracts / invoices / receipts). */

export const toDateInput = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const defaultRecapPeriod = () => {
  const now = new Date()
  return {
    from: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toDateInput(now),
  }
}

export const periodPresetRange = (monthsBack: number) => {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - (monthsBack - 1), 1)
  return {
    from: toDateInput(start),
    to: toDateInput(end),
  }
}
