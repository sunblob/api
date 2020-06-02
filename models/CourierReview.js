const mongoose = require('mongoose')

// оценка для курьера/руководства
const CourierReviewSchema = mongoose.Schema(
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
      ref: 'Courier'
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'Client'
    }
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'updated'
    }
  }
)

CourierReviewSchema.statics.getAverageRatingForCourier = async function(courierId) {
  const obj = await this.aggregate([
    {
      $match: { courier: courierId }
    },
    {
      $group: {
        _id: '$courier',
        rating: { $avg: '$rating' }
      }
    }
  ])

  try {
    await this.model('Courier').findByIdAndUpdate(courierId, {
      rating: obj[0].rating
    })
  } catch (error) {}
}


// call getAveragecost after save
CourierReviewSchema.post('save', async function(next) {
  await this.constructor.getAverageRatingForCourier(this.courier)
})

// call getAverageCost after remove
CourierReviewSchema.pre('remove', async function(next) {
  await this.constructor.getAverageRatingForCourier(this.courier)
})

module.exports = mongoose.model('CourierReview', CourierReviewSchema)
