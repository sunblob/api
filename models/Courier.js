const mongoose = require('mongoose')

//Клиент
const UserSchema = mongoose.Schema(
  {
    token: {
      type: String,
      unique: true,
      select: false
    },
    role: {
      type: String,
      enum: ['courier'],
      default: 'courier',
    },
    name: {
      type: String,
      default: ''
    },
    hint: {
      type: String,
      default: ''
    },
    phoneNumber: {
      type: String,
      match: [/^((\+7|7|8)+([0-9]){10})$/, 'Введите валидный номер телефона'],
      index: {
        unique: true,
        partialFilterExpression: {phoneNumber: {$type: 'string'}}
      }
    },
    isActive: {
      type: Boolean,
      default: false
    },
    isAway: {
      type: Boolean,
      default: false
    },
    supervisor: {
      type: mongoose.Schema.ObjectId,
      ref: 'Supervisor',
      default: () => null
    },
    coordinates: {
      type: [Number],
      index: '2d',
      default: () => null
    },
    productList: {
      type: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'Product'
        }
      ],
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

//Кластеризация
UserSchema.statics.getClusters = async function (lowerLeft, upperRight, a, b) {
  const arrA = new Array(a + 1)
  const arrB = new Array(b + 1)
  for (let i = 0; i < b + 1; i++) {
    arrB[i] = 0
  }

  for (let i = 0; i < arrA.length; i++) {
    arrA[i] = arrB.slice(0)
  }

  let outputArr = []
  if (upperRight[0] < lowerLeft[0]) upperRight[0] += 360

  let k1 = (upperRight[0] - lowerLeft[0]) / a
  let k2 = (upperRight[1] - lowerLeft[1]) / b

  const points = await this.aggregate([
    {
      $match: {
        role: 'courier',
        isActive: true,
        coordinates: {
          $geoWithin: {
            $box: [lowerLeft, upperRight]
          }
        }
      }
    },
    {
      $project: {
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isAway: 1,
        supervisor: 1,
        rating: 1,
        productList: 1,
        coordinates: 1,
        i: {
          $cond: {
            if: {
              $lt: [
                {
                  $arrayElemAt: ['$coordinates', 0]
                }, lowerLeft[0]
              ]
            },
            then: {
              $sum: [
                {
                  $arrayElemAt: ['$coordinates', 0]
                }, 360
              ]
            },
            else: {
              $arrayElemAt: ['$coordinates', 0]
            }
          }
        },
        j: {
          $arrayElemAt: ['$coordinates', 1]
        }
      }
    },
    {
      $project: {
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isAway: 1,
        supervisor: 1,
        rating: 1,
        productList: 1,
        coordinates: 1,
        i: {
          $subtract: ['$i', lowerLeft[0]]
        },
        j: {
          $subtract: ['$j', lowerLeft[1]]
        }
      }
    },
    {
      $project: {
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isAway: 1,
        supervisor: 1,
        rating: 1,
        productList: 1,
        coordinates: 1,
        i: {
          $divide: ['$i', k1]
        },
        j: {
          $divide: ['$j', k2]
        }
      }
    },
    {
      $project: {
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isAway: 1,
        supervisor: 1,
        rating: 1,
        productList: 1,
        coordinates: 1,
        i: {
          $round: ['$i', 0]
        },
        j: {
          $round: ['$j', 0]
        }
      }
    },
    {
      $project: {
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isAway: 1,
        supervisor: 1,
        rating: 1,
        productList: 1,
        coordinates: 1,
        i: 1,
        j: 1
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'productList',
        foreignField: '_id',
        as: 'products'
      }
    },
    {
      $project: {
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isAway: 1,
        supervisor: 1,
        rating: 1,
        productList: '$products',
        coordinates: 1,
        i: 1,
        j: 1
      },
    }
  ])

  points.forEach(point => {
    const i = point.i
    const j = point.j

    if (arrA[i][j] === 0) {
      outputArr.push(point)
    }
    arrA[i][j]++
  })

  const result = outputArr.map(point => {
    if (arrA[point.i][point.j] === 1) {
      point.amount = 1
      delete point.i
      delete point.j
    } else {
      point.amount = arrA[point.i][point.j]
      point.i = point.i * k1 + lowerLeft[0]
      if (point.i > 180) point.i = point.i - 360
      point.j = point.j * k2 + lowerLeft[1]
      point.coordinates.lng = point.i
      point.coordinates.lat = point.j
      point.productList = []
      delete point.i
      delete point.j
    }
    return point
  })

  return result
}

// UserSchema.pre('remove', async function (next) {
//   await this.model('Review').deleteMany({ user: this._id })
//   await this.model('Review').deleteMany({ courier: this._id })
//   await this.model('Review').deleteMany({ supervisor: this._id })
//   next()
// })

module.exports = mongoose.model('Courier', UserSchema)
