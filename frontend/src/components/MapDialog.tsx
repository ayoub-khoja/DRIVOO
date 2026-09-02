import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/search-filters'
import { strings as commonStrings } from '@/lang/common'
import Map from '@/components/Map'
import * as UserService from '@/services/UserService'
import * as PaymentService from '@/services/PaymentService'
import { getMinPrice } from '@/utils/searchFacetsHelper'

import '@/assets/css/map-dialog.css'

interface MapDialogProps {
  pickupLocation?: bookcarsTypes.Location
  openMapDialog: boolean
  onClose: () => void
  carCount?: number
  baselineCars?: bookcarsTypes.Car[]
  from?: Date
  to?: Date
}

const MapDialog = ({
  pickupLocation,
  openMapDialog: openMapDialogProp,
  onClose,
  carCount = 0,
  baselineCars = [],
  from,
  to,
}: MapDialogProps) => {
  const [openMapDialog, setOpenMapDialog] = useState(openMapDialogProp)
  const [minPriceLabel, setMinPriceLabel] = useState('')

  useEffect(() => {
    setOpenMapDialog(openMapDialogProp)
  }, [openMapDialogProp])

  useEffect(() => {
    const loadPrice = async () => {
      if (!from || !to || baselineCars.length === 0) {
        setMinPriceLabel('')
        return
      }
      const minDaily = getMinPrice(baselineCars)
      const days = bookcarsHelper.days(from, to)
      const total = await PaymentService.convertPrice(minDaily * days)
      const language = UserService.getLanguage()
      setMinPriceLabel(bookcarsHelper.formatPrice(total, commonStrings.CURRENCY, language))
    }
    loadPrice()
  }, [baselineCars, from, to])

  const close = useCallback(() => {
    setOpenMapDialog(false)
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const days = useMemo(() => (from && to ? bookcarsHelper.days(from, to) : 0), [from, to])

  return (
    <Dialog
      fullWidth={env.isMobile}
      maxWidth={false}
      open={openMapDialog}
      onClose={() => {
        close()
      }}
      sx={{
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '95%',
            height: '95%',
          },
          '& .MuiDialogTitle-root': {
            padding: 0,
            backgroundColor: '#1a1a1a',
          },
          '& .MuiDialogContent-root': {
            padding: 0,
            position: 'relative',
          }
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton className="close-btn" onClick={close}>
            <CloseIcon className="close-icon" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent className="map-dialog-content">
        {pickupLocation && (
          <>
            <Map
              position={[pickupLocation.latitude || 36.191113, pickupLocation.longitude || 44.009167]}
              initialZoom={pickupLocation.latitude && pickupLocation.longitude ? 10 : 2.5}
              locations={[pickupLocation]}
              parkingSpots={pickupLocation.parkingSpots}
              className="map"
            />
            <div className="map-dialog-popup">
              <h3>{pickupLocation.name}</h3>
              {minPriceLabel && days > 0 && (
                <p>
                  {strings.PRICE_FOR_DAYS}
                  {' '}
                  {days}
                  {' '}
                  {strings.DAYS}
                  {' '}
                  :
                  {' '}
                  {strings.FROM_PRICE}
                  {' '}
                  <strong>{minPriceLabel}</strong>
                </p>
              )}
              {carCount > 0 && (
                <Button variant="contained" className="map-dialog-show-cars" onClick={close}>
                  {strings.SHOW_CARS}
                  {' '}
                  {carCount}
                  {' '}
                  {strings.CARS}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default MapDialog
