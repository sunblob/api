const express = require('express')
const {
	handshake
} = require('../controllers/userController')

const router = express.Router()

router.post('/handshake', handshake)

module.exports = router
