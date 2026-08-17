import express from 'express'
import routeNames from '../config/geoRoutes.config'
import * as geoController from '../controllers/geoController'

const routes = express.Router()

routes.route(routeNames.getCatalog).get(geoController.getCatalog)
routes.route(routeNames.getCities).get(geoController.getCities)
routes.route(routeNames.getMunicipalities).get(geoController.getMunicipalities)

export default routes
