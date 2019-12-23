const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')
const Point = require('../models/Point')

/*
    @desc       получение всех точек
    @route      GET /api/points
    @access     public
*/
exports.getAllPoints = asyncHandler(async (req, res, next) => {
    const points = await Point.find()

    res.status(200).json({
        success: true,
        count: points.length,
        data: points
    })
})

/*
    @desc       получение одной точки
    @route      GET /api/points/:id
    @access     public
*/
exports.getPoint = asyncHandler(async (req, res, next) => {
    const point = await Point.findById(req.params.id)

    res.status(200).json({
        success: true,
        data: point
    })
})

/*
    @desc       получение всех точек текущего пользователя
    @route      GET /api/points
    @access     private
*/
exports.getPointsForUser = asyncHandler(async (req, res, next) => {
    const points = await Point.find({ user: req.user.id })

    res.status(200).json({
        success: true,
        count: points.length,
        data: points
    })
})

/*
    @desc       добавление точки
    @route      POST /api/points
    @access     private
*/
exports.createPoint = asyncHandler(async (req, res, next) => {
    // т.к. у точки должен быть пользователь мы достаем его id и помещаем в тело запроса
    req.body.user = req.user.id

    const point = await Point.create(req.body)

    res.status(201).json({
        success: true,
        data: point
    })
})

/*
    @desc       обновление точки
    @route      PUT /api/points/:id
    @access     private
*/
exports.updatePoint = asyncHandler(async (req, res, next) => {
    let point = await Point.findById(req.params.id)

    if (!point) {
        return next(new ErrorResponse(`нет точки с id ${req.params.id}`))
    }

    if (point.user.toString() !== req.user.id) {
        return next(
            new ErrorResponse(
                `пользователь с id ${req.user.id} не является владельцем точки`
            )
        )
    }

    point = await Point.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(201).json({
        success: true,
        data: point
    })
})

/*
    @desc       удаление точки
    @route      DELETE /api/points/:id
    @access     private
*/
exports.deletePoint = asyncHandler(async (req, res, next) => {
    let point = await Point.findById(req.params.id)

    if (!point) {
        return next(new ErrorResponse(`нет точки с id ${req.params.id}`))
    }

    if (point.user.toString() !== req.user.id) {
        return next(
            new ErrorResponse(
                `пользователь с id ${req.user.id} не является владельцем точки`
            )
        )
    }

    point = await Point.findByIdAndDelete(req.params.id)

    res.status(201).json({
        success: true,
        data: point
    })
})
