const express = require('express')
const {
	getCouriers,
	getCourier,
	register,
	login,
	updateCourier,
	deleteCourier,
	updateName
} = require('../controllers/courierController')

const router = express.Router()
const reviewRouter = require('./reviews')
const productRouter = require('./products')

const { protect, authorize, authorizeCourier } = require('../middleware/authProtect')

router.use('/:id/reviews', protect, authorize('user'), reviewRouter)
router.use('/:courierId/products', productRouter)

router.route('/').get(getCouriers)

router
	.route('/:id')
	.get(getCourier)
	.put(protect, authorize('courier'), authorizeCourier('boss'), updateCourier)
	.put(protect, authorize('courier'), updateName)
	.delete(protect, authorize('courier'), deleteCourier)

router.route('/login').post(login)

router.route('/register').post(register)

module.exports = router
