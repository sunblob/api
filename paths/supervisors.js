const express = require('express')
const {
	getSupervisors,
	getSupervisor,
	updateSupervisor,
	deleteSupervisor,
	authWithNumber,
	codeCheck,
	updateMe,
	getMe
} = require('../controllers/supevisorController')

const { createReviewForSupervisor } = require('../controllers/reviewController')
const { getMyProducts, getProducts } = require('../controllers/productController')

const router = express.Router()

const { protect, authorize, authorizeSupervisor } = require('../middleware/authProtect')

/*
	Роуты завязаные с отзывами по типу supervisors/id/reviews
*/
router.route('/:id/reviews').post(protect, authorize('user'), createReviewForSupervisor)

/*
	Роуты завязаные с товарами по типу supervisors/id(me)/products
*/
router.route('/me/products/').get(protect, authorize('supervisor'), getMyProducts)
router.route('/:id/products').get(protect, authorize('courier'), getProducts)

router.route('/').get(getSupervisors)

router.route('/me').get(protect, authorize('supervisor'), getMe).put(protect, authorize('supervisor'), updateMe)

router
	.route('/:id')
	.get(getSupervisor)
	.put(protect, authorize('supervisor'), updateSupervisor)
	.delete(protect, authorize('supervisor'), deleteSupervisor)

router.route('/auth').post(authWithNumber)

router.route('/codecheck').post(codeCheck)

module.exports = router
