import React, { lazy, Suspense, useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider, Outlet, useLocation, Navigate } from 'react-router-dom'
import env from '@/config/env.config'
import { NotificationProvider } from '@/context/NotificationContext'
import { UserContextType, UserProvider, useUserContext } from '@/context/UserContext'
import { RecaptchaProvider } from '@/context/RecaptchaContext'
import { PayPalProvider } from '@/context/PayPalContext'
import { SettingProvider } from '@/context/SettingContext'
import { init as initGA } from '@/utils/ga4'
import ScrollToTop from '@/components/ScrollToTop'
import NProgressIndicator from '@/components/NProgressIndicator'
import ErrorBoundary from '@/components/ErrorBoundary'
import FirebaseMessagingBridge from '@/components/FirebaseMessagingBridge'
import axiosInstance from '@/services/axiosInstance'

if (env.GOOGLE_ANALYTICS_ENABLED) {
  initGA()
}

const Header = lazy(() => import('@/components/Header'))
const SignIn = lazy(() => import('@/pages/SignIn'))
const SignUp = lazy(() => import('@/pages/SignUp'))
const Activate = lazy(() => import('@/pages/Activate'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Home = lazy(() => import('@/pages/Home'))
const Search = lazy(() => import('@/pages/Search'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const CheckoutSession = lazy(() => import('@/pages/CheckoutSession'))
const Bookings = lazy(() => import('@/pages/Bookings'))
const Booking = lazy(() => import('@/pages/Booking'))
const Settings = lazy(() => import('@/pages/Settings'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const ToS = lazy(() => import('@/pages/ToS'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const About = lazy(() => import('@/pages/About'))
const ChangePassword = lazy(() => import('@/pages/ChangePassword'))
const Contact = lazy(() => import('@/pages/Contact'))
const NoMatch = lazy(() => import('@/pages/NoMatch'))
const Locations = lazy(() => import('@/pages/Locations'))
const Suppliers = lazy(() => import('@/pages/Suppliers'))
const Faq = lazy(() => import('@/pages/Faq'))
const CookiePolicy = lazy(() => import('@/pages/CookiePolicy'))
const AgencyShowcase = lazy(() => import('@/pages/AgencyShowcase'))
const AgencyPublicProfile = lazy(() => import('@/pages/AgencyPublicProfile'))

const AdminProvider = lazy(() => import('@/admin/context/AdminContext').then((m) => ({ default: m.AdminProvider })))
const AdminLayout = lazy(() => import('@/admin/components/AdminLayout'))
const AdminSignIn = lazy(() => import('@/admin/pages/AdminSignIn'))
const AdminDashboard = lazy(() => import('@/admin/pages/AdminDashboard'))
const AccountRequests = lazy(() => import('@/admin/pages/AccountRequests'))
const AdminAgencies = lazy(() => import('@/admin/pages/AdminAgencies'))
const AdminClients = lazy(() => import('@/admin/pages/AdminClients'))
const AdminSubscription = lazy(() => import('@/admin/pages/AdminSubscription'))

const AgencyProvider = lazy(() => import('@/agency/context/AgencyContext').then((m) => ({ default: m.AgencyProvider })))
const AgencyLayout = lazy(() => import('@/agency/components/AgencyLayout'))
const AgencySignIn = lazy(() => import('@/agency/pages/AgencySignIn'))
const AgencyActivate = lazy(() => import('@/agency/pages/AgencyActivate'))
const AgencyChoosePlan = lazy(() => import('@/agency/pages/AgencyChoosePlan'))
const AgencyDashboard = lazy(() => import('@/agency/pages/AgencyDashboard'))
const AgencyFleet = lazy(() => import('@/agency/pages/AgencyFleet'))
const AgencyBranches = lazy(() => import('@/agency/pages/AgencyBranches'))
const AgencyBookings = lazy(() => import('@/agency/pages/AgencyPlaceholders').then((m) => ({ default: m.AgencyBookings })))
const AgencyAgenda = lazy(() => import('@/agency/pages/AgencyAgenda'))
const AgencyInvoices = lazy(() => import('@/agency/pages/AgencyInvoices'))
const AgencyContracts = lazy(() => import('@/agency/pages/AgencyContracts'))
const AgencyReceipts = lazy(() => import('@/agency/pages/AgencyReceipts'))
const AgencySubscription = lazy(() => import('@/agency/pages/AgencySubscription'))
const AgencyMaintenance = lazy(() => import('@/agency/pages/AgencyMaintenance'))
const AgencyProfile = lazy(() => import('@/agency/pages/AgencyProfile'))
const AgencyReviews = lazy(() => import('@/agency/pages/AgencyReviews'))
const AgencyNotifications = lazy(() => import('@/agency/pages/AgencyNotifications'))

const AppMessaging = () => {
  const { user } = useUserContext() as UserContextType
  return <FirebaseMessagingBridge enabled={!!user} axiosInstance={axiosInstance} />
}

const AppLayout = () => {
  const location = useLocation()
  const [refreshKey, setRefreshKey] = useState(0) // refreshKey to check user and notifications when navigating between routes

  useEffect(() => {
    setRefreshKey((prev) => prev + 1)
  }, [location.pathname])

  return (
    <ErrorBoundary>
      <SettingProvider>
        <UserProvider refreshKey={refreshKey}>
          <NotificationProvider refreshKey={refreshKey}>
            <RecaptchaProvider>
              <PayPalProvider>
                <ScrollToTop />
                <div className="app">
                  <AppMessaging />
                  <Suspense fallback={<NProgressIndicator />}>
                    <Header />
                    <Outlet />
                  </Suspense>
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
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'sign-in', element: <AdminSignIn /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'account-requests', element: <AccountRequests /> },
      { path: 'agencies', element: <AdminAgencies /> },
      { path: 'clients', element: <AdminClients /> },
      { path: 'subscription', element: <AdminSubscription /> },
      { path: '*', element: <NoMatch /> },
    ],
  },
  {
    path: '/agency',
    element: <AgencyRoot />,
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
    children: [
      { index: true, element: <Home /> },
      { path: 'sign-in', element: <SignIn /> },
      { path: 'sign-up', element: <SignUp /> },
      { path: 'activate', element: <Activate /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'search', element: <Search /> },
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
      ...(env.HIDE_SUPPLIERS ? [] : [{ path: 'suppliers', element: <Suppliers /> }]),
      { path: '*', element: <NoMatch /> }
    ]
  }
])

const App = () => <RouterProvider router={router} />

export default App
