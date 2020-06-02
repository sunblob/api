const mongoose = require('mongoose')

// оценка для курьера/руководства
const SupervisorReviewSchema = mongoose.Schema(
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
    supervisor: {
      type: mongoose.Schema.ObjectId,
      ref: 'Supervisor'
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

SupervisorReviewSchema.statics.getAverageRatingForSupervisor = async function(supervisorId) {
  const obj = await this.aggregate([
    {
      $match: { supervisor: supervisorId }
    },
    {
      $group: {
        _id: '$supervisor',
        rating: { $avg: '$rating' }
      }
    }
  ])

  try {
    await this.model('Supervisor').findByIdAndUpdate(supervisorId, {
      rating: obj[0].rating
    })
  } catch (error) {}
}

// call getAveragecost after save
SupervisorReviewSchema.post('save', async function(next) {
  await this.constructor.getAverageRatingForSupervisor(this.supervisor)
})

// call getAverageCost after remove
SupervisorReviewSchema.pre('remove', async function(next) {
  await this.constructor.getAverageRatingForSupervisor(this.supervisor)
})

module.exports = mongoose.model('SupervisorReview', SupervisorReviewSchema)
