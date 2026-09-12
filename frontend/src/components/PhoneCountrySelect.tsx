import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search as SearchIcon, Public as PublicIcon } from '@mui/icons-material'
import { CircleFlag } from 'react-circle-flags'
import { getCountryCallingCode, type Country } from 'react-phone-number-input'

type CountryOption = {
  value?: string
  label: string
  divider?: boolean
}

export type PhoneCountrySelectProps = {
  value?: string
  options: CountryOption[]
  onChange: (value?: string) => void
  onFocus?: React.FocusEventHandler
  onBlur?: React.FocusEventHandler
  disabled?: boolean
  readOnly?: boolean
  name?: string
  className?: string
  iconComponent?: React.ElementType
}

const dialCode = (country?: string): string => {
  if (!country) {
    return ''
  }
  try {
    return `+${getCountryCallingCode(country as Country)}`
  } catch {
    return ''
  }
}

/**
 * Searchable country list with flags + calling codes (matches the product phone UX).
 */
const PhoneCountrySelect = ({
  value,
  options,
  onChange,
  onFocus,
  onBlur,
  disabled,
  readOnly,
  name,
}: PhoneCountrySelectProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 320 })
  const [activeIndex, setActiveIndex] = useState(0)

  const countries = useMemo(
    () => options.filter((option) => !option.divider),
    [options],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return countries
    }
    return countries.filter((option) => {
      const code = option.value ? dialCode(option.value).toLowerCase() : ''
      return (
        option.label.toLowerCase().includes(q)
        || (option.value || '').toLowerCase().includes(q)
        || code.includes(q)
      )
    })
  }, [countries, query])

  const selected = countries.find((option) => option.value === value) || countries.find((option) => !option.value)

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }
    const width = Math.max(300, Math.min(360, window.innerWidth - 24))
    let left = rect.left
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12)
    }
    setMenuPos({
      top: rect.bottom + 6,
      left,
      width,
    })
  }

  const close = () => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }

  const openMenu = () => {
    if (disabled || readOnly) {
      return
    }
    updatePosition()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) {
      return undefined
    }
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) {
        return
      }
      close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        buttonRef.current?.focus()
      }
    }
    const onReposition = () => updatePosition()
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    requestAnimationFrame(() => searchRef.current?.focus())
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const pick = (next?: string) => {
    onChange(next)
    close()
    buttonRef.current?.focus()
  }

  const onListKeyDown = (event: React.KeyboardEvent) => {
    if (!filtered.length) {
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = filtered[activeIndex]
      if (option) {
        pick(option.value)
      }
    }
  }

  return (
    <div className="PhoneInputCountry phone-country-select" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        name={name}
        className={`phone-country-trigger${open ? ' phone-country-trigger--open' : ''}`}
        disabled={disabled || readOnly}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected?.label || 'Country'}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={() => (open ? close() : openMenu())}
      >
        {value ? (
          <CircleFlag countryCode={value.toLowerCase()} height={20} title={selected?.label || value} />
        ) : (
          <PublicIcon className="phone-country-intl-icon" fontSize="small" />
        )}
        <span className="PhoneInputCountrySelectArrow" aria-hidden />
      </button>

      {open && createPortal(
        <div
          ref={listRef}
          className="phone-country-menu"
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          role="listbox"
          onKeyDown={onListKeyDown}
        >
          <div className="phone-country-search">
            <SearchIcon className="phone-country-search-icon" fontSize="small" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onListKeyDown}
              placeholder="Search"
              aria-label="Search country"
            />
          </div>
          <div className="phone-country-list">
            {filtered.map((option, index) => {
              const isActive = index === activeIndex
              const isSelected = (option.value || undefined) === (value || undefined)
              const code = dialCode(option.value)
              return (
                <button
                  key={option.value || 'ZZ'}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    'phone-country-option',
                    isActive ? 'phone-country-option--active' : '',
                    isSelected ? 'phone-country-option--selected' : '',
                  ].filter(Boolean).join(' ')}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pick(option.value)}
                >
                  <span className="phone-country-option-flag">
                    {option.value ? (
                      <CircleFlag countryCode={option.value.toLowerCase()} height={18} title={option.label} />
                    ) : (
                      <span className="phone-country-option-flag-fallback" aria-hidden />
                    )}
                  </span>
                  <span className="phone-country-option-name">{option.label}</span>
                  {code ? <span className="phone-country-option-code">{code}</span> : null}
                </button>
              )
            })}
            {!filtered.length && (
              <div className="phone-country-empty">No countries found</div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

export default PhoneCountrySelect
