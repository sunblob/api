const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')
const Code = require('./../models/Code')

const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator(512, TokenGenerator.BASE62)
const admin = require('firebase-admin')

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

	const { name } = req.body

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

/*
    @desc       Номер телефона
    @route      POST /api/supervisors/auth
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
/*
    @desc       проверка кода
    @route      POST /api/supervisors/codecheck
    @access     public
*/
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
		let supervisor = await User.findOne({ phoneNumber: obj.phoneNumber })

		if (supervisor) {
			supervisor = await User.findOneAndUpdate(
				{ phoneNumber: obj.phoneNumber },
				{ token },
				{ new: true, runValidators: true }
			)
			obj = await Code.findByIdAndUpdate(codeId, { resolved: true }, { new: true, runValidators: true })
		} else {
			supervisor = await User.create({
				token,
				name: '',
				phoneNumber: obj.phoneNumber,
				role: 'supervisor',
				supervisorStatus: 'disabled',
				avgRating: null
			})
			obj = await Code.findById(codeId, { resolved: true }, { new: true, runValidators: true })
		}

		await Code.deleteMany({ resolved: true })

		res.status(200).json(supervisor)
		return
	}
})
