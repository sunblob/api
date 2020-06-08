const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const Supervisor = require('../models/Supervisor')
const Code = require('./../models/Code')

const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator(512, TokenGenerator.BASE62)
const admin = require('firebase-admin')

/*
    @desc       получение списка боссов
    @route      GET /api/supervisors
    @access     public
*/
exports.getSupervisors = asyncHandler(async (req, res, next) => {
	const supervisors = await Supervisor.find().where({ role: 'supervisor' })

	res.status(200).json(supervisors)
})

/*
    @desc       получение босса
    @route      GET /api/supervisors/:id
    @access     public
*/
exports.getSupervisor = asyncHandler(async (req, res, next) => {
	const supervisor = await Supervisor.findById(req.params.id)

	if (!supervisor) {
		return next(new ErrorResponse(`Нет босса с айди ${req.params.id}`, 404))
	}

	res.status(200).json(supervisor)
})

/*
    @desc       получение информации о себе
    @route      GET /api/supervisors/me
    @access     private
*/
exports.getMe = asyncHandler(async (req, res, next) => {
	const id = req.user._id
	const supervisor = await Supervisor.findById(id).select('+token')

	if (!supervisor) {
		return next(new ErrorResponse(`Нет босса с айди ${id}`, 404))
	}

	res.status(200).json(supervisor)
})

/*
    @desc       обновление полей босса
    @route      PUT /api/supervisors/:id
    @access     public
*/
exports.updateSupervisor = asyncHandler(async (req, res, next) => {
	let supervisor = await Supervisor.findById(req.params.id)

	if (!supervisor) {
		return next(new ErrorResponse(`Нет босса с айди ${req.params.id}`, 404))
	}

	if (supervisor._id != req.user.id) {
		return next(new ErrorResponse('Вы не имеете прав на изменение информации о другом пользователе', 400))
	}

	const { name } = req.body

	supervisor = await Supervisor.findByIdAndUpdate(
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
    @desc       обновление полей босса
    @route      PUT /api/supervisors/me
    @access     private
*/
exports.updateMe = asyncHandler(async (req, res, next) => {
	const id = req.user._id

	let supervisor = await Supervisor.findById(id)

	if (!supervisor) {
		return next(new ErrorResponse(`Нет босса с айди ${id}`, 404))
	}

	const { name } = req.body

	supervisor = await Supervisor.findByIdAndUpdate(
		id,
		{ name },
		{
			new: true,
			runValidators: true
		}
	).select('+token')

	res.status(200).json(supervisor)
})


/*
    @desc       Удаление босса
    @route      DELETE /api/supervisors/:id
    @access     public
*/
exports.deleteSupervisor = asyncHandler(async (req, res, next) => {
	let supervisor = await Supervisor.findById(req.params.id)

	if (!supervisor) {
		return next(new ErrorResponse(`Нет босса с айди ${req.params.id}`, 404))
	}

	supervisor = await Supervisor.findByIdAndDelete(req.params.id)

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
	await admin.messaging().send(message)
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
		let supervisor = await Supervisor.findOne({ phoneNumber: obj.phoneNumber, role: 'supervisor' })

		if (supervisor) {
			supervisor = await Supervisor.findOneAndUpdate(
				{ phoneNumber: obj.phoneNumber, role: 'supervisor' },
				{ token },
				{ new: true, runValidators: true }
			).select('+token')
			await Code.findByIdAndUpdate(codeId, { resolved: true }, { new: true, runValidators: true })
		} else {
			supervisor = await Supervisor.create({
				token,
				phoneNumber: obj.phoneNumber,
			}).select('+token')

			await Code.findByIdAndUpdate(codeId, { resolved: true }, { new: true, runValidators: true })
		}

		await Code.deleteMany({ resolved: true })

		res.status(200).json(supervisor)
	}
})
