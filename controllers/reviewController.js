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
	const user = req.user
	const courier = await User.findById(req.params.id)

	let review = await Review.findOne({
		courier: req.params.id,
		user: user._id
	})

	if (!courier || courier.role != 'courier') {
		return next(new ErrorResponse('Этот пользователь не курьер', 400))
	}

	if (!review) {
		review = await Review.create({
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
	const supervisor = await User.findById(req.params.id)
	// console.log('review super ', supervisor)
	let review = await Review.findOne({ supervisor: req.params.id, user: user._id })

	if (!supervisor || supervisor.role != 'supervisor') {
		return next(new ErrorResponse('Этот пользователь не босс', 400))
	}

	if (!review) {
		review = await Review.create({
			supervisor: supervisor._id,
			rating,
			user: user._id
		})
	} else {
		review.rating = rating
		await review.save()
	}

	console.log('rev super ', review)

	res.status(200).json(review)
})
