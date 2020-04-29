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
      match: [/^((\+7|7|8)+([0-9]){10})$/, 'Введите валидный номер телефона']
      //index: {
      //	unique: true,
      //	partialFilterExpression: { phoneNumber: { $type: 'string' } }
      //}
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
      enum: ['user', 'courier', 'supervisor'],
      default: 'user'
    },
    supervisor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    supervisorStatus: {
      type: String,
      enum: ['disabled', 'standard', 'premium']
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

UserSchema.statics.getBetterClusters = async function (lowerLeft, upperRight, a, b) {
  const arrA = new Array(a + 1)
  const arrB = new Array(b + 1)
  for (let i = 0; i < b + 1; i++) {
    arrB[i] = 0
  }

  for (let i = 0; i < arrA.length; i++) {
    arrA[i] = arrB.slice(0)
  }

  let outputArr = []
  // console.log("arr: ", arr)
  if (upperRight[1] < lowerLeft[1]) upperRight[1] += 360

  let k1 = (upperRight[1] - lowerLeft[1]) / a
  let k2 = (upperRight[0] - lowerLeft[0]) / b

  // const tmp = await this.find()
  //   .where('coordinates')
  //   .within()
  //   .box(lowerLeft, upperRight)

  const points = await this.aggregate([
    {
      $match: {
        role: 'courier',
        isActive: true,
        // coordinates: { $not: [null] },
        coordinates: {
          $geoWithin: {
            $box: [lowerLeft, upperRight]
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isActive: 1,
        isCurrentlyNotHere: 1,
        supervisor: 1,
        avgRating: 1,
        productList: 1,
        coordinates: 1,
        i: {
          $cond: {
            if: {
              $lt: ['$coordinates.lng', lowerLeft[1]]
            },
            then: {
              $sum: ['$coordinates.lng', 360]
            },
            else: '$coordinates.lng'
          }
        },
        j: '$coordinates.lat'
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isActive: 1,
        isCurrentlyNotHere: 1,
        supervisor: 1,
        avgRating: 1,
        productList: 1,
        coordinates: 1,
        i: {
          $subtract: ['$i', lowerLeft[1]]
        },
        j: {
          $subtract: ['$j', lowerLeft[0]]
        }
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isActive: 1,
        isCurrentlyNotHere: 1,
        supervisor: 1,
        avgRating: 1,
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
        _id: 1,
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isActive: 1,
        isCurrentlyNotHere: 1,
        supervisor: 1,
        avgRating: 1,
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
        _id: 1,
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isActive: 1,
        isCurrentlyNotHere: 1,
        supervisor: 1,
        avgRating: 1,
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
        _id: 1,
        name: 1,
        hint: 1,
        phoneNumber: 1,
        isActive: 1,
        isCurrentlyNotHere: 1,
        supervisor: 1,
        avgRating: 1,
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

    console.log('i: ', i, 'j: ', j)
    if (arrA[i][j] == 0) {
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
      point.i = point.i * k1 + lowerLeft[1]
      if (point.i > 180) point.i = point.i - 360
      point.j = point.j * k2 + lowerLeft[0]
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

UserSchema.statics.getClusters = async function (lowerLeft, upperRight, a, b) {
  let k1 = upperRight[0] - lowerLeft[0] / a
  let k2 = upperRight[1] - lowerLeft[1] / b
  const clusters = await this.aggregate([
    {
      $match: {
        role: 'courier',
        coordinates: { $not: [null] },
        coordinates: {
          $geoWithin: {
            $box: [lowerLeft, upperRight]
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        token: 1,
        geometry: {
          lng: { $subtract: ['$coordinates.lng', lowerLeft[0]] },
          lat: { $subtract: ['$coordinates.lat', lowerLeft[1]] }
        }
      }
    },
    {
      $project: {
        _id: 1,
        token: 1,
        geometry: {
          lng: { $divide: ['$geometry.lng', k1] },
          lat: { $divide: ['$geometry.lat', k2] }
        }
      }
    },
    {
      $project: {
        _id: 1,
        token: 1,
        geometry: {
          lng: { $round: ['$geometry.lng', 0] },
          lat: { $round: ['$geometry.lat', 0] }
        }
      }
    },
    {
      $project: {
        _id: 1,
        token: 1,
        geometry: {
          lng: { $multiply: ['$geometry.lng', k1] },
          lat: { $multiply: ['$geometry.lat', k2] }
        }
      }
    },
    {
      $project: {
        _id: 1,
        token: 1,
        geometry: {
          lng: { $sum: ['$geometry.lng', lowerLeft[0]] },
          lat: { $sum: ['$geometry.lat', lowerLeft[1]] }
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

UserSchema.pre('remove', async function (next) {
  await this.model('Review').deleteMany({ user: this._id })
  await this.model('Review').deleteMany({ courier: this._id })
  await this.model('Review').deleteMany({ supervisor: this._id })
  next()
})

module.exports = mongoose.model('User', UserSchema)
