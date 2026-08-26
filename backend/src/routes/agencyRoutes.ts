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
routes.route(routeNames.getInvoicePdf).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getInvoicePdf)
routes.route(routeNames.getContracts).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getContracts)
routes.route(routeNames.createContract).post(authJwt.verifyToken, authJwt.authSupplier, agencyController.createContract)
routes.route(routeNames.getContract).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getContract)
routes.route(routeNames.deleteContract).delete(authJwt.verifyToken, authJwt.authSupplier, agencyController.deleteContract)
routes.route(routeNames.getContractPdf).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getContractPdf)
routes.route(routeNames.getReceipts).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getReceipts)
routes.route(routeNames.createReceipt).post(authJwt.verifyToken, authJwt.authSupplier, agencyController.createReceipt)
routes.route(routeNames.getReceipt).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getReceipt)
routes.route(routeNames.deleteReceipt).delete(authJwt.verifyToken, authJwt.authSupplier, agencyController.deleteReceipt)
routes.route(routeNames.getAgenda).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getAgenda)
routes.route(routeNames.getReminders).get(authJwt.verifyToken, authJwt.authSupplier, agencyController.getReminders)
routes.route(routeNames.createReminder).post(authJwt.verifyToken, authJwt.authSupplier, agencyController.createReminder)
routes.route(routeNames.dismissReminder).delete(authJwt.verifyToken, authJwt.authSupplier, agencyController.dismissReminder)
routes.route(routeNames.updateCarOdometer).put(authJwt.verifyToken, authJwt.authSupplier, agencyController.updateCarOdometer)
routes.route(routeNames.updateCarAvailability).put(authJwt.verifyToken, authJwt.authSupplier, agencyController.updateCarAvailability)
routes.route(routeNames.getPublicCars).get(agencyController.getPublicCars)
routes.route(routeNames.getPublicReviews).get(agencyController.getPublicReviews)
routes.route(routeNames.createPublicReview).post(agencyController.createPublicReview)
routes.route(routeNames.getPublicProfile).get(agencyController.getPublicProfile)

export default routes
