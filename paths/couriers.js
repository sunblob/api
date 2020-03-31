const express = require('express')
const {
	getAllCouriers,
	getCouriers,
	getCourier,
	register,
	login,
	updateCourier,
	deleteCourier,
	updateSelf,
	authWithNumber,
	codeCheck
} = require('../controllers/courierController')

const router = express.Router()
const reviewRouter = require('./reviews')

const { protect, authorize, authorizeCourier } = require('../middleware/authProtect')

router.use('/:id/reviews', protect, authorize('user'), reviewRouter)

router.route('/').get(getCouriers)
router.route('/couriers/all').get(getAllCouriers)

router
	.route('/:id')
	.get(getCourier)
	.put(protect, authorize('supervisor'), updateCourier)
	.delete(protect, authorize('courier'), deleteCourier)
 
router.route('/:id/self').put(protect, authorize('courier'), authorizeCourier('supervisor'), updateSelf)

router.route('/login').post(login)

router.route('/register').post(register)

router.route('/auth').post(authWithNumber)

router.route('/codecheck').post(codeCheck)

module.exports = router
