const asyncHandler = require('./async')
const ErrorResponse = require('../utils/errorResponse.js')
// const User = require('../models/User')
const Client = require('../models/Client')
const Courier = require('../models/Courier')

// Защита роутов
exports.protect = asyncHandler(async (req, res, next) => {
	let token

	if (req.headers.authorization) {
		token = req.headers.authorization
	}

	//Если токен не существует
	if (!token || token === '') {
		return next(new ErrorResponse('нет доступа к данному роуту', 401))
	}

	// req.user = await User.findOne({token})

	if (!req.user) {
		return next(new ErrorResponse('Неверный токен, либо его не существует', 404))
	} else {
		next()
	}
})

exports.protectUser = (model) => asyncHandler(async (req, res, next) => {
	let token

	if (!model) {
		return next(new ErrorResponse('Ошибка сервера', 500))
	}

	if (req.headers.authorization) {
		token = req.headers.authorization
	}


	//Если токен не существует
	if (!token || token === '') {
		return next(new ErrorResponse('нет доступа к данному роуту', 401))
	}

	req.user = await model.findOne({ token })
	// console.log('User: ', req.user, 'model: ', model)

	if (!req.user) {
		return next(new ErrorResponse('Неверный токен, либо его не существует', 404))
	} else {
		next()
	}
})

// разрешить доступ тем кто подтвержден
exports.authorize = (...roles) => {
	return (req, res, next) => {
		// console.log("role: ", req.user.role, "bool: ", roles.includes(req.user.role), roles)
		if (!roles.includes(req.user.role)) {
			return next(
				new ErrorResponse(
					`У пользователя с ролью '${req.user.role}' нет прав на использование данного запроса`,
					403
				)
			)
		}
		next()
	}
}

exports.authorizeCourier = () => {
	return (req, res, next) => {
		const { supervisor } = req.user
		// console.log("super", supervisor)
		if (supervisor === null) {
			return next(new ErrorResponse(`У курьера нет прав на выполение действий без руководства`, 403))
		}
		next()
	}
}

exports.authorizeSupervisor = (...status) => {
	return (req, res, next) => {
		if (!status.includes(req.user.supervisorStatus)) {
			return next(
				new ErrorResponse(
					`У пользователя со статусом '${req.user
						.supervisorStatus}' нет прав на использование данного запроса`,
					403
				)
			)
		}
		next()
	}
}
