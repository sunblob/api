const express = require('express')
const {
	addProduct,
	getProduct,
	getProducts,
	updateProduct,
	deleteProduct
} = require('../controllers/productController')

const router = express.Router({ mergeParams: true })

const { protect, authorize } = require('../middleware/authProtect')

router.route('/').get(getProducts).post(protect, authorize('courier'), addProduct)

router
	.route('/:id')
	.get(getProduct)
	.put(protect, authorize('courier'), updateProduct)
	.delete(protect, authorize('courier'), deleteProduct)

module.exports = router
