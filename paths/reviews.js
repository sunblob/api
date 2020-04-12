const express = require('express')
const { createReviewForCourier, createReviewForSupervisor } = require('../controllers/reviewController')

const router = express.Router({ mergeParams: true })

const { protect, authorize } = require('../middleware/authProtect')

router.route('/').post(protect, authorize('user'), createReviewForCourier)

router.route('/create').post(protect, authorize('user'), createReviewForSupervisor)

module.exports = router
