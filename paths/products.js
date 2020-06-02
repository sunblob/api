const express = require('express')
const {
	addProduct,
	getProduct,
	updateProduct,
	deleteProduct,
	toggleProductInList
} = require('../controllers/productController')

const Supervisor = require('../models/Supervisor')
const Courier = require('../models/Courier')

const router = express.Router()

const { protect, protectUser, authorize, authorizeCourier } = require('../middleware/authProtect')

router.route('/').post(protectUser(Supervisor), authorize('supervisor'), addProduct)

router
	.route('/:id')
	.get(getProduct)
	.put(protectUser(Supervisor), authorize('supervisor'), updateProduct)
	.delete(protectUser(Supervisor), authorize('supervisor'), deleteProduct)

router.route('/:id/togglelist').get(protectUser(Courier), authorize('courier'), authorizeCourier(), toggleProductInList)

module.exports = router
