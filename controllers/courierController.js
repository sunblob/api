const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const Courier = require('./../models/Courier')
const Code = require('./../models/Code')

const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator(512, TokenGenerator.BASE62)
const admin = require('firebase-admin')

/*
    @desc       получение списка активных/неактивных курьеров
    @route      GET /api/couriers
    @access     public
*/
exports.getCouriers = asyncHandler(async (req, res, next) => {
  let active = true
  if (req.query.active) {
    active = JSON.parse(req.query.active)
  }
  if (req.query.box) {
    const box = req.query.box.split(',')
    const lowerLeft = box.slice(0, 2)
    const upperRight = box.slice(2)

    const couriers = await Courier.find()
      .where({ role: 'courier', isActive: active })
      .where('coordinates')
      .within()
      .box(lowerLeft, upperRight)
      .populate('productList')

    res.status(200).json(couriers)
    return
  }

  const couriers = await Courier.find()
    .where({ role: 'courier', isActive: active })
    .where('coordinates')
    .ne(null)
    .populate('productList')

  res.status(200).json(couriers)
})

/*
    @desc       получение списка всех курьеров
    @route      GET /api/couriers/all
    @access     public
*/

exports.getAllCouriers = asyncHandler(async (req, res, next) => {
  if (req.query.box) {
    const box = req.query.box.split(',')
    const llng = parseFloat(box.slice(0, 1))
    const llat = parseFloat(box.slice(1, 2))
    const ulng = parseFloat(box.slice(2, 3))
    const ulat = parseFloat(box.slice(3, 4))

    const lowerLeft = [llng, llat]
    const upperRight = [ulng, ulat]

    // console.log('ll: ', lowerLeft, 'ur: ', upperRight)

    const a = 30
    const b = 30
    const clusters = await Courier.getBetterClusters(
      lowerLeft,
      upperRight,
      a,
      b
    )
    return res.status(200).json(clusters)
  }

  const couriers = await Courier.find()
    .where({ role: 'courier' })
    .populate('productList')

  res.status(200).json(couriers)
})

/*
    @desc       получение списка курьеров босса
    @route      GET /api/couriers/my
    @access     private
*/
exports.getMyCouriers = asyncHandler(async (req, res, next) => {
  const couriers = await Courier.find()
    .where({ role: 'courier', supervisor: req.user._id })
    .populate('productList')

  res.status(200).json(couriers)
})

/*
    @desc       получение курьера
    @route      GET /api/couriers/:id
    @access     public
*/
exports.getCourier = asyncHandler(async (req, res, next) => {
  const courier = await Courier.findById(req.params.id).populate('productList')

  if (!courier) {
    return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
  }

  res.status(200).json(courier)
})

/*
    @desc       получение инф. о себе
    @route      GET /api/couriers/me
    @access     private
*/
exports.getMe = asyncHandler(async (req, res, next) => {
  const id = req.user._id
  const user = await Courier.findById(id)
    .select('+token')
    .populate('productList')

  if (!user) {
    return next(new ErrorResponse(`Пользователя с id ${id} не существует`, 404))
  }

  res.status(200).json(user)
})

/*
    @desc       обновление своих полей
    @route      PUT /api/couriers/me
    @access     private
*/
exports.updateMe = asyncHandler(async (req, res, next) => {
  const id = req.user._id

  const { isActive, isAway, coordinates, hint } = req.body

  const user = await Courier.findByIdAndUpdate(
    id,
    {
      isActive,
      isAway,
      hint,
      coordinates
    },
    { new: true, runValidators: true }
  )

  res.status(200).json(user)
})

/*
    @desc       обновление полей курьера (для босса)
    @route      PUT /api/couriers/:id
    @access     private
*/
exports.updateCourier = asyncHandler(async (req, res, next) => {
  let courier = await Courier.findById(req.params.id)

  if (!courier) {
    return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
  }

  const { name } = req.body

  courier = await Courier.findByIdAndUpdate(
    req.params.id,
    { name },
    {
      new: true,
      runValidators: true
    }
  ).populate('productList')

  res.status(200).json(courier)
})

/*
    @desc       добавить куратора для курьера
    @route      GET /api/couriers/:phoneNumber/addsupervisor
    @access     private
*/
exports.addSupervisor = asyncHandler(async (req, res, next) => {
  let courier = await Courier.findOne({
    phoneNumber: req.params.phoneNumber,
    role: 'courier'
  })

  if (!courier || courier.supervisor !== null) {
    return next(
      new ErrorResponse(
        `Нет курьера с номером телефона ${req.body.phoneNumber} либо у него уже есть руководство`,
        404
      )
    )
  }

  courier = await Courier.findOneAndUpdate(
    { phoneNumber: req.params.phoneNumber, role: 'courier' },
    { supervisor: req.user },
    {
      new: true,
      runValidators: true
    }
  ).populate('productList')

  res.status(200).json(courier)
})

/*
    @desc       обновление полей курьера
    @route      GET /api/couriers/:id/removesupervisor
    @access     private
*/
exports.removeSupervisor = asyncHandler(async (req, res, next) => {
  let courier = await Courier.findById(req.params.courierId)

  if (!courier) {
    return next(
      new ErrorResponse(`??????? ? id ${req.params.courierId} ???`, 403)
    )
  }

  if (courier.supervisor.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse(`??? ?? ??? ??????`, 403))
  }

  courier = await Courier.findByIdAndUpdate(
    req.params.courierId,
    {
      supervisor: null,
      isActive: false,
      isCurrentlyNotHere: false,
      name: '',
      hint: '',
      coordinates: null,
      productList: []
    },
    {
      new: true,
      runValidators: true
    }
  )

  res.status(200).json(courier)
})

/*
    @desc       обновление полей курьера
    @route      GET /api/couriers/me/unsubscribe
    @access     private
*/
exports.removeSupervisorSelf = asyncHandler(async (req, res, next) => {
  let courier = await Courier.findById(req.user._id)

  if (!courier) {
    return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
  }

  courier = await Courier.findByIdAndUpdate(
    req.user._id,
    {
      isActive: false,
      isCurrentlyNotHere: false,
      coordinates: null,
      supervisor: null,
      productList: [],
      name: '',
      hint: ''
    },
    {
      new: true,
      runValidators: true
    }
  ).select('+token')

  res.status(200).json(courier)
})

/*
    @desc       Удаление курьера
    @route      DELETE /api/couriers/:id
    @access     public
*/
exports.deleteCourier = asyncHandler(async (req, res, next) => {
  let courier = await Courier.findById(req.params.id)

  if (!courier) {
    return next(new ErrorResponse(`Нет курьера с айди ${req.params.id}`, 404))
  }

  courier = await Courier.findByIdAndDelete(req.params.id)

  res.status(200).json(courier)
})

/*
    @desc       Номер телефона
    @route      POST /api/couriers/auth
    @access     public
*/
exports.authWithNumber = asyncHandler(async (req, res, next) => {
  const { fcmToken, phoneNumber } = req.body

  const generatedCode = (Math.floor(Math.random() * 10000) + 10000)
    .toString()
    .substring(1)

  let code = await Code.findOne({ phoneNumber })

  if (!code) {
    code = await Code.create({
      phoneNumber,
      fcmToken,
      code: generatedCode
    })
  } else {
    code = await Code.findOneAndUpdate(
      { phoneNumber },
      { code: generatedCode },
      { runValidators: true, new: true }
    )
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
    let courier = await Courier.findOne({
      phoneNumber: obj.phoneNumber,
      role: 'courier'
    })

    if (courier) {
      courier = await Courier.findOneAndUpdate(
        { phoneNumber: obj.phoneNumber, role: 'courier' },
        { token },
        { new: true, runValidators: true }
      ).populate('productList')

      await Code.findByIdAndUpdate(
        codeId,
        { resolved: true },
        { new: true, runValidators: true }
      )
    } else {
      courier = await Courier.create({
        token,
        phoneNumber: obj.phoneNumber
      })

      await Code.findByIdAndUpdate(
        codeId,
        { resolved: true },
        { new: true, runValidators: true }
      )
    }

    await Code.deleteMany({ resolved: true })

    res.status(200).json(courier)
  }
})
