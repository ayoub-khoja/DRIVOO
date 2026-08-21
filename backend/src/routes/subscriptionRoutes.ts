import express from 'express'
import routeNames from '../config/subscriptionRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as subscriptionController from '../controllers/subscriptionController'

const routes = express.Router()

routes.route(routeNames.getPublicPlans).get(subscriptionController.getPublicPlans)

routes.route(routeNames.getPlans)
  .get(authJwt.verifyToken, authJwt.authAdmin, subscriptionController.getPlans)
  .post(authJwt.verifyToken, authJwt.authAdmin, subscriptionController.createPlan)

routes.route(routeNames.updatePlan)
  .put(authJwt.verifyToken, authJwt.authAdmin, subscriptionController.updatePlan)
  .delete(authJwt.verifyToken, authJwt.authAdmin, subscriptionController.deletePlan)

routes.route(routeNames.getDiscounts)
  .get(authJwt.verifyToken, authJwt.authAdmin, subscriptionController.getDiscounts)
  .post(authJwt.verifyToken, authJwt.authAdmin, subscriptionController.createDiscount)

routes.route(routeNames.updateDiscount)
  .put(authJwt.verifyToken, authJwt.authAdmin, subscriptionController.updateDiscount)
  .delete(authJwt.verifyToken, authJwt.authAdmin, subscriptionController.deleteDiscount)

export default routes
