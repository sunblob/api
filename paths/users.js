const express = require('express')
const {
	handshake
} = require('../controllers/userController')

const router = express.Router()

const { protect, authorize } = require('../middleware/authProtect')

router.post('/handshake', handshake)

module.exports = router
