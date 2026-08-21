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
import * as AgencyAuthService from '@/agency/services/AgencyAuthService'

export interface AgencyContextType {
  agency: bookcarsTypes.User | null
  agencyLoaded: boolean
  refreshAgency: () => Promise<void>
  setAgency: React.Dispatch<React.SetStateAction<bookcarsTypes.User | null>>
}

const AgencyContext = createContext<AgencyContextType | null>(null)

interface AgencyProviderProps {
  children: ReactNode
}

export const AgencyProvider: React.FC<AgencyProviderProps> = ({ children }) => {
  const [agency, setAgency] = useState<bookcarsTypes.User | null>(null)
  const [agencyLoaded, setAgencyLoaded] = useState(false)

  const refreshAgency = useCallback(async () => {
    setAgencyLoaded(false)
    const current = AgencyAuthService.getCurrentUser()

    if (!current?._id) {
      setAgency(null)
      setAgencyLoaded(true)
      return
    }

    try {
      const status = await AgencyAuthService.validateAccessToken()
      if (status !== 200) {
        await AgencyAuthService.signout(false)
        setAgency(null)
        setAgencyLoaded(true)
        return
      }

      const user = await AgencyAuthService.getUser(current._id)
      if (!user || user.type !== bookcarsTypes.UserType.Supplier || user.blacklisted) {
        await AgencyAuthService.signout(false)
        setAgency(null)
      } else {
        setAgency(user)
        AgencyAuthService.setCurrentUser({
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          language: user.language,
          type: user.type,
          agencyApproved: user.agencyApproved,
          parentAgency: typeof user.parentAgency === 'object' && user.parentAgency
            ? user.parentAgency._id
            : user.parentAgency,
          subscriptionPlan: user.subscriptionPlan || null,
        })
      }
    } catch {
      await AgencyAuthService.signout(false)
      setAgency(null)
    } finally {
      setAgencyLoaded(true)
    }
  }, [])

  useEffect(() => {
    refreshAgency()
  }, [refreshAgency])

  const value = useMemo(
    () => ({ agency, agencyLoaded, refreshAgency, setAgency }),
    [agency, agencyLoaded, refreshAgency],
  )

  return <AgencyContext.Provider value={value}>{children}</AgencyContext.Provider>
}

export const useAgencyContext = () => {
  const ctx = useContext(AgencyContext)
  if (!ctx) {
    throw new Error('useAgencyContext must be used within AgencyProvider')
  }
  return ctx
}
