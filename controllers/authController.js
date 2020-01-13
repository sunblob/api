const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')
const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator(512, TokenGenerator.BASE62)

/*
    @desc       регистарция пользователя
    @route      POST /api/auth/signup
    @access     public
*/
exports.signUp = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body
    const token = tokgen.generate()

    const user = await User.create({
        token,
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
    const token = tokgen.generate()

    // проверка почты и пароля
    if (!email || !password) {
        return next(new ErrorResponse('Введите почту и пароль', 400))
    }

    // проверка на пользователя
    let user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorResponse('Неправильно введенные данные', 401))
    }

    // const filter = { email }
    // const update = { token }
    user = await User.findOneAndUpdate(
        { email },
        { token },
        {
            new: true,
            runValidators: true
        }
    ).select('+password')

    // проверка если пароли совпадают
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
        return next(new ErrorResponse('Неправильно введенные данные', 401))
    }

    res.status(200).json({
        status: true,
        token
    })
    // sendTokenResponse(user, 200, res)
})

/*
    @desc       выход
    @route      GET /api/v1/auth/logout
    @access     private
*/
exports.logOut = asyncHandler(async (req, res, next) => {
    const token = ''
    const user = await User.findByIdAndUpdate(
        req.user.id,
        { token },
        {
            new: true,
            runValidators: true
        }
    )

    res.status(200).json({
        succss: true,
        data: `loggedOut with id ${user.id}`
    })
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

//отправка ответа
const sendTokenResponse = (user, statusCode, res) => {
    // создание токена
    const token = user.getToken()
    console.log('token: ', token)

    res.status(statusCode).json({
        success: true,
        token
    })
}
