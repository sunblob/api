const express = require('express')
const {
    signIn,
    signUp,
    currentUser,
    logOut
} = require('./../controllers/authController')

const router = express.Router()

const { protect } = require('../middleware/authProtect')

router.post('/register', signUp)
router.post('/login', signIn)
router.get('/logout', protect, logOut)
router.get('/me', protect, currentUser)

module.exports = router
