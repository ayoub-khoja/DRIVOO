import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  MenuItem,
  TextField,
} from '@mui/material'
import {
  AddRounded,
  BuildOutlined,
  DescriptionOutlined,
  EventAvailableOutlined,
  NotificationsActiveOutlined,
  SpeedOutlined,
  DoneAllRounded,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyCarService from '@/agency/services/AgencyCarService'
import * as AgencyReminderService from '@/agency/services/AgencyReminderService'
import type { AgencyReminder, ReminderModule } from '@/agency/types/reminder'

type ModuleFilter = ReminderModule | 'all'

const MODULES: { key: ModuleFilter; icon: React.ReactNode }[] = [
  { key: 'all', icon: <NotificationsActiveOutlined /> },
  { key: 'maintenance', icon: <BuildOutlined /> },
  { key: 'documents', icon: <DescriptionOutlined /> },
  { key: 'mileage', icon: <SpeedOutlined /> },
  { key: 'contracts', icon: <EventAvailableOutlined /> },
]

const moduleLabel = (key: ModuleFilter) => {
  switch (key) {
    case 'all':
      return strings.REM_ALL
    case 'maintenance':
      return strings.REM_MOD_MAINTENANCE
    case 'documents':
      return strings.REM_MOD_DOCUMENTS
    case 'mileage':
      return strings.REM_MOD_MILEAGE
    case 'contracts':
      return strings.REM_MOD_CONTRACTS
    default:
      return key
  }
}

const moduleHint = (key: ReminderModule) => {
  switch (key) {
    case 'maintenance':
      return strings.REM_HINT_MAINTENANCE
    case 'documents':
      return strings.REM_HINT_DOCUMENTS
    case 'mileage':
      return strings.REM_HINT_MILEAGE
    case 'contracts':
      return strings.REM_HINT_CONTRACTS
    default:
      return ''
  }
}

const severityLabel = (severity: AgencyReminder['severity']) => {
  switch (severity) {
    case 'critical':
      return strings.REM_SEV_CRITICAL
    case 'warning':
      return strings.REM_SEV_WARNING
    case 'info':
      return strings.REM_SEV_INFO
    default:
      return strings.REM_SEV_OK
  }
}

const AgencyMaintenance = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const [cars, setCars] = useState<bookcarsTypes.Car[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [module, setModule] = useState<ModuleFilter>('all')
  const [tick, setTick] = useState(0)
  const [openForm, setOpenForm] = useState(false)
  const [openOdo, setOpenOdo] = useState(false)
  const [form, setForm] = useState({
    module: 'maintenance' as ReminderModule,
    title: '',
    detail: '',
    vehicleLabel: '',
    dueDate: '',
  })
  const [odoForm, setOdoForm] = useState({ vehicleId: '', km: '' })

  const load = useCallback(async () => {
    if (!agency?._id) {
      setCars([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await AgencyCarService.getCars('', { suppliers: [agency._id] }, 1, 200)
      setCars(result?.[0]?.resultData || [])
    } catch {
      setError(strings.REM_LOAD_ERROR)
      setCars([])
    } finally {
      setLoading(false)
    }
  }, [agency?._id])

  useEffect(() => {
    if (agencyLoaded) {
      void load()
    }
  }, [agencyLoaded, load])

  const reminders = useMemo(() => {
    if (!agency?._id) {
      return []
    }
    // tick forces recompute after dismiss / odometer update
    void tick
    return AgencyReminderService.withoutDismissed(
      agency._id,
      AgencyReminderService.buildReminders(agency._id, cars),
    )
  }, [agency?._id, cars, tick])

  const stats = useMemo(() => AgencyReminderService.getStats(reminders), [reminders])

  const visible = useMemo(
    () => AgencyReminderService.filterByModule(reminders, module),
    [reminders, module],
  )

  const moduleCounts = useMemo(() => {
    const base: Record<ModuleFilter, { count: number; critical: number }> = {
      all: { count: reminders.length, critical: stats.critical },
      maintenance: { count: 0, critical: 0 },
      documents: { count: 0, critical: 0 },
      mileage: { count: 0, critical: 0 },
      contracts: { count: 0, critical: 0 },
    }
    reminders.forEach((r) => {
      base[r.module].count += 1
      if (r.severity === 'critical') {
        base[r.module].critical += 1
      }
    })
    return base
  }, [reminders, stats.critical])

  const dismiss = (id: string) => {
    if (!agency?._id) {
      return
    }
    AgencyReminderService.dismissReminder(agency._id, id)
    setTick((n) => n + 1)
  }

  const submitReminder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agency?._id || !form.title.trim()) {
      return
    }
    AgencyReminderService.addManualReminder(agency._id, {
      module: form.module,
      category: 'custom',
      title: form.title.trim(),
      detail: form.detail.trim() || strings.REM_CUSTOM_DETAIL,
      vehicleLabel: form.vehicleLabel.trim() || undefined,
      dueDate: form.dueDate || undefined,
    })
    setOpenForm(false)
    setForm({
      module: 'maintenance',
      title: '',
      detail: '',
      vehicleLabel: '',
      dueDate: '',
    })
    setTick((n) => n + 1)
  }

  const submitOdo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agency?._id || !odoForm.vehicleId) {
      return
    }
    const km = Number(odoForm.km)
    if (!Number.isFinite(km) || km < 0) {
      return
    }
    AgencyReminderService.setOdometer(agency._id, odoForm.vehicleId, km)
    setOpenOdo(false)
    setOdoForm({ vehicleId: '', km: '' })
    setTick((n) => n + 1)
  }

  if (!agencyLoaded || !agency) {
    return (
      <div className="agency-inline-loading">
        <CircularProgress size={28} />
        <span>{strings.LOADING}</span>
      </div>
    )
  }

  return (
    <div className="agency-page agency-rem-page">
      <div className="agency-page-head agency-fleet-head">
        <div>
          <h2>{strings.MAINTENANCE}</h2>
          <p>{strings.REM_SUBTITLE}</p>
        </div>
        <div className="agency-rem-head-actions">
          <Button variant="outlined" onClick={() => setOpenOdo(true)} disabled={cars.length === 0}>
            {strings.REM_SET_KM}
          </Button>
          <Button
            variant="contained"
            className="btn-primary"
            startIcon={<AddRounded />}
            onClick={() => setOpenForm(true)}
          >
            {strings.REM_ADD}
          </Button>
        </div>
      </div>

      {(stats.critical > 0 || stats.warning > 0) && (
        <div className={`agency-rem-alert ${stats.critical > 0 ? 'is-critical' : 'is-warning'}`}>
          <NotificationsActiveOutlined />
          <div>
            <strong>
              {stats.critical > 0
                ? strings.REM_ALERT_CRITICAL.replace('{0}', String(stats.critical))
                : strings.REM_ALERT_WARNING.replace('{0}', String(stats.warning))}
            </strong>
            <p>{strings.REM_ALERT_HINT}</p>
          </div>
        </div>
      )}

      <div className="agency-rem-stats">
        <article>
          <span>{strings.REM_STAT_TOTAL}</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="is-critical">
          <span>{strings.REM_SEV_CRITICAL}</span>
          <strong>{stats.critical}</strong>
        </article>
        <article className="is-warning">
          <span>{strings.REM_SEV_WARNING}</span>
          <strong>{stats.warning}</strong>
        </article>
        <article>
          <span>{strings.REM_SEV_INFO}</span>
          <strong>{stats.upcoming}</strong>
        </article>
      </div>

      <div className="agency-rem-modules" role="tablist" aria-label={strings.MAINTENANCE}>
        {MODULES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={module === m.key}
            className={`agency-rem-module ${module === m.key ? 'is-active' : ''} ${moduleCounts[m.key].critical ? 'has-critical' : ''}`}
            onClick={() => setModule(m.key)}
          >
            <span className="agency-rem-module-icon">{m.icon}</span>
            <span className="agency-rem-module-copy">
              <strong>{moduleLabel(m.key)}</strong>
              {m.key !== 'all' && <small>{moduleHint(m.key)}</small>}
            </span>
            <span className="agency-rem-module-count">{moduleCounts[m.key].count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="agency-inline-loading">
          <CircularProgress size={28} />
          <span>{strings.LOADING}</span>
        </div>
      ) : error ? (
        <div className="agency-empty-stage">
          <p>{error}</p>
          <Button onClick={() => void load()}>{strings.RETRY}</Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="agency-empty-stage">
          <div className="agency-empty-ring" aria-hidden />
          <DoneAllRounded className="agency-empty-icon" />
          <p>{strings.REM_EMPTY}</p>
          <Button variant="contained" className="btn-primary" startIcon={<AddRounded />} onClick={() => setOpenForm(true)}>
            {strings.REM_ADD}
          </Button>
        </div>
      ) : (
        <div className="agency-rem-list">
          {visible.map((row) => (
            <article key={row._id} className={`agency-rem-card is-${row.severity}`}>
              <div className="agency-rem-card-top">
                <span className={`agency-rem-sev is-${row.severity}`}>{severityLabel(row.severity)}</span>
                <span className="agency-rem-mod-chip">{moduleLabel(row.module)}</span>
              </div>
              <h3>{row.title}</h3>
              <p className="agency-rem-detail">{row.detail}</p>
              <div className="agency-rem-meta">
                {row.vehicleLabel && <span>{row.vehicleLabel}</span>}
                {row.dueDate && <span>{row.dueDate}</span>}
                {typeof row.currentKm === 'number' && (
                  <span>{row.currentKm.toLocaleString('fr-FR')} km</span>
                )}
              </div>
              <div className="agency-rem-card-actions">
                <Button size="small" onClick={() => dismiss(row._id)}>
                  {strings.REM_DISMISS}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm" className="agency-branch-dialog">
        <DialogContent className="agency-branch-dialog-content">
          <div className="agency-car-dialog-head">
            <div>
              <h2>{strings.REM_ADD_TITLE}</h2>
              <p>{strings.REM_ADD_SUBTITLE}</p>
            </div>
          </div>
          <form className="agency-branch-form" onSubmit={submitReminder}>
            <div className="agency-car-grid">
              <TextField
                select
                label={strings.REM_FIELD_MODULE}
                value={form.module}
                onChange={(e) => setForm((f) => ({ ...f, module: e.target.value as ReminderModule }))}
              >
                <MenuItem value="maintenance">{strings.REM_MOD_MAINTENANCE}</MenuItem>
                <MenuItem value="documents">{strings.REM_MOD_DOCUMENTS}</MenuItem>
                <MenuItem value="mileage">{strings.REM_MOD_MILEAGE}</MenuItem>
                <MenuItem value="contracts">{strings.REM_MOD_CONTRACTS}</MenuItem>
              </TextField>
              <TextField
                label={strings.REM_FIELD_DUE}
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
              <TextField
                className="agency-car-span-2"
                label={strings.REM_FIELD_TITLE}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
              <TextField
                className="agency-car-span-2"
                label={strings.REM_FIELD_VEHICLE}
                value={form.vehicleLabel}
                onChange={(e) => setForm((f) => ({ ...f, vehicleLabel: e.target.value }))}
              />
              <TextField
                className="agency-car-span-2"
                label={strings.REM_FIELD_DETAIL}
                multiline
                minRows={2}
                value={form.detail}
                onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
              />
            </div>
            <div className="agency-car-actions">
              <Button onClick={() => setOpenForm(false)}>{strings.CANCEL}</Button>
              <Button type="submit" variant="contained" className="btn-primary">{strings.REM_SAVE}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openOdo} onClose={() => setOpenOdo(false)} fullWidth maxWidth="xs" className="agency-branch-dialog">
        <DialogContent className="agency-branch-dialog-content">
          <div className="agency-car-dialog-head">
            <div>
              <h2>{strings.REM_SET_KM_TITLE}</h2>
              <p>{strings.REM_SET_KM_SUBTITLE}</p>
            </div>
          </div>
          <form className="agency-branch-form" onSubmit={submitOdo}>
            <div className="agency-car-grid">
              <TextField
                className="agency-car-span-2"
                select
                label={strings.REM_FIELD_VEHICLE}
                value={odoForm.vehicleId}
                onChange={(e) => setOdoForm((f) => ({ ...f, vehicleId: e.target.value }))}
                required
              >
                {cars.map((car) => (
                  <MenuItem key={car._id} value={car._id}>
                    {car.name}{car.licensePlate ? ` · ${car.licensePlate}` : ''}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                className="agency-car-span-2"
                label={strings.REM_FIELD_KM}
                type="number"
                inputProps={{ min: 0 }}
                value={odoForm.km}
                onChange={(e) => setOdoForm((f) => ({ ...f, km: e.target.value }))}
                required
              />
            </div>
            <div className="agency-car-actions">
              <Button onClick={() => setOpenOdo(false)}>{strings.CANCEL}</Button>
              <Button type="submit" variant="contained" className="btn-primary">{strings.REM_SAVE}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AgencyMaintenance
