const mongoose = require('mongoose')

// оценка для курьера
const ReviewSchema = mongoose.Schema(
	{
		rating: {
			type: Number,
			min: 1,
			max: 5,
			required: true
		},
		comment: {
			type: String,
			maxLength: [ 100, 'Не более 100 символов' ],
			required: false
		},
		courier: {
			type: mongoose.Schema.ObjectId,
			ref: 'User'
		},
		supervisor: {
			type: mongoose.Schema.ObjectId,
			ref: 'User'
		},
		user: {
			type: mongoose.Schema.ObjectId,
			ref: 'User'
		}
	},
	{
		timestamps: {
			createdAt: 'created',
			updatedAt: 'updated'
		}
	}
)

ReviewSchema.statics.getAverageRatingForCourier = async function(courierId) {
	const obj = await this.aggregate([
		{
			$match: { courier: courierId }
		},
		{
			$group: {
				_id: '$courier',
				avgRating: { $avg: '$rating' }
			}
		}
	])

	try {
		await this.model('User').findByIdAndUpdate(courierId, {
			avgRating: obj[0].avgRating
		})
	} catch (error) {}
}

ReviewSchema.statics.getAverageRatingForSupervisor = async function(supevisorId) {
	const obj = await this.aggregate([
		{
			$match: { supevisor: supevisorId }
		},
		{
			$group: {
				_id: '$supevisor',
				avgRating: { $avg: '$rating' }
			}
		}
	])

	try {
		await this.model('User').findByIdAndUpdate(supevisorId, {
			avgRating: obj[0].avgRating
		})
	} catch (error) {}
}

// call getAveragecost after save
ReviewSchema.post('save', async function(next) {
	await this.constructor.getAverageRatingForCourier(this.courier)
	await this.constructor.getAverageRatingForSupervisor(this.supevisor)
})

// call getAverageCost after remove
ReviewSchema.pre('remove', async function(next) {
	await this.constructor.getAverageRatingForCourier(this.courier)
	await this.constructor.getAverageRatingForSupervisor(this.supevisor)
})

module.exports = mongoose.model('Review', ReviewSchema)
