const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('./../models/User')
const Code = require('./../models/Code')

const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator(512, TokenGenerator.BASE62)
const admin = require('firebase-admin')

/*
    @desc       получение списка активных/неактивных курьеров
    @route      GET /api/couriers
    @access     public
*/
exports.getCouriers = asyncHandler(async (req, res, next) => {
	let active = true
	if (req.query.active) {
		active = JSON.parse(req.query.active)
	}
	if (req.query.box) {
		const box = req.query.box.split(',')
		const lowerLeft = box.slice(0, 2)
		const upperRight = box.slice(2)

		const couriers = await User.find()
			.where({ role: 'courier', isActive: active })
			.where('coordinates')
			.within()
			.box(lowerLeft, upperRight)
			.populate('productList')

		res.status(200).json(couriers)
		return
	}

	const couriers = await User.find().where({ role: 'courier', isActive: active }).populate('productList')

	res.status(200).json(couriers)
})

/*
    @desc       получение списка всех курьеров
    @route      GET /api/couriers/all
    @access     public
*/
exports.getAllCouriers = asyncHandler(async (req, res, next) => {
	if (req.query.box) {
		const box = req.query.box.split(',')
		const lowerLeft = box.slice(0, 2)
		const upperRight = box.slice(2)

		const couriers = await User.find()
			.where({ role: 'courier' })
			.where('coordinates')
			.within()
			.box(lowerLeft, upperRight)
			.populate('productList')

		// clustering
		// const k1 = (upperRight[0] - lowerLeft[0]) / 10
		// const k2 = (upperRight[1] - lowerLeft[1]) / 10

		// console.log('koeff: ', k1, k2)

		// const clusters = await User.getClusters(lowerLeft, upperRight, k1, k2)

		return res.status(200).json(couriers)
	}

	const couriers = await User.find().where({ role: 'courier' }).populate('productList')

	res.status(200).json(couriers)
})

/*
    @desc       получение списка курьеров босса
    @route      GET /api/couriers/my
    @access     private
*/
exports.getMyCouriers = asyncHandler(async (req, res, next) => {
	const couriers = await User.find().where({ role: 'courier', supervisor: req.user._id }).populate('productList')

	res.status(200).json(couriers)
})

/*
    @desc       получение курьера
    @route      GET /api/couriers/:id
    @access     public
*/
exports.getCourier = asyncHandler(async (req, res, next) => {
	const courier = await User.findById(req.params.id).populate('productList')

	if (!courier) {
		return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
	}

	res.status(200).json(courier)
})

/*
    @desc       обновление полей курьера
    @route      PUT /api/couriers/:id
    @access     private
*/
exports.updateCourier = asyncHandler(async (req, res, next) => {
	let courier = await User.findById(req.params.id)

	if (!courier) {
		return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
	}

	const { name } = req.body

	courier = await User.findByIdAndUpdate(
		req.params.id,
		{ name },
		{
			new: true,
			runValidators: true
		}
	).populate('productList')

	res.status(200).json(courier)
})

/*
    @desc       обновление полей курьера
    @route      PUT /api/couriers/:id/self
    @access     private
*/
exports.updateSelf = asyncHandler(async (req, res, next) => {
	let courier = await User.findById(req.params.id)

	console.log(req.body)
	const { isActive, isCurrentlyNotHere, coordinates, supervisor } = req.body

	if (!courier) {
		return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
	}

	if (req.params.id != req.user._id) {
		console.log('param: ', req.params.id, 'req.user: ', req.user._id)
		return next(new ErrorResponse('u cant change the info about other user', 403))
	}

	courier = await User.findByIdAndUpdate(
		req.params.id,
		{
			isActive,
			isCurrentlyNotHere,
			coordinates
		},
		{
			new: true,
			runValidators: true
		}
	).populate('productList')

	res.status(200).json(courier)
})

/*
    @desc       обновление полей курьера
    @route      POST /api/couriers/addsupervisor
    @access     private
*/
exports.addSupervisor = asyncHandler(async (req, res, next) => {
	let courier = await User.findOne({ phoneNumber: req.body.phoneNumber })

	if (!courier) {
		return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
	}

	if (courier.supervisor != null) {
		return next(new ErrorResponse(`? ??????? ${courier._id} ??? ???? ????????????`, 403))
	}

	courier = await User.findOneAndUpdate(
		{ phoneNumber: req.body.phoneNumber },
		{ supervisor: req.body.supervisor },
		{
			new: true,
			runValidators: true
		}
	).populate('productList')

	res.status(200).json(courier)
})

/*
    @desc       обновление полей курьера
    @route      POST /api/couriers/removesupervisor
    @access     private
*/
exports.removeSupervisor = asyncHandler(async (req, res, next) => {
	let courier = await User.findById(req.body.courierId)

	if (!courier) {
		return next(new ErrorResponse(`??????? ? id ${req.body.courierId} ???`, 403))
	}

	if (courier.supervisor.toString() != req.user._id.toString()) {
		return next(new ErrorResponse(`??? ?? ??? ??????`, 403))
	}

	courier = await User.findByIdAndUpdate(
		req.body.courierId,
		{
			supervisor: null,
			isActive: false,
			isCurrentlyNotHere: false,
			name: '',
			coordinates: null,
			productList: []
		},
		{
			new: true,
			runValidators: true
		}
	)

	res.status(200).json(courier)
})

/*
    @desc       обновление полей курьера
    @route      GET /api/couriers/:id/unsubscribe
    @access     private
*/
exports.removeSupervisorSelf = asyncHandler(async (req, res, next) => {
	let courier = await User.findById(req.params.id)

	if (!courier) {
		return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
	}

	if (req.params.id != req.user._id) {
		return next(new ErrorResponse('u cant change the info about other user', 403))
	}

	courier = await User.findByIdAndUpdate(
		req.params.id,
		{
			isActive: false,
			isCurrentlyNotHere: false,
			coordinates: null,
			supervisor: null,
			productList: [],
			name: ''
		},
		{
			new: true,
			runValidators: true
		}
	).populate('productList')

	res.status(200).json(courier)
})

/*
    @desc       Удаление курьера
    @route      DELETE /api/couriers/:id
    @access     public
*/
exports.deleteCourier = asyncHandler(async (req, res, next) => {
	let courier = await User.findById(req.params.id)

	if (!courier) {
		return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
	}

	courier = await User.findByIdAndDelete(req.params.id)

	res.status(200).json(courier)
})

/*
    @desc       Номер телефона
    @route      POST /api/couriers/auth
    @access     public
*/
exports.authWithNumber = asyncHandler(async (req, res, next) => {
	const { fcmToken, phoneNumber } = req.body

	const generatedCode = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1)

	let code = await Code.findOne({ phoneNumber })

	if (!code) {
		code = await Code.create({
			phoneNumber,
			fcmToken,
			code: generatedCode
		})
	} else {
		code = await Code.findOneAndUpdate({ phoneNumber }, { code: generatedCode }, { runValidators: true, new: true })
	}

	const message = {
		notification: {
			title: 'Your code',
			body: generatedCode
		},
		token: fcmToken
	}
	const result = await admin.messaging().send(message)
	console.log(result)
	res.status(200).json({ code: generatedCode, codeId: code._id })
})

exports.codeCheck = asyncHandler(async (req, res, next) => {
	const { code, codeId } = req.body

	let obj = await Code.findById(codeId)
	const token = tokgen.generate()

	if (!obj) {
		return next(new ErrorResponse('Что-то пошло не так', 400))
	}

	if (obj.code !== code) {
		return next(new ErrorResponse('Неправильный код', 400))
	} else {
		let courier = await User.findOne({ phoneNumber: obj.phoneNumber })

		if (courier) {
			courier = await User.findOneAndUpdate(
				{ phoneNumber: obj.phoneNumber },
				{ token },
				{ new: true, runValidators: true }
			).populate('productList')

			obj = await Code.findByIdAndUpdate(codeId, { resolved: true }, { new: true, runValidators: true })
		} else {
			courier = await User.create({
				token,
				name: '',
				phoneNumber: obj.phoneNumber,
				role: 'courier',
				isActive: false,
				isCurrentlyNotHere: false,
				supervisor: null,
				avgRating: null,
				productList: [],
				coordinates: null
			})
			obj = await Code.findById(codeId, { resolved: true }, { new: true, runValidators: true })
		}

		await Code.deleteMany({ resolved: true })

		res.status(200).json(courier)
		return
	}
})
