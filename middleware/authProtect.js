const jwt = require('jsonwebtoken')
const asyncHandler = require('./async')
const ErrorResponse = require('../utils/errorResponse.js')
const User = require('../models/User')

// Защита роутов
exports.protect = asyncHandler(async (req, res, next) => {
    let token

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1]
        console.log('token', token)
    }

    //Если токен не существует
    if (!token) {
        return next(new ErrorResponse('нет доступа к данному роуту', 401))
    }

    try {
        // проверка токена
        req.user = await User.findOne({ token })
        console.log(req.user)

        next()
    } catch (error) {
        return next(
            new ErrorResponse('возможно токена больше не существует', 404)
        )
    }
})

// разрешить доступ тем кто подтвержден
exports.authorize = isConfirmed => {
    return (req, res, next) => {
        if (isConfirmed != req.user.isConfirmed) {
            return next(
                new ErrorResponse('вы должны быть подтверждены для доступа')
            )
        }
        next()
    }
}
