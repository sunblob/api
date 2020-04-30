const express = require('express')
const path = require('path')
const dotenv = require('dotenv')
const morgan = require('morgan')
const colors = require('colors')

//Защита от NoSql инъекций
const helmet = require('helmet')
const xss = require('xss-clean')
const hpp = require('hpp')
const mongoSanitize = require('express-mongo-sanitize')

//для доступа с других доменов
const cors = require('cors')

//получение текущего ip адреса
const ip = require('ip')

//middleware
const errorHandler = require('./middleware/error')

//Загрузка глобальный переменных
dotenv.config({ path: './config/config.env' })

//Загрузка БД
const connectDB = require('./config/db')
connectDB()

const firebase = require('./config/firebase')
firebase()

// const {connect} = require('./config/mongo')
// connect()

const app = express()

// файлы с путями
const couriers = require('./paths/couriers')
const supervisors = require('./paths/supervisors')
const products = require('./paths/products')
const users = require('./paths/users')

//Body parse - нужен для обработки POST/PUT запросов
app.use(express.json())

//Логгирование во время разработки
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

//Защита от NoSql инъекций
app.use(mongoSanitize())
app.use(helmet())
app.use(hpp())
app.use(xss())

app.use(cors())

//Установка статического фолдера
app.use(express.static(path.join(__dirname, 'public')))

// привязка путей
app.use('/api/couriers', couriers)
app.use('/api/supervisors', supervisors)
app.use('/api/products', products)
app.use('/api/users', users)

app.use(errorHandler)

//Запуск сервера
const PORT = process.env.PORT || 5000
const ip_address = ip.address()
const server = app.listen(
  PORT,
  // ip_address,
  console.log(`Сервер запущен на порту: ${PORT}`.yellow.bold)
)

//Если не удается соединиться с бд выключаем сервер
process.on('unhandledRejection', (err, promise) => {
  console.log(`Ошибка: ${err.message}`.red)

  server.close(() => {
    process.exit()
  })
})
