import React from 'react'
import { strings } from '@/agency/lang/agency'

const AgencyPlaceholder = ({ title }: { title: string }) => (
  <div className="agency-page">
    <div className="agency-page-head">
      <h2>{title}</h2>
      <p>{strings.COMING_SOON}</p>
    </div>
    <div className="agency-empty-stage">
      <div className="agency-empty-ring" aria-hidden />
      <p>{strings.COMING_SOON}</p>
    </div>
  </div>
)

export const AgencyBookings = () => <AgencyPlaceholder title={strings.BOOKINGS} />
export const AgencyInvoices = () => <AgencyPlaceholder title={strings.INVOICES} />
export const AgencyContact = () => <AgencyPlaceholder title={strings.CONTACT} />
export const AgencyReceipts = () => <AgencyPlaceholder title={strings.RECEIPTS} />
export const AgencySubscription = () => <AgencyPlaceholder title={strings.SUBSCRIPTION} />
export const AgencyMaintenance = () => <AgencyPlaceholder title={strings.MAINTENANCE} />
