const express = require('express')
const {
	addProduct,
	getProduct,
	updateProduct,
	deleteProduct,
	toggleProductInList
} = require('../controllers/productController')

const router = express.Router()

const { protect, authorize, authorizeCourier } = require('../middleware/authProtect')

router.route('/').post(protect, authorize('supervisor'), addProduct)

router
	.route('/:id')
	.get(getProduct)
	.put(protect, authorize('supervisor'), updateProduct)
	.delete(protect, authorize('supervisor'), deleteProduct)

router.route('/:id/togglelist').get(protect, authorize('courier'), authorizeCourier(), toggleProductInList)

module.exports = router
