import type {
  AgencyReceipt,
  AgencyReceiptInput,
  AgencyReceiptListResult,
} from '@/agency/types/receipt'

const storageKey = (agencyId: string) => `drivoo.agency.receipts.${agencyId}`

const readAll = (agencyId: string): AgencyReceipt[] => {
  try {
    const raw = localStorage.getItem(storageKey(agencyId))
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as AgencyReceipt[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeAll = (agencyId: string, rows: AgencyReceipt[]) => {
  localStorage.setItem(storageKey(agencyId), JSON.stringify(rows))
}

const nextNumber = (rows: AgencyReceipt[]) => {
  const year = new Date().getFullYear()
  const prefix = `REC-${year}-`
  const seq = rows
    .map((row) => {
      if (!row.number.startsWith(prefix)) {
        return 0
      }
      return Number.parseInt(row.number.slice(prefix.length), 10) || 0
    })
    .reduce((max, n) => Math.max(max, n), 0)

  return `${prefix}${String(seq + 1).padStart(4, '0')}`
}

/**
 * Local receipts store (per agency). Swap for API later without changing callers.
 */
export const listReceipts = async (
  agencyId: string,
  keyword = '',
  page = 1,
  pageSize = 10,
): Promise<AgencyReceiptListResult> => {
  const all = readAll(agencyId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const q = keyword.trim().toLowerCase()
  const filtered = q
    ? all.filter((row) => (
      row.number.toLowerCase().includes(q)
      || row.clientName.toLowerCase().includes(q)
      || (row.vehicleLabel || '').toLowerCase().includes(q)
      || row.description.toLowerCase().includes(q)
    ))
    : all

  const start = (page - 1) * pageSize
  return {
    rows: filtered.slice(start, start + pageSize),
    totalRecords: filtered.length,
    page,
    pageSize,
  }
}

export const createReceipt = async (
  agencyId: string,
  input: AgencyReceiptInput,
): Promise<AgencyReceipt> => {
  const all = readAll(agencyId)
  const now = new Date().toISOString()
  const receipt: AgencyReceipt = {
    _id: crypto.randomUUID(),
    number: nextNumber(all),
    agencyId,
    createdAt: now,
    paidAt: input.paidAt || now.slice(0, 10),
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail?.trim() || undefined,
    clientPhone: input.clientPhone?.trim() || undefined,
    vehicleLabel: input.vehicleLabel?.trim() || undefined,
    description: input.description.trim(),
    amount: Number(input.amount),
    currency: input.currency || 'TND',
    paymentMethod: input.paymentMethod,
    notes: input.notes?.trim() || undefined,
  }
  writeAll(agencyId, [receipt, ...all])
  return receipt
}

export const deleteReceipt = async (agencyId: string, receiptId: string): Promise<void> => {
  writeAll(agencyId, readAll(agencyId).filter((row) => row._id !== receiptId))
}

export const getReceiptStats = (agencyId: string) => {
  const all = readAll(agencyId)
  const now = new Date()
  const monthTotal = all
    .filter((row) => {
      const d = new Date(row.paidAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, row) => sum + row.amount, 0)

  return {
    count: all.length,
    monthTotal,
    lastNumber: all[0]?.number || null,
  }
}
