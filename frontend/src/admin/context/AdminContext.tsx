/* eslint-disable react-refresh/only-export-components */
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as bookcarsTypes from ':bookcars-types'
import * as AdminAuthService from '@/admin/services/AdminAuthService'

export interface AdminContextType {
  admin: bookcarsTypes.User | null
  adminLoaded: boolean
  refreshAdmin: () => Promise<void>
  setAdmin: React.Dispatch<React.SetStateAction<bookcarsTypes.User | null>>
}

const AdminContext = createContext<AdminContextType | null>(null)

interface AdminProviderProps {
  children: ReactNode
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<bookcarsTypes.User | null>(null)
  const [adminLoaded, setAdminLoaded] = useState(false)

  const refreshAdmin = useCallback(async () => {
    setAdminLoaded(false)
    const current = AdminAuthService.getCurrentUser()

    if (!current?._id) {
      setAdmin(null)
      setAdminLoaded(true)
      return
    }

    try {
      const status = await AdminAuthService.validateAccessToken()
      if (status !== 200) {
        await AdminAuthService.signout(false)
        setAdmin(null)
        setAdminLoaded(true)
        return
      }

      const user = await AdminAuthService.getUser(current._id)
      if (!user || user.type !== bookcarsTypes.UserType.Admin || user.blacklisted) {
        await AdminAuthService.signout(false)
        setAdmin(null)
      } else {
        setAdmin(user)
        AdminAuthService.setCurrentUser({
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          language: user.language,
          type: user.type,
        })
      }
    } catch {
      await AdminAuthService.signout(false)
      setAdmin(null)
    } finally {
      setAdminLoaded(true)
    }
  }, [])

  useEffect(() => {
    refreshAdmin()
  }, [refreshAdmin])

  const value = useMemo(
    () => ({ admin, adminLoaded, refreshAdmin, setAdmin }),
    [admin, adminLoaded, refreshAdmin],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export const useAdminContext = () => {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error('useAdminContext must be used within AdminProvider')
  }
  return ctx
}
