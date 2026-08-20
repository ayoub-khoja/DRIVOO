import { strings } from '@/agency/lang/agency'
import type { AgencyReceiptPaymentMethod } from '@/agency/types/receipt'

export const paymentLabel = (method: AgencyReceiptPaymentMethod) => {
  switch (method) {
    case 'cash':
      return strings.RECEIPT_PAY_CASH
    case 'card':
      return strings.RECEIPT_PAY_CARD
    case 'transfer':
      return strings.RECEIPT_PAY_TRANSFER
    case 'cheque':
      return strings.RECEIPT_PAY_CHEQUE
    default:
      return method
  }
}

export const formatReceiptDate = (value: string, language: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-TN' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
