const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('./../models/User')
const Code = require('./../models/Code')

const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator(512, TokenGenerator.BASE62)
const admin = require('firebase-admin')

/*
    @desc       регистрация курьера
    @route      POST /api/couriers/register
    @access     public
*/
exports.register = asyncHandler(async (req, res, next) => {
	const { deviceId, phoneNumber } = req.body
	const token = tokgen.generate()

	let user = await User.findOne({ deviceId })

	if (user) {
		user = await User.findOneAndUpdate(
			{ deviceId },
			{
				phoneNumber,
				isActive: false,
				isCurrentlyNotHere: false,
				role: 'courier'
			},
			{ new: true, runValidators: true }
		)
	} else {
		user = await User.create({
			token,
			phoneNumber,
			deviceId,
			isActive: false,
			isCurrentlyNotHere: false,
			role: 'courier'
		})
	}

	res.status(200).json(user)
})

/*
    @desc       вход курьера
    @route      POST /api/couriers/login
    @access     public
*/
exports.login = asyncHandler(async (req, res, next) => {
	// 	const { phoneNumber, password } = req.body
	// 	const token = tokgen.generate()

	// 	if (!phoneNumber || !password) {
	// 		return next(new ErrorResponse('Введите номер и пароль', 400))
	// 	}

	// 	let user = await User.findOne({ phoneNumber })

	// 	if (!user) {
	// 		return next(new ErrorResponse('Пользователя с таким номером телефона не существует', 400))
	// 	}

	// 	user = await User.findOneAndUpdate({ phoneNumber }, { token }, { new: true, runValidators: true })

	// res.status(200).json(user)

	const { token } = req.body

	const admin = require('firebase-admin')
	const message = {
		notification: {
			title: 'Ваш код',
			body: '1488'
		},
		token
	}
	const result = await admin.messaging().send(message)
	console.log(result)
})

/*
    @desc       получение списка курьеров
    @route      GET /api/couriers
    @access     public
*/
exports.getCouriers = asyncHandler(async (req, res, next) => {
	if (req.query.box) {
		const box = req.query.box.split(',')
		const lowerLeft = box.slice(0, 2)
		const upperRight = box.slice(2)

		// const couriers = await Courier.find().where('coordinates').within().box(lowerLeft, upperRight)
		const couriers = await User.find()
			.where({ role: 'courier' })
			.where('coordinates')
			.within()
			.box(lowerLeft, upperRight)
		res.status(200).json(couriers)
		return
	}

	const couriers = await User.find().where({ role: 'courier' })

	res.status(200).json(couriers)
})

/*
    @desc       получение курьера
    @route      GET /api/couriers/:id
    @access     public
*/
exports.getCourier = asyncHandler(async (req, res, next) => {
	const courier = await User.findById(req.params.id)

	if (!courier) {
		return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
	}

	res.status(200).json(courier)
})

/*
    @desc       обновление полей курьера
    @route      PUT /api/couriers/:id
    @access     public
*/
exports.updateCourier = asyncHandler(async (req, res, next) => {
	let courier = await User.findById(req.params.id)

	if (!courier) {
		return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
	}

	if (courier._id != req.user.id) {
		return next(new ErrorResponse('Вы не имеете прав на изменение информации о другом пользователе', 400))
	}

	courier = await User.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true
	})

	res.status(200).json(courier)
})

/*
    @desc       обновление полей курьера
    @route      PUT /api/couriers/:id
    @access     public
*/
exports.updateName = asyncHandler(async (req, res, next) => {
	let courier = await User.findById(req.params.id)
	const { name } = req.body

	if (!courier) {
		return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
	}

	courier = await User.findByIdAndUpdate(
		req.params.id,
		{ name },
		{
			new: true,
			runValidators: true
		}
	)

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

const codesArray = []

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
	res.status(200).json({ res: generatedCode })
})

exports.codeCheck = asyncHandler(async (req, res, next) => {
	const { code, fcmToken } = req.body

	let obj = await Code.findOne({ fcmToken })
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
			)
			obj = await Code.findOneAndUpdate({ fcmToken }, { resolved: true }, { new: true, runValidators: true })
		} else {
			courier = await User.create({
				token,
				phoneNumber: obj.phoneNumber,
				role: 'courier',
				isActive: false,
				isCurrentlyNotHere: false,
				supervisor: null,
				avgRating: null,
				coordinates: {
					lng: 37.61556,
					lat: 55.75222
				}
			})
			obj = await Code.findOneAndUpdate({ fcmToken }, { resolved: true }, { new: true, runValidators: true })
		}

		await Code.deleteMany({ resolved: true })

		res.status(200).json(courier)
		return
	}
})
