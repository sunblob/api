const mongoose = require('mongoose')

// оценка для курьера
const ProductSchema = mongoose.Schema(
	{
		type: {
			type: String,
			enum: [ 'Кофе', 'Мороженое', 'Другое' ],
			required: true
		},
		name: {
			type: String,
			required: true
		},
		amount: {
			type: Number,
			min: 1,
			required: true
		},
		courier: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: true
		}
	},
	{
		timestamps: {
			createdAt: 'created',
			updatedAt: 'updated'
		}
	}
)

module.exports = mongoose.model('Product', ProductSchema)
