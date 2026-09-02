import React from 'react'
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/offer'
import { ProtectionRow } from '@/utils/offerProtectionHelper'

interface OfferProtectionTableProps {
  rows: ProtectionRow[]
  franchiseFormatted: string
  protectionPriceFormatted: string
  language: string
}

const OfferProtectionTable = ({
  rows,
  franchiseFormatted,
  protectionPriceFormatted,
  language,
}: OfferProtectionTableProps) => {
  const getRowLabel = (key: string) => {
    const map: Record<string, string> = {
      PROTECTION_ROW_THEFT: strings.PROTECTION_ROW_THEFT,
      PROTECTION_ROW_BODYWORK: strings.PROTECTION_ROW_BODYWORK,
      PROTECTION_ROW_OTHER: strings.PROTECTION_ROW_OTHER,
      PROTECTION_ROW_BREAKDOWN: strings.PROTECTION_ROW_BREAKDOWN,
      PROTECTION_ROW_MISC: strings.PROTECTION_ROW_MISC,
    }
    return map[key] || key
  }

  const renderCell = (row: ProtectionRow, isFull: boolean) => {
    const covered = isFull ? row.fullCovered : row.basicCovered
    if (covered) {
      const franchiseText = row.id === 'bodywork' && !isFull
        ? strings.PROTECTION_PAY_FRANCHISE_UPTO.replace('{amount}', franchiseFormatted)
        : strings.PROTECTION_PAY_FRANCHISE.replace('{amount}', franchiseFormatted)
      return (
        <div className={`offer-protection-cell${isFull ? ' full' : ''}`}>
          <CheckIcon className="offer-protection-icon check" />
          <span>{isFull ? strings.PROTECTION_REFUND : franchiseText}</span>
          <span className={`offer-protection-tag${isFull ? ' refund' : ''}`}>
            {isFull ? strings.PROTECTION_TAG_REFUND : strings.PROTECTION_TAG_NO_REFUND}
          </span>
        </div>
      )
    }
    return (
      <div className="offer-protection-cell">
        <CloseIcon className="offer-protection-icon cross" />
        <span>{strings.PROTECTION_PAY_FULL}</span>
        <span className="offer-protection-tag">{strings.PROTECTION_TAG_NO_REFUND}</span>
      </div>
    )
  }

  return (
    <div className="offer-protection-table-wrap">
      <table className="offer-protection-table">
        <thead>
          <tr>
            <th>{strings.PROTECTION_COL_COVERED}</th>
            <th>{strings.PROTECTION_COL_BASIC}</th>
            <th className="full-col">{strings.PROTECTION_COL_FULL}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="offer-protection-label">{getRowLabel(row.label)}</td>
              <td>{renderCell(row, false)}</td>
              <td className="full-col">{renderCell(row, true)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td>
              <strong>{strings.PROTECTION_WITHOUT_PRICE}</strong>
              {' '}
              {bookcarsHelper.formatPrice(0, commonStrings.CURRENCY, language)}
            </td>
            <td className="full-col">
              <strong>{strings.PROTECTION_FULL_PRICE}</strong>
              {' '}
              <span className="offer-protection-price">{protectionPriceFormatted}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default OfferProtectionTable
