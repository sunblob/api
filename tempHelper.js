const mongoose = require('mongoose')
const colors = require('colors')
const dotenv = require('dotenv')

dotenv.config({ path: './config/config.env' })

const User = require('./models/User')
const Point = require('./models/Point')

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})

//delete date
const deleteData = async () => {
    try {
        await User.deleteMany()
        await Point.deleteMany()

        console.log('Data destroyed...'.red.inverse)
        process.exit()
    } catch (error) {
        console.log(error)
    }
}

if (process.argv[2] === '-d') {
    deleteData()
}
