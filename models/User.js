const crypto = require('crypto')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
// const redis = require('redis')
// const JWTR = require('jwt-redis').default
// const redisClient = redis.createClient()
// const jwtr = new JWTR(redisClient)

const UserSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Введите имя']
        },
        email: {
            type: String,
            required: [true, 'Введите почту'],
            unique: true,
            match: [
                /^\w+([\.-]?\w+)*@\w([\.-]?\w+)*(\.\w{2,3})+$/,
                'Введите правильную почту'
            ]
        },
        password: {
            type: String,
            required: [true, 'Введите пароль'],
            minlength: 6,
            select: false
        },
        isConfirmed: {
            type: Boolean,
            default: false
        },
        loggedIn: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'updated'
        }
    }
)

//Шифрование пароля
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next()
    }

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

//Получаем jwt token
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    })
}

//сравниваем пароли в бд и то что пришло
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

// удалить токен (создать такой токен который исчезнет через 2 секунды)
UserSchema.methods.deleteJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LOGOUT_EXPIRE
    })
}

module.exports = mongoose.model('User', UserSchema)
