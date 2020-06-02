const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')

const CourierReview = require('../models/CourierReview')
const SupervisorReview = require('../models/SupervisorReview')
const Courier = require('./../models/Courier')
const Supervisor = require('./../models/Supervisor')

/*
    @desc       создание отзыва о курьере
    @route      POST /api/couriers/:id/review
    @access     public
*/
exports.createReviewForCourier = asyncHandler(async (req, res, next) => {
	const { rating } = req.body
	const user = req.user
	const courier = await Courier.findById(req.params.id)

	if (!courier || courier.role !== 'courier') {
		return next(new ErrorResponse('Этот пользователь не курьер', 403))
	}

	let review = await CourierReview.findOne({
		courier: req.params.id,
		user: user._id
	})

	if (!review) {
		review = await CourierReview.create({
			courier: courier._id,
			rating,
			user: user._id
		})
	} else {
		review.rating = rating
		await review.save()
	}

	res.status(200).json(review)
})

/*
    @desc       создание отзыва о боссе
    @route      POST /api/supervisors/:id/review/create
    @access     public
*/
exports.createReviewForSupervisor = asyncHandler(async (req, res, next) => {
	const { rating } = req.body
	const user = req.user
	const supervisor = await Supervisor.findById(req.params.id)

	if (!supervisor || supervisor.role !== 'supervisor') {
		return next(new ErrorResponse('Этот пользователь не куратор', 403))
	}

	let review = await SupervisorReview.findOne({ supervisor: req.params.id, user: user._id })

	if (!review) {
		review = await SupervisorReview.create({
			supervisor: supervisor._id,
			rating,
			user: user._id
		})
	} else {
		review.rating = rating
		await review.save()
	}

	res.status(200).json(review)
})
