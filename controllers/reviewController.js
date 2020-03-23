const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const Review = require('../models/Review')
const User = require('./../models/User')

/*
    @desc       создание отзыва о курьере
    @route      POST /api/couriers/:id/review
    @access     public
*/
exports.createReviewForCourier = asyncHandler(async (req, res, next) => {
	const { rating } = req.body
	const user = req.user._id
	const courier = await User.findById(req.params.id)

	if (!courier || courier.role != 'courier') {
		return next(new ErrorResponse('Этот пользователь не курьер', 400))
	}

	const { _id } = courier

	const review = await Review.create({
		courier: _id,
		rating,
		user
	})

	res.status(200).json(review)
})

/*
    @desc       создание отзыва о боссе
    @route      POST /api/supervisors/:id/review
    @access     public
*/
exports.createReviewForSupervisor = asyncHandler(async (req, res, next) => {
	const { rating } = req.body
	const user = req.user._id
	const supervisor = await User.findById(req.params.id)

	if (!supervisor || supervisor.role != 'boss') {
		return next(new ErrorResponse('Этот пользователь не босс', 400))
	}

	const { _id } = supervisor

	const review = await Review.create({
		supervisor: _id,
		rating,
		user
	})

	res.status(200).json(review)
})
