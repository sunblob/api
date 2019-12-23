const ErrorResponse = require('./../utils/errorResponse')

const errorHandler = (err, req, res, next) => {
    console.log(err)

    let error = { ...err }
    error.message = err.message

    //если id имеет неправильный формат
    if (err.name === 'CastError') {
        const message = `Ничего не найдено с id ${err.value}`
        error = new ErrorResponse(message, 404)
    }

    // дублирование
    if (err.code === 11000) {
        const message = `Такое уникальное поле уже существует`
        error = new ErrorResponse(message, 400)
    }

    //ошибки валидации
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message, 400)
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Ошибка сервера'
    })
}

module.exports = errorHandler
