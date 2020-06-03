const express = require('express')
const {
  getAllCouriers,
  getMyCouriers,
  getCouriers,
  getCourier,
  updateCourier,
  deleteCourier,
  updateSelf,
  authWithNumber,
  codeCheck,
  addSupervisor,
  removeSupervisor,
  removeSupervisorSelf,
  getMe,
  updateMe
} = require('../controllers/courierController')

const Courier = require('./../models/Courier')
const Client = require('../models/Client')
const Supervisor = require('../models/Supervisor')

const { createReviewForCourier } = require('../controllers/reviewController')

const router = express.Router()

const {
  protect,
  protectUser,
  authorize,
  authorizeCourier
} = require('../middleware/authProtect')

router
  .route('/me')
  .get(protectUser(Courier), authorize('courier'), getMe)
  .put(protectUser(Courier), authorize('courier'), updateMe)

router
  .route('/:id/reviews')
  .post(protectUser(Client), authorize('client'), createReviewForCourier)

router.route('/').get(getCouriers)

router.route('/all').get(getAllCouriers)

router
  .route('/my')
  .get(protectUser(Supervisor), authorize('supervisor'), getMyCouriers)

router
  .route('/:phoneNumber/addsupervisor')
  .get(protectUser(Supervisor), authorize('supervisor'), addSupervisor)

router
  .route('/:courierId/removesupervisor')
  .get(protectUser(Supervisor), authorize('supervisor'), removeSupervisor)

router
  .route('/me/unsubscribe')
  .get(
    protectUser(Courier),
    authorize('courier'),
    authorizeCourier(),
    removeSupervisorSelf
  )

router
  .route('/:id')
  .get(getCourier)
  .put(protectUser(Supervisor), authorize('supervisor'), updateCourier)
  .delete(protectUser(Courier), authorize('courier'), deleteCourier)

router.route('/auth').post(authWithNumber)

router.route('/codecheck').post(codeCheck)

module.exports = router
