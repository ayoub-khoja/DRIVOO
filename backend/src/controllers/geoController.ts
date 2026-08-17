import { Request, Response } from 'express'
import * as geo from '../fixtures/geo'
import * as logger from '../utils/logger'
import i18n from '../lang/i18n'

const CACHE_CONTROL = 'public, max-age=86400'

/**
 * Full Tunisia geo catalog (cities + municipalities).
 */
export const getCatalog = (_req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', CACHE_CONTROL)
    res.json(geo.getTunisiaCatalog())
  } catch (err) {
    logger.error(`[geo.getCatalog] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Tunisia governorates / cities.
 */
export const getCities = (_req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', CACHE_CONTROL)
    res.json(geo.getTunisiaCities())
  } catch (err) {
    logger.error(`[geo.getCities] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Municipalities for a given city / governorate.
 */
export const getMunicipalities = (req: Request, res: Response) => {
  try {
    const cityId = Number.parseInt(req.params.cityId, 10)
    if (!Number.isFinite(cityId) || cityId < 1) {
      res.status(400).send('Invalid cityId')
      return
    }

    res.setHeader('Cache-Control', CACHE_CONTROL)
    res.json(geo.getTunisiaMunicipalitiesByCityId(cityId))
  } catch (err) {
    logger.error(`[geo.getMunicipalities] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}
