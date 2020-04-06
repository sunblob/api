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
  removeSupervisorSelf
} = require('../controllers/courierController')

const router = express.Router()
const reviewRouter = require('./reviews')

const { protect, authorize, authorizeCourier } = require('../middleware/authProtect')

router.use('/:id/reviews', protect, authorize('user'), reviewRouter)

router.route('/').get(getCouriers)

router.route('/all').get(getAllCouriers)

router.route('/my').get(protect, authorize('supervisor'), getMyCouriers)

router.route('/addsupervisor').post(protect, authorize('supervisor'), addSupervisor)

router.route('/removesupervisor').post(protect, authorize('supervisor'), removeSupervisor)

router.route('/:id/unsubscribe').get(protect, authorize('courier'), authorizeCourier(), removeSupervisorSelf)

router
	.route('/:id')
	.get(getCourier)
	.put(protect, authorize('supervisor'), updateCourier)
	.delete(protect, authorize('courier'), deleteCourier)

router.route('/:id/self').put(protect, authorize('courier'), authorizeCourier(), updateSelf)

router.route('/auth').post(authWithNumber)

router.route('/codecheck').post(codeCheck)

module.exports = router
