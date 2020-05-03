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

const { createReviewForCourier } = require('../controllers/reviewController')

const router = express.Router()

const {
  protect,
  authorize,
  authorizeCourier
} = require('../middleware/authProtect')

router
  .route('/me')
  .get(protect, authorize('courier'), getMe)
  .put(protect, authorize('courier'), updateMe)

router
  .route('/:id/reviews')
  .post(protect, authorize('user'), createReviewForCourier)

router.route('/').get(getCouriers)

router.route('/all').get(getAllCouriers)

router.route('/my').get(protect, authorize('supervisor'), getMyCouriers)

router
  .route('/addsupervisor')
  .post(protect, authorize('supervisor'), addSupervisor)

router
  .route('/removesupervisor')
  .post(protect, authorize('supervisor'), removeSupervisor)

router
  .route('/:id/unsubscribe')
  .get(protect, authorize('courier'), authorizeCourier(), removeSupervisorSelf)

router
  .route('/:id')
  .get(getCourier)
  .put(protect, authorize('supervisor'), updateCourier)
  .delete(protect, authorize('courier'), deleteCourier)

router.route('/auth').post(authWithNumber)

router.route('/codecheck').post(codeCheck)

module.exports = router
