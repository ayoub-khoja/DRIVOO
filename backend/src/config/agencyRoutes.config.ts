const routes = {
  getSubAgencies: '/api/agency/sub-agencies/:page/:size',
  createSubAgency: '/api/agency/sub-agency',
  updateProfile: '/api/agency/profile',
  updateLogo: '/api/agency/logo',
  deleteLogo: '/api/agency/logo',
  getShareLink: '/api/agency/share-link',
  getReviews: '/api/agency/reviews',
  moderateReview: '/api/agency/reviews/:id',
  selectSubscriptionPlan: '/api/agency/subscription-plan',
  getInvoices: '/api/agency/invoices/:page/:size',
  createInvoice: '/api/agency/invoices',
  getInvoice: '/api/agency/invoice/:id',
  deleteInvoice: '/api/agency/invoice/:id',
  getInvoicePdf: '/api/agency/invoice/:id/pdf',
  getPublicProfile: '/api/agency/public/:slug',
  getPublicCars: '/api/agency/public/:slug/cars',
  getPublicReviews: '/api/agency/public/:slug/reviews',
  createPublicReview: '/api/agency/public/:slug/reviews',
}

export default routes
