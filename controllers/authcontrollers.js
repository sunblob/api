const crypto = require('crypto')
const asyncHandler = require('./../middleware/async')
const ErrorResponse = require('./../utils/errorResponse')
const User = require('./../models/User')

/*
    @desc       регистарция пользователя
    @route      POST /api/auth/signup
    @access     public
*/
exports.signUp = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body

    const user = await User.create({
        name,
        email,
        password
    })

    sendTokenResponse(user, 200, res)
})

/*
    @desc       вход пользователя
    @route      POST /api/auth/signin
    @access     public
*/
exports.signIn = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body

    // проверка почты и пароля
    if (!email || !password) {
        return next(new ErrorResponse('Введите почту и пароль', 400))
    }

    // проверка на пользователя
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorResponse('Неправильно введенные данные', 401))
    }

    // проверка если пароли совпадают
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
        return next(new ErrorResponse('Неправильно введенные данные', 401))
    }

    sendTokenResponse(user, 200, res)
})

/*
    @desc       выход
    @route      GET /api/v1/auth/logout
    @access     private
*/
exports.logOut = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id)

    logOutAndDeleteToken(user, 200, res)
})

/*
    @desc       получение текущего пользователя
    @route      GET /api/v1/auth/me
    @access     private
*/
exports.currentUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id)

    res.status(200).json({
        success: true,
        data: user
    })
})

//Удаление токена и отправка ответа
const logOutAndDeleteToken = (user, statusCode, res) => {
    const token = user.deleteJwtToken()

    res.status(statusCode).json({
        success: true,
        data: `удален токен ${token}`
    })
}

// Создание токена и отправка ответа
const sendTokenResponse = (user, statusCode, res) => {
    // создание токена
    const token = user.getSignedJwtToken()

    // const options = {
    //     expires: new Date(
    //         Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 3600 * 1000
    //     ), // токен валиден 30 дней
    //     httpOnly: true
    // }

    // if (process.env.NODE_ENV === 'production') {
    //     options.secure = true
    // }

    res.status(statusCode).json({
        success: true,
        token
    })
}
