const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')

/*
    @desc       получение всех пользователей
    @route      GET /api/users
    @access     private
*/
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find()

  // res.status(200).json({
  //     status: true,
  //     count: users.length,
  //     data: users
  // })
  res.status(200).json(users)
})

/*
    @desc       получение одного пользователя
    @route      GET /api/users/:id
    @access     private
*/
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(
      new ErrorResponse(`Пользователь с id ${req.params.id} не найден`)
    )
  }

  // res.status(200).json({
  //     status: true,
  //     data: user
  // })

  res.status(200).json(user)
})

/*
    @desc       обновление пользователя
    @route      PUT /api/points/:id
    @access     public
*/
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`нет точки с id ${req.params.id}`, 404))
  }

  if (user._id != req.user.id) {
    return next(
      new ErrorResponse(
        'Вы не имеете прав на изменение информации о другом пользователе',
        400
      )
    )
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('+password')

  // res.status(201).json({
  //     status: true,
  //     data: user
  // })

  res.status(200).json(user)
})

/*
    @desc       удаление пользователя
    @route      PUT /api/points/:id
    @access     public
*/
exports.deleteUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`нет точки с id ${req.params.id}`))
  }

  user = await User.findByIdAndDelete(req.params.id)

  // res.status(201).json({
  //     status: true,
  //     data: user
  // })

  res.status(200).json(user)
})
