import express from 'express'
import multer from 'multer'
import routeNames from '../config/agencyRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as agencyController from '../controllers/agencyController'

const routes = express.Router()
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image')

routes.route(routeNames.getSubAgencies).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getSubAgencies)
routes.route(routeNames.createSubAgency).post(authJwt.verifyToken, authJwt.authSupplier, agencyController.createSubAgency)
routes.route(routeNames.updateProfile).put(authJwt.verifyToken, authJwt.authSupplier, agencyController.updateProfile)
routes.route(routeNames.updateLogo).post(authJwt.verifyToken, authJwt.authSupplier, (req, res, next) => {
  logoUpload(req, res, (err) => {
    if (err) {
      res.status(400).send('Invalid image')
      return
    }
    next()
  })
}, agencyController.updateLogo)
routes.route(routeNames.deleteLogo).delete(authJwt.verifyToken, authJwt.authSupplier, agencyController.deleteLogo)
routes.route(routeNames.getShareLink).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getShareLink)
routes.route(routeNames.getReviews).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getReviews)
routes.route(routeNames.moderateReview).put(authJwt.verifyToken, authJwt.authSupplier, agencyController.moderateReview)
routes.route(routeNames.selectSubscriptionPlan).put(authJwt.verifyToken, authJwt.authSupplier, agencyController.selectSubscriptionPlan)
routes.route(routeNames.getInvoices).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getInvoices)
routes.route(routeNames.createInvoice).post(authJwt.verifyToken, authJwt.authSupplier, agencyController.createInvoice)
routes.route(routeNames.getInvoice).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getInvoice)
routes.route(routeNames.deleteInvoice).delete(authJwt.verifyToken, authJwt.authSupplier, agencyController.deleteInvoice)
routes.route(routeNames.getPublicCars).get(agencyController.getPublicCars)
routes.route(routeNames.getPublicReviews).get(agencyController.getPublicReviews)
routes.route(routeNames.createPublicReview).post(agencyController.createPublicReview)
routes.route(routeNames.getPublicProfile).get(agencyController.getPublicProfile)

export default routes
