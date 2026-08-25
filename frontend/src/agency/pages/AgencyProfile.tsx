import React, { useEffect, useMemo, useState } from 'react'
import { Autocomplete, Button, CircularProgress, TextField } from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import * as langHelper from '@/utils/langHelper'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyAuthService from '@/agency/services/AgencyAuthService'
import * as AgencyProfileService from '@/agency/services/AgencyProfileService'
import * as GeoService from '@/services/GeoService'
import AgencyLogoUploader from '@/agency/components/AgencyLogoUploader'
import AgencySharePanel from '@/agency/components/AgencySharePanel'
import { agencyProfileSchema, AgencyProfileFormFields } from '@/agency/models/AgencyProfileForm'

const emptyValues: AgencyProfileFormFields = {
  fullName: '',
  phone: '',
  whatsapp: '',
  bio: '',
  address: '',
  city: '',
  governorate: '',
  postalCode: '',
  taxId: '',
  rneNumber: '',
  iban: '',
  legalRepFirstName: '',
  legalRepLastName: '',
  legalRepTitle: '',
  legalRepCin: '',
}

const fromAgency = (agency: bookcarsTypes.User): AgencyProfileFormFields => ({
  fullName: agency.fullName || '',
  phone: agency.phone || '',
  whatsapp: agency.whatsapp || '',
  bio: agency.bio || '',
  address: agency.address || '',
  city: agency.city || '',
  governorate: agency.governorate || '',
  postalCode: agency.postalCode || '',
  taxId: agency.taxId || '',
  rneNumber: agency.rneNumber || '',
  iban: agency.iban || '',
  legalRepFirstName: agency.legalRepFirstName || '',
  legalRepLastName: agency.legalRepLastName || '',
  legalRepTitle: agency.legalRepTitle || '',
  legalRepCin: agency.legalRepCin || '',
})

const AgencyProfile = () => {
  const { agency, setAgency } = useAgencyContext()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [cities, setCities] = useState<bookcarsTypes.GeoCity[]>([])
  const [municipalities, setMunicipalities] = useState<bookcarsTypes.GeoMunicipality[]>([])
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [geoError, setGeoError] = useState('')
  const language = agency?.language || langHelper.getLanguage()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<AgencyProfileFormFields>({
    resolver: zodResolver(agencyProfileSchema),
    mode: 'onBlur',
    defaultValues: emptyValues,
  })

  const governorate = watch('governorate')
  const city = watch('city')
  const postalCode = watch('postalCode')

  useEffect(() => {
    if (agency) {
      reset(fromAgency(agency))
    }
  }, [agency, reset])

  useEffect(() => {
    let cancelled = false
    const loadGeo = async () => {
      try {
        const catalog = await GeoService.getTunisiaCatalog()
        if (!cancelled) {
          setCities(catalog.cities)
          setMunicipalities(catalog.municipalities)
        }
      } catch {
        if (!cancelled) {
          setGeoError(strings.PROFILE_GEO_ERROR)
        }
      }
    }
    void loadGeo()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!cities.length) {
      return
    }
    const match = cities.find((item) => GeoService.matchGeoLabel(item.names, governorate))
    setSelectedCityId(match?.id ?? null)
  }, [cities, governorate])

  const selectedGovernorate = useMemo(
    () => cities.find((item) => GeoService.matchGeoLabel(item.names, governorate)) || null,
    [cities, governorate],
  )

  const municipalityOptions = useMemo(
    () => (selectedCityId ? municipalities.filter((item) => item.cityId === selectedCityId) : []),
    [municipalities, selectedCityId],
  )

  const selectedMunicipality = useMemo(
    () => municipalityOptions.find((item) => GeoService.matchGeoLabel(item.names, city)) || null,
    [municipalityOptions, city],
  )

  const legalName = useMemo(() => {
    if (!agency) {
      return ''
    }
    const name = [agency.legalRepFirstName, agency.legalRepLastName].filter(Boolean).join(' ')
    return name || strings.PROFILE_EMPTY
  }, [agency])

  if (!agency) {
    return null
  }

  const applyUser = (next: bookcarsTypes.User) => {
    setAgency((current) => {
      const merged = current ? { ...current, ...next } : next
      AgencyAuthService.setCurrentUser({
        _id: merged._id,
        email: merged.email,
        fullName: merged.fullName,
        language: merged.language,
        type: merged.type,
        agencyApproved: merged.agencyApproved,
        parentAgency: typeof merged.parentAgency === 'object' && merged.parentAgency
          ? merged.parentAgency._id
          : merged.parentAgency,
      })
      return merged
    })
  }

  const onSubmit = async (values: AgencyProfileFormFields) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await AgencyProfileService.updateProfile({
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || undefined,
        whatsapp: values.whatsapp?.trim() || undefined,
        bio: values.bio?.trim() || undefined,
        address: values.address?.trim() || undefined,
        city: values.city?.trim() || undefined,
        governorate: values.governorate?.trim() || undefined,
        postalCode: values.postalCode?.trim() || undefined,
        taxId: values.taxId?.trim() || undefined,
        rneNumber: values.rneNumber?.trim() || undefined,
        iban: values.iban?.trim() || undefined,
        legalRepFirstName: values.legalRepFirstName?.trim() || undefined,
        legalRepLastName: values.legalRepLastName?.trim() || undefined,
        legalRepTitle: values.legalRepTitle?.trim() || undefined,
        legalRepCin: values.legalRepCin?.trim() || undefined,
      })
      applyUser(updated)
      reset(fromAgency({ ...agency, ...updated }))
      setMessage(strings.PROFILE_SAVED)
    } catch {
      setError(strings.PROFILE_SAVE_ERROR)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="agency-page">
      <div className="agency-page-head">
        <div>
          <h2>{strings.PROFILE}</h2>
          <p>{strings.PROFILE_SUBTITLE}</p>
        </div>
      </div>

      <AgencyLogoUploader
        avatar={agency.avatar}
        agencyName={agency.fullName}
        share={<AgencySharePanel agencyName={agency.fullName} published={agency.agencyApproved !== false} />}
        onUploaded={(avatar) => applyUser({ ...agency, avatar })}
        onDeleted={() => applyUser({ ...agency, avatar: undefined })}
      />

      <section className="agency-profile-meta">
        <article>
          <span>{strings.PROFILE_EMAIL}</span>
          <strong>{agency.email || '—'}</strong>
        </article>
        <article>
          <span>{strings.PROFILE_STATUS}</span>
          <strong>{agency.agencyApproved === false ? strings.PENDING_TITLE : strings.PROFILE_STATUS_LIVE}</strong>
        </article>
        <article>
          <span>{strings.PROFILE_LEGAL_REP}</span>
          <strong>{legalName}</strong>
        </article>
        <article>
          <span>{strings.PROFILE_RNE_DOC}</span>
          <strong>{agency.rneDocument ? strings.PROFILE_DOC_READY : strings.PROFILE_EMPTY}</strong>
        </article>
      </section>

      <form className="agency-profile-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className="agency-profile-panel">
          <h3>{strings.PROFILE_IDENTITY}</h3>
          <div className="agency-profile-grid">
            <TextField
              label={strings.PROFILE_NAME}
              fullWidth
              {...register('fullName')}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
            />
            <TextField
              label={strings.PROFILE_BIO}
              fullWidth
              className="agency-profile-span-2"
              multiline
              minRows={3}
              {...register('bio')}
              error={!!errors.bio}
              helperText={errors.bio?.message}
            />
          </div>
        </section>

        <section className="agency-profile-panel">
          <h3>{strings.PROFILE_CONTACT}</h3>
          <div className="agency-profile-grid">
            <TextField label={strings.PROFILE_PHONE} fullWidth {...register('phone')} />
            <TextField label={strings.PROFILE_WHATSAPP} fullWidth {...register('whatsapp')} />
            <TextField label={strings.PROFILE_ADDRESS} fullWidth className="agency-profile-span-2" {...register('address')} />
            <Autocomplete
              options={cities}
              value={selectedGovernorate}
              getOptionLabel={(option) => GeoService.getGeoLabel(option.names, language)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, nextCity) => {
                setSelectedCityId(nextCity?.id ?? null)
                setValue(
                  'governorate',
                  nextCity ? GeoService.getGeoLabel(nextCity.names, language) : '',
                  { shouldValidate: true, shouldDirty: true },
                )
                setValue('city', '', { shouldValidate: true, shouldDirty: true })
                setValue('postalCode', '', { shouldValidate: true, shouldDirty: true })
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={strings.PROFILE_GOVERNORATE}
                  placeholder={strings.PROFILE_GEO_CITY}
                  error={!!errors.governorate || !!geoError}
                  helperText={errors.governorate?.message || geoError || ''}
                />
              )}
            />
            <Autocomplete
              options={municipalityOptions}
              value={selectedMunicipality}
              disabled={!selectedCityId}
              getOptionLabel={(option) => GeoService.getGeoLabel(option.names, language)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, nextMunicipality) => {
                setValue(
                  'city',
                  nextMunicipality ? GeoService.getGeoLabel(nextMunicipality.names, language) : '',
                  { shouldValidate: true, shouldDirty: true },
                )
                setValue(
                  'postalCode',
                  nextMunicipality?.postalCode?.trim() || '',
                  { shouldValidate: true, shouldDirty: true },
                )
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={strings.PROFILE_CITY}
                  placeholder={strings.PROFILE_GEO_MUNICIPALITY}
                  error={!!errors.city}
                  helperText={errors.city?.message || (!selectedCityId ? strings.PROFILE_GEO_MUNICIPALITY : '')}
                />
              )}
            />
            <TextField
              label={strings.PROFILE_POSTAL}
              fullWidth
              name="postalCode"
              value={postalCode}
              onChange={(event) => {
                setValue('postalCode', event.target.value, { shouldValidate: true, shouldDirty: true })
              }}
              InputLabelProps={{ shrink: postalCode ? true : undefined }}
              helperText={!city ? strings.PROFILE_GEO_MUNICIPALITY : undefined}
            />
          </div>
        </section>

        <section className="agency-profile-panel">
          <h3>{strings.PROFILE_LEGAL}</h3>
          <div className="agency-profile-grid">
            <TextField label={strings.PROFILE_TAX} fullWidth {...register('taxId')} />
            <TextField label={strings.PROFILE_RNE} fullWidth {...register('rneNumber')} />
            <TextField label={strings.PROFILE_IBAN} fullWidth className="agency-profile-span-2" {...register('iban')} />
            <TextField label={strings.PROFILE_REP_FIRST} fullWidth {...register('legalRepFirstName')} />
            <TextField label={strings.PROFILE_REP_LAST} fullWidth {...register('legalRepLastName')} />
            <TextField label={strings.PROFILE_REP_TITLE} fullWidth {...register('legalRepTitle')} />
            <TextField label={strings.PROFILE_REP_CIN} fullWidth {...register('legalRepCin')} />
          </div>
        </section>

        <div className="agency-profile-save">
          {error && <p className="agency-car-error">{error}</p>}
          {message && <p className="agency-profile-ok">{message}</p>}
          <Button
            type="submit"
            variant="contained"
            className="btn-primary"
            disabled={saving || !isDirty}
          >
            {saving ? <CircularProgress size={20} /> : strings.PROFILE_SAVE}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AgencyProfile
