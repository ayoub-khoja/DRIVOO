import axiosInstance from './axiosInstance'

export type DocumentKind = 'contract' | 'invoice' | 'receipt'

export type VerifiedDocument = {
  valid: boolean
  kind: DocumentKind
  number: string
  issueDate: string
  issueCity?: string
  agency: {
    fullName: string
    avatar?: string
    city?: string
    phone?: string
  }
  contract?: {
    vehicleModel: string
    vehiclePlate: string
    driverName: string
    departureDate: string
    returnDate: string
    departurePlace: string
    returnPlace: string
    currency: string
    totalTTC: number
  }
  invoice?: {
    clientName: string
    object: string
    currency: string
    totalTTC: number
    balanceDue: number
  }
  receipt?: {
    clientName: string
    description: string
    amount: number
    currency: string
    paymentMethod: string
    vehicleLabel: string
  }
  message?: string
}

export const verifyDocument = (
  kind: string,
  id: string,
): Promise<VerifiedDocument> =>
  axiosInstance
    .get(`/api/public/document/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`)
    .then((res) => res.data)
