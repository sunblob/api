const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')
const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator(512, TokenGenerator.BASE62)

/*
    @desc       вход курьера
    @route      POST /api/users/handshake
    @access     public
*/
exports.handshake = asyncHandler(async (req, res, next) => {
	const { deviceId } = req.body
	const token = tokgen.generate()

	let user = await User.findOne({ deviceId })

	if (!user) {
		user = await User.create({ deviceId, token })
	}

	user = await User.findOneAndUpdate({ deviceId }, { token }, { new: true, runValidators: true })

	res.status(200).json(user)
})