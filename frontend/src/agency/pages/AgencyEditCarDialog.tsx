import React, { useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import * as AgencyCarService from '@/agency/services/AgencyCarService'

interface AgencyEditCarDialogProps {
  open: boolean
  agencyId: string
  car: bookcarsTypes.Car | null
  onClose: () => void
  onSaved: (car: bookcarsTypes.Car) => void
}

const AgencyEditCarDialog = ({
  open,
  agencyId,
  car,
  onClose,
  onSaved,
}: AgencyEditCarDialogProps) => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    brand: '',
    model: '',
    year: '',
    licensePlate: '',
    dailyPrice: '',
    discountedDailyPrice: '',
    deposit: '',
    mileage: '',
    seats: '',
    doors: '',
    aircon: true,
    available: true,
    type: bookcarsTypes.CarType.Gasoline as string,
    gearbox: bookcarsTypes.GearboxType.Automatic as string,
    range: bookcarsTypes.CarRange.Midi as string,
  })

  useEffect(() => {
    if (!open || !car) {
      return
    }
    setError('')
    setForm({
      brand: car.brand || car.name?.split(' ')[0] || '',
      model: car.model || car.name?.split(' ').slice(1).join(' ') || '',
      year: car.year ? String(car.year) : '',
      licensePlate: car.licensePlate || '',
      dailyPrice: String(car.dailyPrice ?? ''),
      discountedDailyPrice: car.discountedDailyPrice != null ? String(car.discountedDailyPrice) : '',
      deposit: String(car.deposit ?? ''),
      mileage: String(car.mileage ?? ''),
      seats: String(car.seats ?? ''),
      doors: String(car.doors ?? ''),
      aircon: !!car.aircon,
      available: !!car.available,
      type: car.type || bookcarsTypes.CarType.Gasoline,
      gearbox: car.gearbox || bookcarsTypes.GearboxType.Automatic,
      range: car.range || bookcarsTypes.CarRange.Midi,
    })
  }, [open, car])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!car) {
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = AgencyCarService.buildUpdatePayload(car, agencyId, {
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year) || undefined,
        licensePlate: form.licensePlate.trim(),
        dailyPrice: Number(form.dailyPrice),
        discountedDailyPrice: form.discountedDailyPrice
          ? Number(form.discountedDailyPrice)
          : null,
        deposit: Number(form.deposit),
        mileage: Number(form.mileage),
        seats: Number(form.seats),
        doors: Number(form.doors),
        aircon: form.aircon,
        available: form.available,
        type: form.type,
        gearbox: form.gearbox,
        range: form.range,
      })
      const updated = await AgencyCarService.update(payload)
      onSaved(updated)
    } catch {
      setError(strings.CAR_SAVE_ERROR)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      className="agency-branch-dialog"
    >
      <DialogContent className="agency-branch-dialog-content">
        <div className="agency-car-dialog-head">
          <div>
            <h2>{strings.CAR_EDIT_TITLE}</h2>
            <p>{strings.CAR_EDIT_SUBTITLE}</p>
          </div>
        </div>

        <form className="agency-branch-form" onSubmit={(e) => void onSubmit(e)}>
          <div className="agency-car-grid">
            <TextField
              label={strings.CAR_BRAND}
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              required
            />
            <TextField
              label={strings.CAR_MODEL}
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              required
            />
            <TextField
              label={strings.CAR_YEAR}
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
            />
            <TextField
              label={strings.CAR_PLATE}
              value={form.licensePlate}
              onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
            />
            <TextField
              select
              label={strings.CAR_CATEGORY}
              value={form.range}
              onChange={(e) => setForm((f) => ({ ...f, range: e.target.value }))}
            >
              <MenuItem value={bookcarsTypes.CarRange.Mini}>{strings.CAR_CAT_MINI}</MenuItem>
              <MenuItem value={bookcarsTypes.CarRange.Midi}>{strings.CAR_CAT_MIDI}</MenuItem>
              <MenuItem value={bookcarsTypes.CarRange.Maxi}>{strings.CAR_CAT_MAXI}</MenuItem>
              <MenuItem value={bookcarsTypes.CarRange.Scooter}>{strings.CAR_CAT_SCOOTER}</MenuItem>
              <MenuItem value={bookcarsTypes.CarRange.Bus}>{strings.CAR_CAT_BUS}</MenuItem>
              <MenuItem value={bookcarsTypes.CarRange.Truck}>{strings.CAR_CAT_TRUCK}</MenuItem>
              <MenuItem value={bookcarsTypes.CarRange.Caravan}>{strings.CAR_CAT_CARAVAN}</MenuItem>
            </TextField>
            <TextField
              select
              label={strings.CAR_FUEL}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <MenuItem value={bookcarsTypes.CarType.Gasoline}>{strings.CAR_FUEL_GAS}</MenuItem>
              <MenuItem value={bookcarsTypes.CarType.Diesel}>{strings.CAR_FUEL_DIESEL}</MenuItem>
              <MenuItem value={bookcarsTypes.CarType.Hybrid}>{strings.CAR_FUEL_HYBRID}</MenuItem>
              <MenuItem value={bookcarsTypes.CarType.Electric}>{strings.CAR_FUEL_ELECTRIC}</MenuItem>
              <MenuItem value={bookcarsTypes.CarType.PlugInHybrid}>{strings.CAR_FUEL_PHEV}</MenuItem>
            </TextField>
            <TextField
              select
              label={strings.CAR_GEARBOX}
              value={form.gearbox}
              onChange={(e) => setForm((f) => ({ ...f, gearbox: e.target.value }))}
            >
              <MenuItem value={bookcarsTypes.GearboxType.Manual}>{strings.CAR_GEAR_MANUAL}</MenuItem>
              <MenuItem value={bookcarsTypes.GearboxType.Automatic}>{strings.CAR_GEAR_AUTO}</MenuItem>
            </TextField>
            <TextField
              label={strings.CAR_SEATS}
              type="number"
              value={form.seats}
              onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
            />
            <TextField
              label={strings.CAR_DOORS}
              type="number"
              value={form.doors}
              onChange={(e) => setForm((f) => ({ ...f, doors: e.target.value }))}
            />
            <TextField
              label={strings.CAR_DAILY_PRICE}
              type="number"
              value={form.dailyPrice}
              onChange={(e) => setForm((f) => ({ ...f, dailyPrice: e.target.value }))}
              required
            />
            <TextField
              label={strings.CAR_OFF_SEASON_PRICE}
              type="number"
              value={form.discountedDailyPrice}
              onChange={(e) => setForm((f) => ({ ...f, discountedDailyPrice: e.target.value }))}
            />
            <TextField
              label={strings.CAR_DEPOSIT}
              type="number"
              value={form.deposit}
              onChange={(e) => setForm((f) => ({ ...f, deposit: e.target.value }))}
            />
            <TextField
              label={strings.CAR_KM_LIMIT}
              type="number"
              value={form.mileage}
              onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))}
            />
            <FormControlLabel
              className="agency-car-span-2"
              control={(
                <Checkbox
                  checked={form.aircon}
                  onChange={(e) => setForm((f) => ({ ...f, aircon: e.target.checked }))}
                />
              )}
              label={strings.CAR_AIRCON}
            />
            <FormControlLabel
              className="agency-car-span-2"
              control={(
                <Checkbox
                  checked={form.available}
                  onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
                />
              )}
              label={strings.CAR_AVAILABLE}
            />
          </div>

          {error ? <p className="agency-car-error">{error}</p> : null}

          <div className="agency-car-actions">
            <Button onClick={onClose} disabled={saving}>{strings.CANCEL}</Button>
            <Button type="submit" variant="contained" className="btn-primary" disabled={saving}>
              {saving ? <CircularProgress size={20} color="inherit" /> : strings.CAR_SAVE}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgencyEditCarDialog
