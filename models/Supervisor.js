const mongoose = require('mongoose')

//Клиент
const UserSchema = mongoose.Schema(
  {
    token: {
      type: String,
      unique: true,
      select: false
    },
    name: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['supervisor'],
      default: 'supervisor'
    },
    phoneNumber: {
      type: String,
      match: [/^((\+7|7|8)+([0-9]){10})$/, 'Введите валидный номер телефона'],
      index: {
        unique: true,
        partialFilterExpression: {phoneNumber: {$type: 'string'}}
      }
    },
    supervisorStatus: {
      type: String,
      enum: ['disabled', 'standard', 'premium'],
      default: 'standard'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: () => null
    }
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'updated'
    }
  }
)


module.exports = mongoose.model('Supervisor', UserSchema)
