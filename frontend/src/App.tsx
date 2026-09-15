import React, { Suspense, useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Outlet, Navigate, useLocation } from 'react-router-dom'
import env from '@/config/env.config'
import { NotificationProvider } from '@/context/NotificationContext'
import { UserContextType, UserProvider, useUserContext } from '@/context/UserContext'
import { RecaptchaProvider } from '@/context/RecaptchaContext'
import { PayPalProvider } from '@/context/PayPalContext'
import { SettingProvider } from '@/context/SettingContext'
import { init as initGA } from '@/utils/ga4'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import ScrollToTop from '@/components/ScrollToTop'
import ScrollTopButton from '@/components/ScrollTopButton'
import NProgressIndicator from '@/components/NProgressIndicator'
import RouteProgress from '@/components/RouteProgress'
import ErrorBoundary from '@/components/ErrorBoundary'
import RouteError from '@/components/RouteError'
import FirebaseMessagingBridge from '@/components/FirebaseMessagingBridge'
import Header from '@/components/Header'
import axiosInstance from '@/services/axiosInstance'
// Auth + agency vitrine are eager: React Router 7 navigates inside startTransition + Suspense
// would keep showing the previous page with no loader until the chunk loads.
import SignIn from '@/pages/SignIn'
import SignUp from '@/pages/SignUp'
import AgencyShowcase from '@/pages/AgencyShowcase'

if (env.GOOGLE_ANALYTICS_ENABLED) {
  initGA()
}

const Activate = lazyWithRetry(() => import('@/pages/Activate'))
const ForgotPassword = lazyWithRetry(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazyWithRetry(() => import('@/pages/ResetPassword'))
const Home = lazyWithRetry(() => import('@/pages/Home'))
const Search = lazyWithRetry(() => import('@/pages/Search'))
const Offer = lazyWithRetry(() => import('@/pages/Offer'))
const OfferExtras = lazyWithRetry(() => import('@/pages/OfferExtras'))
const OfferProtection = lazyWithRetry(() => import('@/pages/OfferProtection'))
const OfferPayment = lazyWithRetry(() => import('@/pages/OfferPayment'))
const Checkout = lazyWithRetry(() => import('@/pages/Checkout'))
const CheckoutSession = lazyWithRetry(() => import('@/pages/CheckoutSession'))
const Bookings = lazyWithRetry(() => import('@/pages/Bookings'))
const Booking = lazyWithRetry(() => import('@/pages/Booking'))
const Settings = lazyWithRetry(() => import('@/pages/Settings'))
const Notifications = lazyWithRetry(() => import('@/pages/Notifications'))
const ToS = lazyWithRetry(() => import('@/pages/ToS'))
const Privacy = lazyWithRetry(() => import('@/pages/Privacy'))
const About = lazyWithRetry(() => import('@/pages/About'))
const ChangePassword = lazyWithRetry(() => import('@/pages/ChangePassword'))
const Contact = lazyWithRetry(() => import('@/pages/Contact'))
const NoMatch = lazyWithRetry(() => import('@/pages/NoMatch'))
const Locations = lazyWithRetry(() => import('@/pages/Locations'))
const Suppliers = lazyWithRetry(() => import('@/pages/Suppliers'))
const Faq = lazyWithRetry(() => import('@/pages/Faq'))
const CookiePolicy = lazyWithRetry(() => import('@/pages/CookiePolicy'))
const AgencyPublicProfile = lazyWithRetry(() => import('@/pages/AgencyPublicProfile'))
const VerifyDocument = lazyWithRetry(() => import('@/pages/VerifyDocument'))

const AdminProvider = lazyWithRetry(() => import('@/admin/context/AdminContext').then((m) => ({ default: m.AdminProvider })))
const AdminLayout = lazyWithRetry(() => import('@/admin/components/AdminLayout'))
const AdminSignIn = lazyWithRetry(() => import('@/admin/pages/AdminSignIn'))
const AdminDashboard = lazyWithRetry(() => import('@/admin/pages/AdminDashboard'))
const AccountRequests = lazyWithRetry(() => import('@/admin/pages/AccountRequests'))
const AdminAgencies = lazyWithRetry(() => import('@/admin/pages/AdminAgencies'))
const AdminClients = lazyWithRetry(() => import('@/admin/pages/AdminClients'))
const AdminSubscription = lazyWithRetry(() => import('@/admin/pages/AdminSubscription'))
const AdminAgencyPayments = lazyWithRetry(() => import('@/admin/pages/AdminAgencyPayments'))
const AdminAgencyLogins = lazyWithRetry(() => import('@/admin/pages/AdminAgencyLogins'))

const AgencyProvider = lazyWithRetry(() => import('@/agency/context/AgencyContext').then((m) => ({ default: m.AgencyProvider })))
const AgencyLayout = lazyWithRetry(() => import('@/agency/components/AgencyLayout'))
const AgencySignIn = lazyWithRetry(() => import('@/agency/pages/AgencySignIn'))
const AgencyActivate = lazyWithRetry(() => import('@/agency/pages/AgencyActivate'))
const AgencyChoosePlan = lazyWithRetry(() => import('@/agency/pages/AgencyChoosePlan'))
const AgencyDashboard = lazyWithRetry(() => import('@/agency/pages/AgencyDashboard'))
const AgencyFleet = lazyWithRetry(() => import('@/agency/pages/AgencyFleet'))
const AgencyBranches = lazyWithRetry(() => import('@/agency/pages/AgencyBranches'))
const AgencyBookings = lazyWithRetry(() => import('@/agency/pages/AgencyBookings'))
const AgencyAgenda = lazyWithRetry(() => import('@/agency/pages/AgencyAgenda'))
const AgencyInvoices = lazyWithRetry(() => import('@/agency/pages/AgencyInvoices'))
const AgencyContracts = lazyWithRetry(() => import('@/agency/pages/AgencyContracts'))
const AgencyReceipts = lazyWithRetry(() => import('@/agency/pages/AgencyReceipts'))
const AgencySubscription = lazyWithRetry(() => import('@/agency/pages/AgencySubscription'))
const AgencyMaintenance = lazyWithRetry(() => import('@/agency/pages/AgencyMaintenance'))
const AgencyProfile = lazyWithRetry(() => import('@/agency/pages/AgencyProfile'))
const AgencyReviews = lazyWithRetry(() => import('@/agency/pages/AgencyReviews'))
const AgencyClients = lazyWithRetry(() => import('@/agency/pages/AgencyClients'))
const AgencyNotifications = lazyWithRetry(() => import('@/agency/pages/AgencyNotifications'))

const AppMessaging = () => {
  const { user } = useUserContext() as UserContextType
  return <FirebaseMessagingBridge enabled={!!user} axiosInstance={axiosInstance} />
}

const AppLayout = () => {
  const location = useLocation()

  useEffect(() => {
    const warm = () => {
      void import('@/pages/Search')
      void import('@/pages/Offer')
      void import('@/pages/OfferExtras')
    }
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(warm)
      return () => w.cancelIdleCallback?.(id)
    }
    const t = window.setTimeout(warm, 1200)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <ErrorBoundary>
      <SettingProvider>
        <UserProvider>
          <NotificationProvider>
            <RecaptchaProvider>
              <PayPalProvider>
                <ScrollToTop />
                <RouteProgress />
                <div className="app">
                  <AppMessaging />
                  <Header />
                  <Suspense fallback={<NProgressIndicator />}>
                    <Outlet key={location.pathname} />
                  </Suspense>
                  <ScrollTopButton />
                </div>
              </PayPalProvider>
            </RecaptchaProvider>
          </NotificationProvider>
        </UserProvider>
      </SettingProvider>
    </ErrorBoundary>
  )
}

const AdminRoot = () => (
  <Suspense fallback={<NProgressIndicator />}>
    <AdminProvider>
      <AdminLayout />
    </AdminProvider>
  </Suspense>
)

const AgencyRoot = () => (
  <Suspense fallback={<NProgressIndicator />}>
    <AgencyProvider>
      <AgencyLayout />
    </AgencyProvider>
  </Suspense>
)

const router = createBrowserRouter([
  {
    path: '/admin',
    element: <AdminRoot />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'sign-in', element: <AdminSignIn /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'account-requests', element: <AccountRequests /> },
      { path: 'agencies', element: <AdminAgencies /> },
      { path: 'clients', element: <AdminClients /> },
      { path: 'subscription', element: <AdminSubscription /> },
      { path: 'agency-payments', element: <AdminAgencyPayments /> },
      { path: 'agency-logins', element: <AdminAgencyLogins /> },
      { path: '*', element: <NoMatch /> },
    ],
  },
  {
    path: '/agency',
    element: <AgencyRoot />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'sign-in', element: <AgencySignIn /> },
      { path: 'activate', element: <AgencyActivate /> },
      { path: 'choose-plan', element: <AgencyChoosePlan /> },
      { path: 'dashboard', element: <AgencyDashboard /> },
      { path: 'fleet', element: <AgencyFleet /> },
      { path: 'agencies', element: <AgencyBranches /> },
      { path: 'bookings', element: <AgencyBookings /> },
      { path: 'agenda', element: <AgencyAgenda /> },
      { path: 'reviews', element: <AgencyReviews /> },
      { path: 'clients', element: <AgencyClients /> },
      { path: 'invoices', element: <AgencyInvoices /> },
      { path: 'contracts', element: <AgencyContracts /> },
      { path: 'receipts', element: <AgencyReceipts /> },
      { path: 'subscription', element: <AgencySubscription /> },
      { path: 'maintenance', element: <AgencyMaintenance /> },
      { path: 'profile', element: <AgencyProfile /> },
      { path: 'notifications', element: <AgencyNotifications /> },
      { path: '*', element: <NoMatch /> },
    ],
  },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: 'sign-in', element: <SignIn /> },
      { path: 'sign-up', element: <SignUp /> },
      { path: 'activate', element: <Activate /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'search', element: <Search /> },
      { path: 'offer', element: <Offer /> },
      { path: 'offer/extras', element: <OfferExtras /> },
      { path: 'offer/protection', element: <OfferProtection /> },
      { path: 'offer/payment', element: <OfferPayment /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'checkout-session/:sessionId', element: <CheckoutSession /> },
      { path: 'bookings', element: <Bookings /> },
      { path: 'booking', element: <Booking /> },
      { path: 'settings', element: <Settings /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'change-password', element: <ChangePassword /> },
      { path: 'about', element: <About /> },
      { path: 'tos', element: <ToS /> },
      { path: 'privacy', element: <Privacy /> },
      { path: 'contact', element: <Contact /> },
      { path: 'locations', element: <Locations /> },
      { path: 'faq', element: <Faq /> },
      { path: 'cookie-policy', element: <CookiePolicy /> },
      { path: 'espace-agence', element: <AgencyShowcase /> },
      { path: 'agence/:slug', element: <AgencyPublicProfile /> },
      { path: 'verify/document/:kind/:id', element: <VerifyDocument /> },
      ...(env.HIDE_SUPPLIERS ? [] : [{ path: 'suppliers', element: <Suppliers /> }]),
      { path: '*', element: <NoMatch /> },
    ],
  },
])

const App = () => <RouterProvider router={router} />

export default App
