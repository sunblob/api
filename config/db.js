const mongoose = require('mongoose')

const connectDB = async () => {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })

    console.log(`mongoDB connected: ${connection.connection.host}`.cyan.bold)
}

module.exports = connectDB
