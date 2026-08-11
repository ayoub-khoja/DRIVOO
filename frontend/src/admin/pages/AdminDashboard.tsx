import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HowToRegOutlined, StorefrontOutlined, PeopleOutline } from '@mui/icons-material'
import { Button, CircularProgress } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/admin/lang/admin'
import { useAdminContext } from '@/admin/context/AdminContext'
import * as AdminApiService from '@/admin/services/AdminApiService'

const AdminDashboard = () => {
  const { admin } = useAdminContext()
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(0)
  const [agencies, setAgencies] = useState(0)
  const [clients, setClients] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const [requests, suppliers, users] = await Promise.all([
          AdminApiService.getAccountRequests(1, 1),
          AdminApiService.getUsers(1, 1, [bookcarsTypes.UserType.Supplier], '', true, true),
          AdminApiService.getUsers(1, 1, [bookcarsTypes.UserType.User]),
        ])

        setPending(requests[0]?.pageInfo?.[0]?.totalRecords || 0)
        setAgencies(suppliers[0]?.pageInfo?.[0]?.totalRecords || 0)
        setClients(users[0]?.pageInfo?.[0]?.totalRecords || 0)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>{strings.OVERVIEW}</h2>
        <p>{strings.OVERVIEW_TEXT}</p>
      </div>

      {loading ? (
        <div className="admin-inline-loading">
          <CircularProgress size={28} />
          <span>{strings.LOADING}</span>
        </div>
      ) : (
        <>
          <div className="admin-stats">
            <div className="admin-stat-card accent">
              <HowToRegOutlined />
              <div>
                <span>{strings.STAT_REQUESTS}</span>
                <strong>{pending}</strong>
              </div>
            </div>
            <div className="admin-stat-card">
              <StorefrontOutlined />
              <div>
                <span>{strings.STAT_AGENCIES}</span>
                <strong>{agencies}</strong>
              </div>
            </div>
            <div className="admin-stat-card">
              <PeopleOutline />
              <div>
                <span>{strings.STAT_CLIENTS}</span>
                <strong>{clients}</strong>
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <h3>{strings.ACCOUNT_REQUESTS}</h3>
            <p>
              {pending > 0
                ? `${pending} ${strings.STAT_REQUESTS.toLowerCase()}`
                : strings.EMPTY}
            </p>
            <Button
              component={Link}
              to="/admin/account-requests"
              variant="contained"
              className="btn-primary"
            >
              {strings.OPEN_REQUESTS}
            </Button>
          </div>

          <div className="admin-panel">
            <h3>{strings.AGENCIES}</h3>
            <p>
              {agencies > 0
                ? `${agencies} ${strings.STAT_AGENCIES.toLowerCase()}`
                : strings.AGENCIES_EMPTY}
            </p>
            <Button
              component={Link}
              to="/admin/agencies"
              variant="contained"
              className="btn-primary"
            >
              {strings.OPEN_AGENCIES}
            </Button>
          </div>

          <div className="admin-panel">
            <h3>{strings.USERS}</h3>
            <p>
              {clients > 0
                ? `${clients} ${strings.STAT_CLIENTS.toLowerCase()}`
                : strings.CLIENTS_EMPTY}
            </p>
            <Button
              component={Link}
              to="/admin/clients"
              variant="contained"
              className="btn-primary"
            >
              {strings.OPEN_CLIENTS}
            </Button>
          </div>

          {admin && (
            <p className="admin-muted">
              {strings.WELCOME}, {admin.fullName}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default AdminDashboard
