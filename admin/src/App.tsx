import React, { Suspense, useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom'
import { NotificationProvider } from '@/context/NotificationContext'
import { UserProvider } from '@/context/UserContext'
import { RecaptchaProvider } from '@/context/RecaptchaContext'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import ScrollToTop from '@/components/ScrollToTop'
import NProgressIndicator from '@/components/NProgressIndicator'
import ErrorBoundary from '@/components/ErrorBoundary'
import RouteError from '@/components/RouteError'

const Header = lazyWithRetry(() => import('@/components/Header'))
const SignIn = lazyWithRetry(() => import('@/pages/SignIn'))
const Activate = lazyWithRetry(() => import('@/pages/Activate'))
const ForgotPassword = lazyWithRetry(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazyWithRetry(() => import('@/pages/ResetPassword'))
const Suppliers = lazyWithRetry(() => import('@/pages/Suppliers'))
const Supplier = lazyWithRetry(() => import('@/pages/Supplier'))
const CreateSupplier = lazyWithRetry(() => import('@/pages/CreateSupplier'))
const UpdateSupplier = lazyWithRetry(() => import('@/pages/UpdateSupplier'))
const Locations = lazyWithRetry(() => import('@/pages/Locations'))
const CreateLocation = lazyWithRetry(() => import('@/pages/CreateLocation'))
const UpdateLocation = lazyWithRetry(() => import('@/pages/UpdateLocation'))
const Cars = lazyWithRetry(() => import('@/pages/Cars'))
const Car = lazyWithRetry(() => import('@/pages/Car'))
const CreateCar = lazyWithRetry(() => import('@/pages/CreateCar'))
const UpdateCar = lazyWithRetry(() => import('@/pages/UpdateCar'))
const Bookings = lazyWithRetry(() => import('@/pages/Bookings'))
const UpdateBooking = lazyWithRetry(() => import('@/pages/UpdateBooking'))
const CreateBooking = lazyWithRetry(() => import('@/pages/CreateBooking'))
const Users = lazyWithRetry(() => import('@/pages/Users'))
const User = lazyWithRetry(() => import('@/pages/User'))
const CreateUser = lazyWithRetry(() => import('@/pages/CreateUser'))
const UpdateUser = lazyWithRetry(() => import('@/pages/UpdateUser'))
const Settings = lazyWithRetry(() => import('@/pages/Settings'))
const Notifications = lazyWithRetry(() => import('@/pages/Notifications'))
const ToS = lazyWithRetry(() => import('@/pages/ToS'))
const About = lazyWithRetry(() => import('@/pages/About'))
const ChangePassword = lazyWithRetry(() => import('@/pages/ChangePassword'))
const Contact = lazyWithRetry(() => import('@/pages/Contact'))
const NoMatch = lazyWithRetry(() => import('@/pages/NoMatch'))
const Countries = lazyWithRetry(() => import('@/pages/Countries'))
const CreateCountry = lazyWithRetry(() => import('@/pages/CreateCountry'))
const UpdateCountry = lazyWithRetry(() => import('@/pages/UpdateCountry'))
const Scheduler = lazyWithRetry(() => import('@/pages/Scheduler'))
const BankDetails = lazyWithRetry(() => import('@/pages/BankDetails'))
const Pricing = lazyWithRetry(() => import('@/pages/Pricing'))

const AppLayout = () => {
  const location = useLocation()
  const [refreshKey, setRefreshKey] = useState(0) // refreshKey to check user and notifications when navigating between routes

  useEffect(() => {
    setRefreshKey((prev) => prev + 1)
  }, [location.pathname])

  return (
    <ErrorBoundary>
      <UserProvider refreshKey={refreshKey}>
        <NotificationProvider refreshKey={refreshKey}>
          <RecaptchaProvider>
            <ScrollToTop />
            <div className="app">
              <Suspense fallback={<NProgressIndicator />}>
                <Header />
                <Outlet />
              </Suspense>
            </div>
          </RecaptchaProvider>
        </NotificationProvider>
      </UserProvider>
    </ErrorBoundary>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Bookings /> },
      { path: 'sign-in', element: <SignIn /> },
      { path: 'activate', element: <Activate /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'suppliers', element: <Suppliers /> },
      { path: 'supplier', element: <Supplier /> },
      { path: 'create-supplier', element: <CreateSupplier /> },
      { path: 'update-supplier', element: <UpdateSupplier /> },
      { path: 'locations', element: <Locations /> },
      { path: 'create-location', element: <CreateLocation /> },
      { path: 'update-location', element: <UpdateLocation /> },
      { path: 'cars', element: <Cars /> },
      { path: 'car', element: <Car /> },
      { path: 'create-car', element: <CreateCar /> },
      { path: 'update-car', element: <UpdateCar /> },
      { path: 'update-booking', element: <UpdateBooking /> },
      { path: 'create-booking', element: <CreateBooking /> },
      { path: 'users', element: <Users /> },
      { path: 'user', element: <User /> },
      { path: 'create-user', element: <CreateUser /> },
      { path: 'update-user', element: <UpdateUser /> },
      { path: 'settings', element: <Settings /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'change-password', element: <ChangePassword /> },
      { path: 'about', element: <About /> },
      { path: 'tos', element: <ToS /> },
      { path: 'contact', element: <Contact /> },
      { path: 'countries', element: <Countries /> },
      { path: 'create-country', element: <CreateCountry /> },
      { path: 'update-country', element: <UpdateCountry /> },
      { path: 'scheduler', element: <Scheduler /> },
      { path: 'bank-details', element: <BankDetails /> },
      { path: 'pricing', element: <Pricing /> },
      { path: '*', element: <NoMatch /> }
    ]
  }
])

const App = () => <RouterProvider router={router} />

export default App
