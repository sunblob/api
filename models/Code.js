const mongoose = require('mongoose')

// оценка для курьера
const CodeSchema = mongoose.Schema(
	{
		phoneNumber: {
            type: String,
            required: true
        },
        fcmToken: {
            type: String,
            required: true
        },
        code: {
            type: String,
            required: true
        },
        resolved: {
            type: Boolean,
            default: false
        }
	}
)

module.exports = mongoose.model('Code', CodeSchema)
