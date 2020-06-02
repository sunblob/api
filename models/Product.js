const mongoose = require('mongoose')

//Товар
const ProductSchema = mongoose.Schema(
	{
		type: {
			type: String,
			enum: [ 'Кофе', 'Мороженое', 'Блинчики', 'Другое' ],
			required: true
		},
		name: {
			type: String,
			required: true
		},
		supervisor: {
			type: mongoose.Schema.ObjectId,
			ref: 'Supervisor',
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

ProductSchema.pre('remove', async function(next) {
	await this.model('Courier').update({ productList: this._id }, { $pull: { productList: this._id } }, { multi: true })
	next()
})

module.exports = mongoose.model('Product', ProductSchema)
