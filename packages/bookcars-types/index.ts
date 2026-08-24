export enum UserType {
  Admin = 'admin',
  Supplier = 'supplier',
  User = 'user',
}

export enum AppType {
  Admin = 'admin',
  Frontend = 'frontend',
  Agency = 'agency',
}

export enum CarType {
  Diesel = 'diesel',
  Gasoline = 'gasoline',
  Electric = 'electric',
  Hybrid = 'hybrid',
  PlugInHybrid = 'plugInHybrid',
  Unknown = 'unknown',
}

export enum CarRange {
  Mini = 'mini', // car
  Midi = 'midi', // suv
  Maxi = 'maxi', // van
  Scooter = 'scooter',
  Bus = 'bus',
  Truck = 'truck',
  Caravan = 'caravan',
}

export enum CarMultimedia {
  Touchscreen = 'touchscreen',
  Bluetooth = 'bluetooth',
  AndroidAuto = 'androidAuto',
  AppleCarPlay = 'appleCarPlay',
}

export enum GearboxType {
  Manual = 'manual',
  Automatic = 'automatic',
}

export enum DeliveryType {
  Airport = 'airport',
  Office = 'office',
  Delivery = 'delivery',
}

export enum FuelPolicy {
  LikeForLike = 'likeForlike',
  FreeTank = 'freeTank',
  FullToFull = 'fullToFull',
  FullToEmpty = 'FullToEmpty',
}

export enum BookingStatus {
  Void = 'void',
  Pending = 'pending',
  Deposit = 'deposit',
  Paid = 'paid',
  PaidInFull = 'paidInFull',
  Reserved = 'reserved',
  Cancelled = 'cancelled',
}

export enum Mileage {
  Limited = 'limited',
  Unlimited = 'unlimited',
}

export enum Availablity {
  Available = 'available',
  Unavailable = 'unavailable',
}

export enum RecordType {
  Admin = 'admin',
  Supplier = 'supplier',
  User = 'user',
  Car = 'car',
  Location = 'location',
  Country = 'country',
}

export enum PaymentGateway {
  PayPal = 'payPal',
  Stripe = 'stripe',
}

export interface Booking {
  _id?: string
  supplier: string | User
  car: string | Car
  driver?: string | User
  pickupLocation: string | Location
  dropOffLocation: string | Location
  from: Date
  to: Date
  status: BookingStatus
  cancellation?: boolean
  amendments?: boolean
  theftProtection?: boolean
  collisionDamageWaiver?: boolean
  fullInsurance?: boolean
  additionalDriver?: boolean
  _additionalDriver?: string | AdditionalDriver
  cancelRequest?: boolean
  price?: number
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
  expireAt?: Date
  isDeposit?: boolean
  isPayedInFull?: boolean
  paypalOrderId?: string
}

export interface CheckoutPayload {
  driver?: User
  booking?: Booking
  additionalDriver?: AdditionalDriver
  payLater: boolean
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
  payPal?: boolean
}

export interface Filter {
  from?: Date
  dateBetween?: Date
  to?: Date
  keyword?: string
  pickupLocation?: string
  dropOffLocation?: string
}

export interface GetBookingsPayload {
  suppliers: string[]
  statuses: string[]
  user?: string
  car?: string
  filter?: Filter
}

export interface AdditionalDriver {
  fullName: string
  email: string
  phone: string
  birthDate: Date
}

export interface UpsertBookingPayload {
  booking: Booking
  additionalDriver?: AdditionalDriver
}

export interface LocationName {
  language: string
  name: string
}

export interface CountryName {
  language: string
  name: string
}

export interface UpsertLocationPayload {
  country: string
  longitude?: number
  latitude?: number
  names: LocationName[]
  image?: string | null
  parkingSpots?: ParkingSpot[]
  supplier?: string
  parentLocation?: string
}

export interface UpdateSupplierPayload {
  _id: string
  fullName: string
  phone: string
  location: string
  bio: string
  payLater: boolean
  licenseRequired: boolean
  minimumRentalDays?: number
  priceChangeRate?: number
  supplierCarLimit?: number
  notifyAdminOnNewCar?: boolean
  blacklisted?: boolean
}

export interface CreateSubAgencyPayload {
  fullName: string
  email: string
  phone?: string
  city?: string
  address?: string
  governorate?: string
}

export interface SubAgency {
  _id: string
  fullName: string
  email?: string
  phone?: string
  city?: string
  address?: string
  governorate?: string
  avatar?: string
  active?: boolean
  agencyApproved?: boolean
  carCount?: number
  createdAt?: Date | string
}

export interface UpdateAgencyProfilePayload {
  fullName: string
  phone?: string
  phone2?: string
  phone3?: string
  whatsapp?: string
  website?: string
  bio?: string
  address?: string
  city?: string
  governorate?: string
  postalCode?: string
  taxId?: string
  rneNumber?: string
  iban?: string
  legalRepFirstName?: string
  legalRepLastName?: string
  legalRepTitle?: string
  legalRepCin?: string
  invoicePrefix?: string
  invoiceVatRate?: number
  invoiceStampDuty?: number
}

export interface AgencyInvoiceLine {
  /** Free text designation, e.g. "Location véhicule" */
  designation: string
  /** Rental contract reference printed next to the designation, e.g. "RA218424" */
  contractNumber?: string
  /** Vehicle + license plate, e.g. "MAHINDRA KUV 100 · Immatriculation : 8810 TU 230" */
  vehicleLabel?: string
  /** Rental period start, ISO datetime */
  periodFrom?: string
  /** Rental period end, ISO datetime */
  periodTo?: string
  /** UNITE column */
  quantity: number
  /** PRIX UNIT. column (excluding tax) */
  unitPrice: number
  /** PRIX TOTAL column = quantity * unitPrice */
  total: number
}

export interface AgencyInvoicePayments {
  /** Espèce */
  cash: number
  /** Chèque */
  cheque: number
  /** Traite */
  draft: number
  /** TPE */
  card: number
  /** Virement */
  transfer: number
}

export interface AgencyInvoice {
  _id: string
  /** Sequential number allocated server side, e.g. "FA0003-2025" */
  number: string
  issueCity: string
  issueDate: string
  clientCode?: string
  clientName: string
  clientIdNumber?: string
  clientPhone?: string
  clientAddress?: string
  /** Objet, e.g. "Location d'un véhicule du … au …" */
  object: string
  lines: AgencyInvoiceLine[]
  discount: number
  /** VAT percentage, e.g. 19 */
  vatRate: number
  /** Timbre fiscal */
  stampDuty: number
  payments: AgencyInvoicePayments
  currency: string
  notes?: string
  totalGross: number
  totalHT: number
  totalVAT: number
  totalTTC: number
  totalPaid: number
  balanceDue: number
  createdAt?: Date | string
}

export type CreateAgencyInvoicePayload = Omit<
  AgencyInvoice,
  '_id' | 'number' | 'createdAt' | 'totalGross' | 'totalHT' | 'totalVAT' | 'totalTTC' | 'totalPaid' | 'balanceDue'
>

export interface AgencyInvoiceStats {
  count: number
  monthTotal: number
  lastNumber: string | null
}

export interface AgencyInvoiceResult {
  rows: AgencyInvoice[]
  totalRecords: number
  page: number
  pageSize: number
  stats: AgencyInvoiceStats
}

export interface AgencyLogoPayload {
  avatar: string
}

export interface AgencyShareLink {
  slug: string
  url: string
}

export interface PublicAgencyProfile {
  slug: string
  fullName: string
  avatar?: string
  bio?: string
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  city?: string
  governorate?: string
  postalCode?: string
  latitude?: number
  longitude?: number
  agencyApproved?: boolean
  carCount?: number
}

export interface PublicAgencyCar {
  _id: string
  name: string
  brand?: string
  model?: string
  year?: number
  image?: string
  dailyPrice: number
  seats?: number
  doors?: number
  gearbox?: string
  type?: string
  available?: boolean
}

export enum AgencyReviewStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export interface AgencyReview {
  _id: string
  name: string
  email?: string
  rating: number
  comment: string
  status?: AgencyReviewStatus
  createdAt?: Date | string
}

export interface AgencyReviewList {
  average: number
  count: number
  pendingCount?: number
  rejectedCount?: number
  reviews: AgencyReview[]
}

export interface CreateAgencyReviewPayload {
  name: string
  email?: string
  rating: number
  comment: string
}

export interface ModerateAgencyReviewPayload {
  status: AgencyReviewStatus.Approved | AgencyReviewStatus.Rejected
}

export interface LocalizedName {
  fr: string
  en: string
  ar: string
}

export interface GeoCity {
  id: number
  names: LocalizedName
  latitude: number
  longitude: number
}

export interface GeoMunicipality {
  id: number
  cityId: number
  names: LocalizedName
  latitude: number
  longitude: number
}

export interface GeoCatalog {
  cities: GeoCity[]
  municipalities: GeoMunicipality[]
}

export interface CreateCarPayload {
  loggedUser: string
  name: string
  licensePlate?: string
  supplier: string
  minimumAge: number
  locations: string[]

  // fleet extended fields
  brand?: string
  model?: string
  year?: number
  chassisNumber?: string
  registrationDoc?: string
  insuranceExpiry?: Date | string
  technicalVisitExpiry?: Date | string
  nextOilChange?: Date | string
  deliveryType?: DeliveryType | string

  // price fields
  hourlyPrice: number | null
  discountedHourlyPrice: number | null
  dailyPrice: number
  discountedDailyPrice: number | null
  biWeeklyPrice: number | null
  discountedBiWeeklyPrice: number | null
  weeklyPrice: number | null
  discountedWeeklyPrice: number | null
  monthlyPrice: number | null
  discountedMonthlyPrice: number | null
  // date based price
  isDateBasedPrice: boolean
  dateBasedPrices: DateBasedPrice[]

  deposit: number
  available: boolean
  fullyBooked?: boolean
  comingSoon?: boolean
  type: string
  gearbox: string
  aircon: boolean
  image?: string
  seats: number
  doors: number
  fuelPolicy: string
  mileage: number
  cancellation: number
  amendments: number
  theftProtection: number
  collisionDamageWaiver: number
  fullInsurance: number
  additionalDriver: number
  range: string
  multimedia: string[]
  rating?: number
  co2?: number
  blockOnPay?: boolean
}

export interface UpdateCarPayload extends CreateCarPayload {
  _id: string
}

export interface CarSpecs {
  aircon?: boolean,
  moreThanFourDoors?: boolean,
  moreThanFiveSeats?: boolean,
}

export interface GetCarsPayload {
  suppliers?: string[]
  carSpecs?: CarSpecs
  carType?: string[]
  gearbox?: string[]
  mileage?: string[]
  fuelPolicy?: string[]
  deposit?: number
  availability?: string[]
  pickupLocation?: string
  ranges?: string[]
  multimedia?: string[]
  rating?: number
  seats?: number
  includeAlreadyBookedCars?: boolean
  includeComingSoonCars?: boolean
  from?: Date
  to?: Date
}

export interface SignUpPayload {
  email: string
  password?: string
  fullName: string
  phone?: string
  language: string
  active?: boolean
  verified?: boolean
  blacklisted?: boolean
  type?: string
  avatar?: string
  birthDate?: number | Date
  /** Agency / supplier application fields */
  taxId?: string
  rneNumber?: string
  rneDocument?: string
  address?: string
  city?: string
  governorate?: string
  postalCode?: string
  iban?: string
  legalRepFirstName?: string
  legalRepLastName?: string
  legalRepTitle?: string
  legalRepCin?: string
  whatsapp?: string
  agencyApproved?: boolean
}

export type Contract = { language: string, file: string | null }

export interface CreateUserPayload {
  email?: string
  phone: string
  location: string
  bio: string
  fullName: string
  type?: string
  avatar?: string
  birthDate?: number | Date
  language?: string
  password?: string
  verified?: boolean
  blacklisted?: boolean
  payLater?: boolean
  supplier?: string
  contracts?: Contract[]
  licenseRequired?: boolean
  minimumRentalDays?: number
  license?: string
  priceChangeRate?: number
  supplierCarLimit?: number
  notifyAdminOnNewCar?: boolean
}

export interface UpdateUserPayload extends CreateUserPayload {
  _id: string
  enableEmailNotifications?: boolean
}

export interface ChangePasswordPayload {
  _id: string
  password: string
  newPassword: string
  strict: boolean
}

export interface ActivatePayload {
  userId: string
  token: string
  password: string
}

export interface ValidateEmailPayload {
  email: string
  appType?: AppType
}

export enum SocialSignInType {
  Facebook = 'facebook',
  Apple = 'apple',
  Google = 'google'
}

export interface SignInPayload {
  email?: string
  password?: string
  stayConnected?: boolean
  mobile?: boolean
  fullName?: string
  avatar?: string
  accessToken?: string
  socialSignInType?: SocialSignInType
}

export interface ResendLinkPayload {
  email?: string
}

export interface UpdateEmailNotificationsPayload {
  _id: string
  enableEmailNotifications: boolean
}

export interface UpdateLanguagePayload {
  id: string
  language: string
}

export interface ValidateSupplierPayload {
  fullName: string
}

export interface ValidateLocationPayload {
  language: string
  name: string
}

export interface ValidateCountryPayload {
  language: string
  name: string
}

export interface UpdateStatusPayload {
  ids: string[]
  status: string
}

export interface User {
  _id?: string
  supplier?: User | string
  fullName: string
  email?: string
  phone?: string
  password?: string
  birthDate?: Date
  verified?: boolean
  verifiedAt?: Date
  active?: boolean
  language?: string
  enableEmailNotifications?: boolean
  avatar?: string
  bio?: string
  location?: string
  type?: string
  blacklisted?: boolean
  payLater?: boolean
  accessToken?: string
  checked?: boolean
  customerId?: string
  carCount?: number
  contracts?: Contract[]
  licenseRequired?: boolean
  license?: string | null
  minimumRentalDays?: number
  priceChangeRate?: number
  supplierCarLimit?: number
  notifyAdminOnNewCar?: boolean
  taxId?: string
  rneNumber?: string
  rneDocument?: string
  address?: string
  city?: string
  governorate?: string
  postalCode?: string
  iban?: string
  legalRepFirstName?: string
  legalRepLastName?: string
  legalRepTitle?: string
  legalRepCin?: string
  whatsapp?: string
  phone2?: string
  phone3?: string
  website?: string
  invoicePrefix?: string
  invoiceVatRate?: number
  invoiceStampDuty?: number
  agencyApproved?: boolean
  parentAgency?: User | string
  subscriptionPlan?: string | null
  profileSlug?: string
}

export interface Option {
  _id: string
  name?: string
  image?: string
}

export interface LocationValue {
  _id?: string
  language: string
  value?: string
}

export interface ParkingSpot {
  _id?: string
  longitude: number | string
  latitude: number | string
  name?: string
  values?: LocationValue[]
}

export interface Location {
  _id: string
  country?: Country
  longitude?: number
  latitude?: number
  name?: string
  values?: LocationValue[]
  image?: string
  parkingSpots?: ParkingSpot[]
  supplier?: User
  parentLocation?: Location
}

export interface Country {
  _id: string
  name?: string
  values?: LocationValue[]
  supplier?: User
}

export interface CountryInfo extends Country {
  locations?: Location[]
}

export interface UpsertCountryPayload {
  names: CountryName[]
  supplier?: string
}

export interface DateBasedPrice {
  _id?: string
  startDate: Date | null
  endDate: Date | null
  dailyPrice: number | string
}

export interface Car {
  _id: string
  name: string
  licensePlate?: string
  supplier: User
  minimumAge: number
  locations: Location[]

  brand?: string
  model?: string
  year?: number
  chassisNumber?: string
  registrationDoc?: string
  insuranceExpiry?: Date
  technicalVisitExpiry?: Date
  nextOilChange?: Date
  deliveryType?: DeliveryType | string

  // price fields
  dailyPrice: number
  discountedDailyPrice: number | null
  hourlyPrice: number | null
  discountedHourlyPrice: number | null
  biWeeklyPrice: number | null
  discountedBiWeeklyPrice: number | null
  weeklyPrice: number | null
  discountedWeeklyPrice: number | null
  monthlyPrice: number | null
  discountedMonthlyPrice: number | null

  // date based price fields
  isDateBasedPrice: boolean
  dateBasedPrices: DateBasedPrice[]

  deposit: number
  available: boolean
  fullyBooked?: boolean
  comingSoon?: boolean
  type: CarType
  gearbox: GearboxType
  aircon: boolean
  image?: string
  seats: number
  doors: number
  fuelPolicy: FuelPolicy
  mileage: number
  cancellation: number
  amendments: number
  theftProtection: number
  collisionDamageWaiver: number
  fullInsurance: number
  additionalDriver: number
  range: string
  multimedia: CarMultimedia[] | undefined
  rating?: number
  trips: number
  co2?: number
  blockOnPay?: boolean
  [propKey: string]: any
}

export interface Data<T> {
  rows: T[]
  rowCount: number
}

export interface GetBookingCarsPayload {
  supplier: string
  pickupLocation: string
}

export interface Notification {
  _id: string
  user: string
  message: string
  booking?: string
  car?: string
  isRead?: boolean
  checked?: boolean
  createdAt?: Date
}

export interface NotificationCounter {
  _id: string
  user: string
  count: number
}

export interface ResultData<T> {
  pageInfo: { totalRecords: number }
  resultData: T[]
}

export type Result<T> = [ResultData<T>] | [] | undefined | null

export interface GetUsersBody {
  user?: string
  types: UserType[]
  active?: boolean
  agencyApproved?: boolean
}

export interface CreatePaymentPayload {
  amount: number
  /**
   * Three-letter ISO currency code, in lowercase.
   * Must be a supported currency: https://docs.stripe.com/currencies
   *
   * @type {string}
   */
  currency: string
  /**
   * The IETF language tag of the locale Checkout is displayed in. If blank or auto, the browser's locale is used.
   *
   * @type {string}
   */
  locale: string
  receiptEmail: string
  customerName: string
  name: string
  description?: string
}

export interface CreatePayPalOrderPayload {
  bookingId: string
  amount: number
  currency: string
  name: string
  description: string
}

export interface PaymentResult {
  sessionId?: string
  paymentIntentId?: string
  customerId: string
  clientSecret: string | null
}

export interface SendEmailPayload {
  from: string
  to: string
  subject: string
  message: string
  isContactForm: boolean
}

export interface Response<T> {
  status: number
  data: T
}

export interface BankDetails {
  _id: string
  accountHolder: string
  bankName: string
  iban: string
  swiftBic: string
  showBankDetailsPage: boolean
}

export interface UpsertBankDetailsPayload {
  _id?: string
  accountHolder: string
  bankName: string
  iban: string
  swiftBic: string
  showBankDetailsPage: boolean
}

export interface Setting {
  _id: string
  minPickupHours: number
  minRentalHours: number
  minPickupDropoffHour: number
  maxPickupDropoffHour: number
}

export interface UpdateSettingsPayload {
  minPickupHours: number
  minRentalHours: number
  minPickupDropoffHour: number
  maxPickupDropoffHour: number
}

// 
// React types
//
export type DataEvent<T> = (data?: Data<T>) => void

export interface StatusFilterItem {
  label: string
  value: BookingStatus
  checked?: boolean
}

export interface CarFilter {
  pickupLocation: Location
  dropOffLocation: Location
  from: Date
  to: Date
}

export type CarFilterSubmitEvent = (filter: CarFilter) => void

export interface CarOptions {
  cancellation?: boolean
  amendments?: boolean
  theftProtection?: boolean
  collisionDamageWaiver?: boolean
  fullInsurance?: boolean
  additionalDriver?: boolean
}

export interface LocalizedText {
  fr: string
  en: string
  ar: string
}

export interface SubscriptionPlanPricing {
  months: number
  monthlyPrice: number
  totalPrice: number
  discountPercent: number
}

export interface SubscriptionPlanFeature {
  id: string
  label: LocalizedText
  included: boolean
}

export interface SubscriptionPlan {
  _id: string
  visible: boolean
  name: LocalizedText
  subtitle: LocalizedText
  tokens: number
  freeTokens: number
  trialMonths: number
  pricing: SubscriptionPlanPricing[]
  freePlan: boolean
  mostPopular: boolean
  firstTrialFree: boolean
  active: boolean
  visibleVerified: boolean
  visibleUnverified: boolean
  showPaymentButton: boolean
  unlimitedDuration: boolean
  requiresApproval: boolean
  discountId?: string | null
  features: SubscriptionPlanFeature[]
  services: string[]
  createdAt?: Date | string
  updatedAt?: Date | string
}

export type UpsertSubscriptionPlanPayload = Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt'> & {
  _id?: string
}

export interface SubscriptionDiscount {
  _id: string
  name: string
  percent: number
  active: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

export type UpsertSubscriptionDiscountPayload = {
  _id?: string
  name: string
  percent: number
  active: boolean
}

export enum FcmDevicePlatform {
  Web = 'web',
  Android = 'android',
  Ios = 'ios',
}

export enum FirebaseEnvironment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

export type ConversationParticipantRole = 'client' | 'agency' | 'admin' | 'support'

export type MessageType = 'text' | 'system' | 'attachment'

export interface FcmDevice {
  _id: string
  user: string
  token: string
  platform: FcmDevicePlatform
  browser?: string
  deviceName?: string
  isActive: boolean
  environment: FirebaseEnvironment | string
  lastSeenAt?: Date | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface RegisterFcmDevicePayload {
  token: string
  platform: FcmDevicePlatform
  browser?: string
  deviceName?: string
  environment?: FirebaseEnvironment | string
}

export interface UnregisterFcmDevicePayload {
  token: string
}

export interface NotificationPayload {
  title: string
  body: string
  url?: string
  type?: string
  data?: Record<string, string>
}

export interface FirebaseMessagePayload {
  title?: string
  body?: string
  url?: string
  type?: string
  data?: Record<string, string>
}

export interface MessageParticipant {
  userId: string
  role: ConversationParticipantRole
  unreadCount: number
  lastReadAt?: Date | string | null
}

export interface Conversation {
  id: string
  participantUids: string[]
  participants: MessageParticipant[]
  lastMessage?: string
  lastMessageAt?: Date | string | null
  lastMessageSenderId?: string | null
  deletedAt?: Date | string | null
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  type: MessageType
  text?: string
  attachmentUrl?: string
  readBy: string[]
  deletedAt?: Date | string | null
  createdAt?: Date | string
}

export interface ChatPeer {
  _id: string
  fullName: string
  avatar?: string | null
  type?: UserType
  online?: boolean
  lastSeenAt?: Date | string | null
  kind?: 'support' | 'branch' | 'parent' | 'agency'
}

export interface ChatConversationView {
  _id: string
  peer: ChatPeer
  lastMessage?: string
  lastMessageAt?: Date | string | null
  lastMessageSenderId?: string | null
  unreadCount: number
  updatedAt?: Date | string
}

export interface ChatMessageView {
  _id: string
  conversation: string
  sender: string
  text: string
  createdAt: Date | string
}

export interface OpenChatPayload {
  agencyId?: string
  peerId?: string
}

export interface SendChatMessagePayload {
  text: string
}
