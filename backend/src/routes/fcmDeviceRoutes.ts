import express from 'express'
import routeNames from '../config/fcmDeviceRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as fcmDeviceController from '../controllers/fcmDeviceController'

const routes = express.Router()

routes.route(routeNames.fcmDevices)
  .get(authJwt.verifyToken, fcmDeviceController.listDevices)
  .post(authJwt.verifyToken, fcmDeviceController.registerDevice)
  .delete(authJwt.verifyToken, fcmDeviceController.unregisterDevice)

export default routes
