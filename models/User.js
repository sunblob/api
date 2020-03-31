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
			unique: true
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
			type: [ {
				type: mongoose.Schema.ObjectId,
				ref: 'Product'
			} ],
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

UserSchema.pre('remove', async function(next) {
	await this.model('Review').deleteMany({ user: this._id })
	await this.model('Review').deleteMany({ courier: this._id })
	await this.model('Review').deleteMany({ supervisor: this._id })
	next()
})

module.exports = mongoose.model('User', UserSchema)
