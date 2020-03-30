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

	if (product.supervisor.toString() !== req.user.id) {
		return next(new ErrorResponse(`Босс с id ${req.user.id} не имеет прав на редактирование этого продукта`, 401))
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
	if (product.supervisor.toString() !== req.user.id) {
		return next(new ErrorResponse(`Босс с id ${req.user.id} не имеет прав на удаление этого продукта`, 401))
	}

	product = await Product.findByIdAndDelete(req.params.id)

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
    @desc       получение списка своих товаров
    @route      GET /api/supervisor/:supervisorId/products
    @access     public
*/
exports.getProducts = asyncHandler(async (req, res, next) => {
	console.log(req.params.id)
	const products = await Product.find().where({ supervisor: req.params.id })

	res.status(200).json(products)
})