const mongoose = require('mongoose')

// оценка для курьера
const CitySchema = mongoose.Schema(
	{
		name: {
			type: String,
			enum: [ 'Москва', 'Санкт-Петербург', 'Екатеринбург', 'Самара', 'Нижний Новгород' ],
			require: true
		}
	},
	{
		timestamps: {
			createdAt: 'created',
			updatedAt: 'updated'
		}
	}
)

module.exports = mongoose.model('City', CitySchema)
