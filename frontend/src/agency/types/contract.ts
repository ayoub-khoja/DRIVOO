import type * as bookcarsTypes from ':bookcars-types'

export type AgencyContractParty = bookcarsTypes.AgencyContractParty
export type AgencyContractSupplement = bookcarsTypes.AgencyContractSupplement
export type AgencyContractPayment = bookcarsTypes.AgencyContractPayment
export type AgencyContractCheck = bookcarsTypes.AgencyContractCheck
export type AgencyContract = bookcarsTypes.AgencyContract
export type AgencyContractInput = bookcarsTypes.CreateAgencyContractPayload
export type AgencyContractStats = bookcarsTypes.AgencyContractStats
export type AgencyContractListResult = bookcarsTypes.AgencyContractResult

/** Payment channels offered on a rental contract, in the order they are printed. */
export const CONTRACT_PAYMENT_METHODS = ['Espèce', 'Chèque', 'Traite', 'TPE', 'Virement'] as const

/** Settlement states printed in the "ÉTAT" column. */
export const CONTRACT_PAYMENT_STATUSES = ['Reçu', 'En attente', 'Annulé'] as const

/** Daily mileage packages offered on the paper form. */
export const CONTRACT_KM_PACKAGES = [200, 300, 400] as const

/**
 * Walk-around checklist printed under the vehicle diagram.
 * Keep in sync with `backend/src/utils/contractTerms.ts`.
 */
export const CONTRACT_CHECKLIST: { key: string, label: string }[] = [
  { key: 'wheels', label: 'Roues' },
  { key: 'jack', label: 'Crick + outils' },
  { key: 'hubcaps', label: 'Enjoliveurs' },
  { key: 'ashtray', label: 'Cendrier' },
  { key: 'mats', label: 'Tapis' },
  { key: 'mirror', label: 'Rétroviseur' },
  { key: 'windshield', label: 'Bris de glace' },
  { key: 'headlights', label: 'Phares' },
  { key: 'radio', label: 'Radio' },
  { key: 'antenna', label: 'Antenne' },
  { key: 'wipers', label: 'Essuie-glaces' },
  { key: 'doorLock', label: 'Serrure de porte' },
  { key: 'ceiling', label: 'Plafonnier' },
  { key: 'windowLift', label: 'Lève-vitre' },
  { key: 'cleanliness', label: 'Propreté intérieure' },
  { key: 'handles', label: 'Poignées' },
  { key: 'seatbelt', label: 'Ceinture de sécurité' },
  { key: 'ac', label: 'Climatiseur' },
  { key: 'heating', label: 'Chauffage' },
  { key: 'babySeat', label: 'Siège bébé' },
]

export const EMPTY_PARTY: AgencyContractParty = {
  fullName: '',
  birthDate: '',
  idNumber: '',
  nationality: '',
  licenseNumber: '',
  licenseIssuedAt: '',
  address: '',
  phone: '',
}
