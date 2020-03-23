const express = require('express')
const { createReviewForCourier, createReviewForSupervisor } = require('../controllers/reviewController')

const router = express.Router({ mergeParams: true })

const { protect, authorize } = require('../middleware/authProtect')

router
	.route('/')
	.post(protect, authorize('user'), createReviewForCourier)
	.post(protect, authorize('courier'), createReviewForSupervisor)

module.exports = router
