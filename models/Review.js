const mongoose = require('mongoose')

// оценка для курьера/руководства
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

ReviewSchema.statics.getAverageRatingForSupervisor = async function(supervisorId) {
	const obj = await this.aggregate([
		{
			$match: { supervisor: supervisorId }
		},
		{
			$group: {
				_id: '$supervisor',
				avgRating: { $avg: '$rating' }
			}
		}
	])

	try {
		await this.model('User').findByIdAndUpdate(supervisorId, {
			avgRating: obj[0].avgRating
		})
	} catch (error) {}
}

// call getAveragecost after save
ReviewSchema.post('save', async function(next) {
	await this.constructor.getAverageRatingForCourier(this.courier)
	await this.constructor.getAverageRatingForSupervisor(this.supervisor)
})

// call getAverageCost after remove
ReviewSchema.pre('remove', async function(next) {
	await this.constructor.getAverageRatingForCourier(this.courier)
	await this.constructor.getAverageRatingForSupervisor(this.supervisor)
})

module.exports = mongoose.model('Review', ReviewSchema)
