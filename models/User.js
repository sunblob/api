const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = mongoose.Schema(
    {
        token: {
            type: String,
            unique: true
        },
        name: {
            type: String,
            default: ''
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
        role: {
            type: String,
            enum: ['admin', 'confirmed', 'unconfirmed'],
            default: 'unconfirmed'
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

//выдаем токен
UserSchema.methods.getToken = function() {
    return this.token
}

//сравниваем пароли в бд и то что пришло
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

//удалить все точки точки пользователя когда он удаляется
UserSchema.pre('remove', async function(next) {
    await this.model('Point').deleteMany({ user: this._id })
    next()
})

module.exports = mongoose.model('User', UserSchema)
