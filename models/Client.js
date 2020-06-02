const mongoose = require('mongoose')

//Клиент
const UserSchema = mongoose.Schema(
  {
    token: {
      type: String,
      unique: true
    },
    deviceId: {
      type: String,
      unique: true
    },
    role: {
      type: String,
      enum: ['client'],
      default: 'client'
    }
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'updated'
    }
  }
)

UserSchema.pre('remove', async function (next) {
  await this.model('Review').deleteMany({user: this._id})
  next()
})

module.exports = mongoose.model('Client', UserSchema)
