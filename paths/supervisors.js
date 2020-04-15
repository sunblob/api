const express = require('express')
const {
	getSupervisors,
	getSupervisor,
	updateSupervisor,
	deleteSupervisor,
	authWithNumber,
	codeCheck
} = require('../controllers/supevisorController')

const { createReviewForSupervisor } = require('../controllers/reviewController')

const router = express.Router()
const productRouter = require('./products')

const { protect, authorize, authorizeSupervisor } = require('../middleware/authProtect')

router.route('/:id/reviews').post(protect, authorize('user'), createReviewForSupervisor)

router.use('/:id/products', protect, authorize('courier', 'supervisor'), productRouter)

router.route('/').get(getSupervisors)

router
	.route('/:id')
	.get(getSupervisor)
	.put(protect, authorize('supervisor'), updateSupervisor)
	.delete(protect, authorize('supervisor'), deleteSupervisor)

router.route('/auth').post(authWithNumber)

router.route('/codecheck').post(codeCheck)

module.exports = router
