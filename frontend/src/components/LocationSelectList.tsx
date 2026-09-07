import React, { useState, useEffect, useRef } from 'react'
import { TextFieldVariants } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import * as LocationService from '@/services/LocationService'
import * as GooglePlacesService from '@/services/GooglePlacesService'
import type { PlaceSuggestion } from '@/services/GooglePlacesService'
import * as helper from '@/utils/helper'
import { strings as commonStrings } from '@/lang/common'
import MultipleSelect from './MultipleSelect'

interface LocationSelectListProps {
  value?: bookcarsTypes.Location | bookcarsTypes.Location[]
  multiple?: boolean
  label?: string
  required?: boolean
  variant?: TextFieldVariants
  hidePopupIcon?: boolean
  customOpen?: boolean
  readOnly?: boolean
  init?: boolean
  /** When true and a Google Maps key is set, suggestions come from Places (TN). */
  googlePlaces?: boolean
  onChange?: (values: bookcarsTypes.Option[]) => void
}

const LocationSelectList = ({
  value,
  multiple,
  label,
  required,
  variant,
  hidePopupIcon,
  customOpen,
  readOnly,
  init: listInit,
  googlePlaces = false,
  onChange
}: LocationSelectListProps) => {
  const placesEnabled = googlePlaces && GooglePlacesService.placesAvailable()
  const [init, setInit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<PlaceSuggestion[]>([])
  const [fetch, setFetch] = useState(true)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<bookcarsTypes.Location[]>([])
  const debounceRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!value) {
      return
    }
    const _value = multiple
      ? (Array.isArray(value) ? value : [value])
      : [value as bookcarsTypes.Location]
    if (!bookcarsHelper.arrayEqual(selectedOptions, _value)) {
      setSelectedOptions(_value)
    }
  }, [value, multiple, selectedOptions])

  useEffect(() => () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }
  }, [])

  const fetchDbLocations = async (_page: number, _keyword: string) => {
    const data = await LocationService.getLocations(_keyword, _page, env.PAGE_SIZE)
    const _data = Array.isArray(data) && data.length > 0 ? data[0] : { pageInfo: { totalRecord: 0 }, resultData: [] }
    if (!_data) {
      return { rows: [] as bookcarsTypes.Location[], hasMore: false, totalRecords: 0 }
    }
    const totalRecords = Array.isArray(_data.pageInfo) && _data.pageInfo.length > 0 ? _data.pageInfo[0].totalRecords : 0
    return {
      rows: Array.isArray(_data.resultData) ? _data.resultData : [],
      hasMore: Array.isArray(_data.resultData) && _data.resultData.length > 0,
      totalRecords,
    }
  }

  const toDbSuggestions = (locs: bookcarsTypes.Location[]): PlaceSuggestion[] =>
    locs.map((loc) => ({
      ...loc,
      _id: loc._id,
      name: loc.name || '',
      secondaryText: undefined,
      isGooglePlace: false,
    }))

  const mergeSuggestions = (googleRows: PlaceSuggestion[], dbRows: bookcarsTypes.Location[]) => {
    const googleNames = new Set(
      googleRows
        .map((row) => (row.name || '').toLowerCase())
        .filter(Boolean),
    )
    const dbOnly = toDbSuggestions(dbRows)
      .filter((loc) => loc.name && !googleNames.has(loc.name.toLowerCase()))
    return [...googleRows, ...dbOnly]
  }

  const fetchData = async (_page: number, _keyword: string, onFetch?: bookcarsTypes.DataEvent<bookcarsTypes.Location>) => {
    const requestId = ++requestIdRef.current
    const isCurrent = () => requestId === requestIdRef.current

    try {
      if (!(fetch || _page === 1)) {
        return
      }

      setLoading(true)
      const trimmed = _keyword.trim()

      if (placesEnabled && trimmed.length >= 2) {
        // Fetch Google + DB in parallel; Google is the primary source for free-text search
        const [googleResult, db] = await Promise.all([
          GooglePlacesService.getPlacePredictions(trimmed)
            .then((rows) => ({ rows, error: null as Error | null }))
            .catch((error: unknown) => ({
              rows: [] as PlaceSuggestion[],
              error: error instanceof Error ? error : new Error(String(error)),
            })),
          fetchDbLocations(1, trimmed).catch(() => ({
            rows: [] as bookcarsTypes.Location[],
            hasMore: false,
            totalRecords: 0,
          })),
        ])

        if (!isCurrent()) {
          return
        }

        if (googleResult.error) {
          // Surface referrer / API misconfig instead of a silent "Pas de résultats"
          helper.error(googleResult.error, googleResult.error.message)
        }

        const merged = mergeSuggestions(googleResult.rows, db.rows)
        setRows(merged)
        setFetch(false)
        if (onFetch) {
          onFetch({ rows: merged as bookcarsTypes.Location[], rowCount: merged.length })
        }
        return
      }

      const db = await fetchDbLocations(_page, _keyword)
      if (!isCurrent()) {
        return
      }

      const _rows = _page === 1 ? db.rows : [...rows, ...db.rows]
      setRows(_rows as PlaceSuggestion[])
      setFetch(db.hasMore)

      if (onFetch) {
        onFetch({ rows: db.rows, rowCount: db.totalRecords })
      }
    } catch (err) {
      if (isCurrent()) {
        helper.error(err)
        setRows([])
      }
    } finally {
      if (isCurrent()) {
        setLoading(false)
      }
    }
  }

  const scheduleFetch = (nextKeyword: string) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }
    const delay = placesEnabled && nextKeyword.trim().length >= 2 ? 280 : 0
    debounceRef.current = window.setTimeout(() => {
      void fetchData(1, nextKeyword)
    }, delay)
  }

  const handleChange = async (values: bookcarsTypes.Option[]) => {
    if (!onChange) {
      return
    }

    if (!values?.length) {
      onChange([])
      return
    }

    const selected = values[0] as PlaceSuggestion
    if (!GooglePlacesService.isGooglePlaceId(selected._id)) {
      onChange(values)
      return
    }

    setLoading(true)
    try {
      const resolved = await GooglePlacesService.resolveGooglePlaceToLocation(selected)
      if (!resolved?._id) {
        helper.error(undefined, commonStrings.LOCATION_GOOGLE_RESOLVE_ERROR)
        return
      }
      setSelectedOptions([resolved])
      setRows((prev) => {
        const withoutGoogle = prev.filter((row) => row._id !== selected._id && row._id !== resolved._id)
        return [resolved as PlaceSuggestion, ...withoutGoogle]
      })
      onChange([{ _id: resolved._id, name: resolved.name || selected.name, image: resolved.image }])
    } catch (err) {
      helper.error(err, commonStrings.LOCATION_GOOGLE_RESOLVE_ERROR)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MultipleSelect
      loading={loading}
      label={label || ''}
      callbackFromMultipleSelect={handleChange}
      options={rows}
      selectedOptions={selectedOptions}
      required={required || false}
      multiple={multiple}
      type={bookcarsTypes.RecordType.Location}
      variant={variant || 'standard'}
      hidePopupIcon={hidePopupIcon}
      customOpen={customOpen}
      readOnly={readOnly}
      disableClientFilter={placesEnabled}
      ListboxProps={{
        onScroll: (event) => {
          if (placesEnabled && keyword.trim().length >= 2) {
            return
          }
          const listboxNode = event.currentTarget
          if (fetch && !loading && listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - env.PAGE_OFFSET) {
            const p = page + 1
            setPage(p)
            void fetchData(p, keyword)
          }
        },
      }}
      onFocus={() => {
        if (!init && listInit) {
          const p = 1
          setPage(p)
          void fetchData(p, keyword, () => {
            setInit(true)
          })
        }
      }}
      onInputChange={(_event, val, reason) => {
        // Ignore MUI internal resets that would cancel Places search mid-flight
        if (reason === 'reset') {
          return
        }

        const _value = val ?? ''

        if (_value !== keyword) {
          setPage(1)
          setKeyword(_value)
          setFetch(true)
          scheduleFetch(_value)
        }
      }}
      onClear={() => {
        setRows([])
        setPage(1)
        setKeyword('')
        setFetch(true)
        scheduleFetch('')
      }}
    />
  )
}

export default LocationSelectList
