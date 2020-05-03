const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const Product = require('../models/Product')
const User = require('./../models/User')

/*
    @desc       создание товара для продажи
    @route      POST /api/products
    @access     private
*/
exports.addProduct = asyncHandler(async (req, res, next) => {
	const { type, name } = req.body
	const supervisor = req.user._id

	const product = await Product.create({
		type,
		name,
		supervisor
	})

	res.status(201).json(product)
})

/*
    @desc       редактирование товара
    @route      PUT /api/products/:id
    @access     private
*/
exports.updateProduct = asyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.id)

	if (!product) {
		return next(new ErrorResponse(`Товара с id ${req.params.id} не сущетвует`, 404))
	}

	if (product.supervisor.toString() !== req.user._id) {
		return next(new ErrorResponse(`Босс с id ${req.user._id} не имеет прав на редактирование этого продукта`, 401))
	}

	product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

	res.status(200).json(product)
})

/*
    @desc       удаление товара
    @route      DELETE /api/products/:id
    @access     private
*/
exports.deleteProduct = asyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.id)

	if (!product) {
		return next(new ErrorResponse(`Товара с id ${req.params.id} не сущетвует`, 404))
	}

	//удалять товар может только его создатель
	if (product.supervisor.toString() !== req.user._id.toString()) {
		return next(new ErrorResponse(`Босс с id ${req.user.id} не имеет прав на удаление этого продукта`, 401))
	}

	await product.remove()

	res.status(200).json(product)
})

/*
    @desc       получение товара
    @route      GET /api/products/:id
    @access     public
*/
exports.getProduct = asyncHandler(async (req, res, next) => {
	const product = await Product.findById(req.params.id)

	if (!product) {
		return next(new ErrorResponse(`Товара с id ${req.params.id} не сущетвует`, 404))
	}

	res.status(200).json(product)
})

/*
    @desc       получение списка товаров босса
    @route      GET /api/supervisor/:supervisorId/products
    @access     private
*/
exports.getProducts = asyncHandler(async (req, res, next) => {

	if (!req.user.supervisor || req.user.supervisor.toString() !== req.params.id) {
		return next(new ErrorResponse(`Ваш босс не ${req.params.id}`, 403))
	}

	const products = await Product.find().where({ supervisor: req.params.id })

	res.status(200).json(products)
})


/*
    @desc       получение списка товаров босса
    @route      GET /api/supervisor/me/products
    @access     private
*/
exports.getMyProducts = asyncHandler(async (req, res, next) => {
	const products = await Product.find().where({ supervisor: req.user._id })

	res.status(200).json(products)
})

/*
    @desc       добавление товара курьером к себе в список
    @route      POST /api/products/:id/togglelist
    @access     private
*/
exports.toggleProductInList = asyncHandler(async (req, res, next) => {
	const product = await Product.findById(req.params.id)
	let courier = await User.findById(req.user._id)

	if (!product) {
		return next(new ErrorResponse(`Продукта ${req.params.id} не существует`))
	}

	if (product.supervisor.toString() !== courier.supervisor.toString()) {
		return next(new ErrorResponse('Этот продукт не принадлежит вашему боссу', 401))
	}

	if (courier.productList.includes(req.params.id)) {
		courier.productList.pull(req.params.id)
	} else {
		courier.productList.addToSet(product._id)
	}

	await courier.save()

	courier = await User.findById(req.user._id).populate('productList')

	res.status(200).json(courier)
})


