import React, { useMemo } from 'react'
import PhoneInput, {
  type Country,
  type FlagProps,
  type Labels,
  getCountryCallingCode,
} from 'react-phone-number-input'
import {
  FormControl,
  FormHelperText,
  InputLabel,
  type FormControlProps,
} from '@mui/material'
import { CircleFlag } from 'react-circle-flags'
import fr from 'react-phone-number-input/locale/fr.json'
import en from 'react-phone-number-input/locale/en.json'
import ar from 'react-phone-number-input/locale/ar.json'
import * as UserService from '@/services/UserService'
import PhoneCountrySelect from '@/components/PhoneCountrySelect'

import 'react-phone-number-input/style.css'
import '@/assets/css/phone-input.css'

const DEFAULT_COUNTRY: Country = 'TN'

const localeMap: Record<string, Labels> = {
  fr: fr as Labels,
  en: en as Labels,
  ar: ar as Labels,
}

const PhoneFlag = ({ country, countryName }: FlagProps) => (
  <span className="PhoneInputCountryIcon PhoneInputCountryIcon--border phone-input-circle-flag" title={countryName}>
    <CircleFlag countryCode={country.toLowerCase()} height={18} title={countryName} />
  </span>
)

export type PhoneInputFieldProps = {
  label?: string
  value?: string
  onChange?: (value: string) => void
  onBlur?: React.FocusEventHandler<HTMLElement>
  name?: string
  id?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: React.ReactNode
  fullWidth?: boolean
  margin?: FormControlProps['margin']
  className?: string
  placeholder?: string
  defaultCountry?: Country
  autoComplete?: string
  /** Visual variant: outlined (default) or underline (settings/admin). */
  variant?: 'outlined' | 'standard'
}

const examplePlaceholder = (country: Country): string => {
  if (country === 'TN') {
    return '20 123 456'
  }
  try {
    return `+${getCountryCallingCode(country)}`
  } catch {
    return ''
  }
}

/**
 * Phone field with searchable country flag selector (default Tunisia).
 * Value is E.164 (e.g. +21620123456) for validator.isMobilePhone compatibility.
 */
const PhoneInputField = ({
  label,
  value,
  onChange,
  onBlur,
  name,
  id,
  required,
  disabled,
  error,
  helperText,
  fullWidth = true,
  margin = 'dense',
  className,
  placeholder,
  defaultCountry = DEFAULT_COUNTRY,
  autoComplete = 'tel',
  variant = 'outlined',
}: PhoneInputFieldProps) => {
  const labels = useMemo(() => {
    const lang = UserService.getLanguage() || 'fr'
    return localeMap[lang] || fr
  }, [])

  const inputId = id || name || 'phone-input'
  const labelId = label ? `${inputId}-label` : undefined

  return (
    <FormControl
      fullWidth={fullWidth}
      margin={margin}
      error={!!error}
      required={required}
      disabled={disabled}
      className={[
        'phone-input-field',
        variant === 'standard' ? 'phone-input-field--standard' : '',
        className,
      ].filter(Boolean).join(' ')}
      variant="outlined"
    >
      {label ? (
        <InputLabel
          id={labelId}
          htmlFor={inputId}
          className={required ? 'required' : undefined}
          shrink
        >
          {label}
        </InputLabel>
      ) : null}
      <PhoneInput
        international={false}
        defaultCountry={defaultCountry}
        labels={labels as Labels}
        flagComponent={PhoneFlag}
        countrySelectComponent={PhoneCountrySelect}
        countryCallingCodeEditable={false}
        addInternationalOption
        value={value || undefined}
        onChange={(next) => onChange?.(next || '')}
        onBlur={onBlur}
        name={name}
        id={inputId}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder || examplePlaceholder(defaultCountry)}
        numberInputProps={{
          className: 'phone-input-number',
          'aria-labelledby': labelId,
        }}
        className={[
          'PhoneInput',
          'phone-input-control',
          error ? 'phone-input-control--error' : '',
        ].filter(Boolean).join(' ')}
      />
      {helperText ? (
        <FormHelperText error={!!error}>{helperText}</FormHelperText>
      ) : null}
    </FormControl>
  )
}

export default PhoneInputField
