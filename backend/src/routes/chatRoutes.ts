import express from 'express'
import routeNames from '../config/chatRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as chatController from '../controllers/chatController'

const routes = express.Router()

routes.route(routeNames.conversations).get(authJwt.verifyToken, chatController.listConversations)
routes.route(routeNames.conversations).post(authJwt.verifyToken, chatController.openConversation)
routes.route(routeNames.unreadCount).get(authJwt.verifyToken, chatController.unreadCount)
routes.route(routeNames.presence).post(authJwt.verifyToken, chatController.pingPresence)
routes.route(routeNames.agencies).get(authJwt.verifyToken, chatController.searchAgencies)
routes.route(routeNames.messages).get(authJwt.verifyToken, chatController.listMessages)
routes.route(routeNames.messages).post(authJwt.verifyToken, chatController.sendMessage)
routes.route(routeNames.read).post(authJwt.verifyToken, chatController.markRead)

export default routes
