const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')
const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator(512, TokenGenerator.BASE62)

/*
    @desc       регистрация босса
    @route      POST /api/supervisors/register
    @access     public
*/
exports.register = asyncHandler(async (req, res, next) => {
	const { deviceId, phoneNumber, password } = req.body
	const token = tokgen.generate()

	let user = await User.findOne({ deviceId })

	if (user) {
		user = await User.findOneAndUpdate(
			{ deviceId },
			{
				phoneNumber,
				password,
				role: 'supervisor',
				supervisorStatus: 'disabled'
			},
			{ new: true, runValidators: true }
		)
	} else {
		user = await User.create({
			token,
			phoneNumber,
			password,
			deviceId,
			role: 'supervisor',
			supervisorStatus: 'disabled'
		})
	}

	res.status(200).json(user)
})

/*
    @desc       вход босса
    @route      POST /api/supervisors/login
    @access     public
*/
exports.login = asyncHandler(async (req, res, next) => {
	const { phoneNumber, password } = req.body
	const token = tokgen.generate()

	if (!phoneNumber || !password) {
		return next(new ErrorResponse('Введите номер и пароль', 400))
	}

	let user = await User.findOne({ phoneNumber })

	if (!user) {
		return next(new ErrorResponse('Пользователя с таким номером телефона не существует', 400))
	}

	user = await User.findOneAndUpdate({ phoneNumber }, { token }, { new: true, runValidators: true })

	res.status(200).json(user)
})

/*
    @desc       получение списка боссов
    @route      GET /api/supervisors
    @access     public
*/
exports.getSupervisors = asyncHandler(async (req, res, next) => {
	const supervisors = await User.find().where({ role: 'supervisor' })

	res.status(200).json(supervisors)
})

/*
    @desc       получение босса
    @route      GET /api/supervisors/:id
    @access     public
*/
exports.getSupervisor = asyncHandler(async (req, res, next) => {
	const supervisor = await User.findById(req.params.id)

	if (!supervisor) {
		return next(new ErrorResponse(`Нет босса с айди ${req.params.id}`, 404))
	}

	res.status(200).json(supervisor)
})

/*
    @desc       обновление полей босса
    @route      PUT /api/supervisors/:id
    @access     public
*/
exports.updateSupervisor = asyncHandler(async (req, res, next) => {
	let supervisor = await User.findById(req.params.id)

	if (!supervisor) {
		return next(new ErrorResponse(`Нет босса с айди ${req.params.id}`, 404))
	}

	if (supervisor._id != req.user.id) {
		return next(new ErrorResponse('Вы не имеете прав на изменение информации о другом пользователе', 400))
	}

	const { name, password } = req.body

	supervisor = await User.findByIdAndUpdate(
		req.params.id,
		{ name, password },
		{
			new: true,
			runValidators: true
		}
	)

	res.status(200).json(supervisor)
})

/*
    @desc       обновление имени босса
    @route      PUT /api/supervisors/:id
    @access     public
*/
exports.updateName = asyncHandler(async (req, res, next) => {
	let supervisor = await User.findById(req.params.id)
	const { name } = req.body

	if (!supervisor) {
		return next(new ErrorResponse(`Нет босса с айди ${req.params.id}`, 404))
	}

	supervisor = await User.findByIdAndUpdate(
		req.params.id,
		{ name },
		{
			new: true,
			runValidators: true
		}
	)

	res.status(200).json(supervisor)
})

/*
    @desc       Удаление босса
    @route      DELETE /api/supervisors/:id
    @access     public
*/
exports.deleteSupervisor = asyncHandler(async (req, res, next) => {
	let supervisor = await User.findById(req.params.id)

	if (!supervisor) {
		return next(new ErrorResponse(`Нет босса с айди ${req.params.id}`, 404))
	}

	supervisor = await User.findByIdAndDelete(req.params.id)

	res.status(200).json(supervisor)
})

const codesArray = []

/*
    @desc       Номер телефона
    @route      POST /api/supervisors/auth
    @access     public
*/
exports.authWithNumber = asyncHandler(async (req, res, next) => {
	const { token, phoneNumber } = req.body

	const code = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1)
	console.log(code)

	const obj = {
		token,
		phoneNumber,
		code
	}

	codesArray.push(obj)
	console.log(codesArray)

	// const firebase = require('./../config/firebase')
	// const message = {
	// 	notification: {
	// 		title: 'Ваш код',
	// 		body: code
	// 	},
	// 	token
	// }
	// const result = await firebase().messaging().send(message)
	// console.log(result)
	res.status(200).json(code)
})
/*
    @desc       проверка кода
    @route      POST /api/supervisors/codecheck
    @access     public
*/
exports.codeCheck = asyncHandler(async (req, res, next) => {
	const { code, fcmToken } = req.body

	console.log(codesArray)
	const obj = codesArray.find((item) => item.token == fcmToken)
	console.log(obj)
	const token = tokgen.generate()

	if (!obj) {
		return next(new ErrorResponse('Что-то пошло не так', 400))
	}

	if (obj.code !== code) {
		return next(new ErrorResponse('Неправильный код', 400))
	} else {
		let supervisor = await User.findOne({ phoneNumber: obj.phoneNumber })

		if (supervisor) {
			supervisor = await User.findOneAndUpdate({ phoneNumber }, { token }, { new: true, runValidators: true })
		} else {
			supervisor = await User.create({
				token,
				phoneNumber: obj.phoneNumber,
				role: 'supervisor',
				supervisorStatus: 'disabled'
			})
		}

		console.log(codesArray)

		res.status(200).json(supervisor)
		return
	}
})
