const mongoose = require('mongoose')

//Тот кто будет раздавать продукцию в городе
const UserSchema = mongoose.Schema(
	{
		token: {
			type: String,
			unique: true
		},
		name: {
			type: String
		},
		phoneNumber: {
			type: String,
			match: [ /^((\+7|7|8)+([0-9]){10})$/, 'Введите валидный номер телефона' ],
			index: {
				unique: true,
				partialFilterExpression: { phoneNumber: { $type: 'string' } }
			}
		},
		deviceId: {
			type: String,
			required: false
		},
		city: {
			type: mongoose.Schema.ObjectId,
			ref: 'City'
		},
		isActive: {
			type: Boolean
		},
		isCurrentlyNotHere: {
			type: Boolean
		},
		hint: {
			type: String
		},
		avgRating: {
			type: Number,
			min: 1,
			max: 5
		},
		coordinates: {
			lng: {
				type: Number
			},
			lat: {
				type: Number
			}
		},
		role: {
			type: String,
			enum: [ 'user', 'courier', 'supervisor' ],
			default: 'user'
		},
		supervisor: {
			type: mongoose.Schema.ObjectId,
			ref: 'User'
		},
		supervisorStatus: {
			type: String,
			enum: [ 'disabled', 'standard', 'premium' ]
		},
		productList: {
			type: [
				{
					type: mongoose.Schema.ObjectId,
					ref: 'Product'
				}
			],
			default: undefined
		}
	},
	{
		timestamps: {
			createdAt: 'created',
			updatedAt: 'updated'
		}
	}
)

UserSchema.statics.getClusters = async function(lowerLeft, upperRight, k1, k2) {
	const clusters = await this.aggregate([
		{
			$match: {
				role: 'courier',
				coordinates: { $not: [ null ] },
				coordinates: {
					$geoWithin: {
						$box: [ lowerLeft, upperRight ]
					}
				}
			}
		},
		{
			$project: {
				_id: 1,
				token: 1,
				geometry: {
					lng: { $subtract: [ '$coordinates.lng', lowerLeft[0] ] },
					lat: { $subtract: [ '$coordinates.lat', lowerLeft[1] ] }
				}
			}
		},
		{
			$project: {
				_id: 1,
				token: 1,
				geometry: {
					lng: { $divide: [ '$geometry.lng', k1 ] },
					lat: { $divide: [ '$geometry.lat', k2 ] }
				}
			}
		},
		{
			$project: {
				_id: 1,
				token: 1,
				geometry: {
					lng: { $round: [ '$geometry.lng', 0 ] },
					lat: { $round: [ '$geometry.lat', 0 ] }
				}
			}
		},
		{
			$project: {
				_id: 1,
				token: 1,
				geometry: {
					lng: { $multiply: [ '$geometry.lng', k1 ] },
					lat: { $multiply: [ '$geometry.lat', k2 ] }
				}
			}
		},
		{
			$project: {
				_id: 1,
				token: 1,
				geometry: {
					lng: { $sum: [ '$geometry.lng', lowerLeft[0] ] },
					lat: { $sum: [ '$geometry.lat', lowerLeft[1] ] }
				}
			}
		},
		{
			$group: {
				_id: '$geometry',
				// geometry: '$geometry',
				points: {
					$push: {
						_id: '$_id',
						token: '$token'
					}
				},
				count: { $sum: 1 }
			}
		},
		{
			$project: {
				_id: 0,
				coordinates: '$_id',
				count: '$count',
				points: 1
			}
		}
	])

	return clusters
}

UserSchema.pre('remove', async function(next) {
	await this.model('Review').deleteMany({ user: this._id })
	await this.model('Review').deleteMany({ courier: this._id })
	await this.model('Review').deleteMany({ supervisor: this._id })
	next()
})

module.exports = mongoose.model('User', UserSchema)
