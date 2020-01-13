const express = require('express')
const {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser
} = require('./../controllers/usersController')

const router = express.Router()

const { protect, authorize } = require('../middleware/authProtect')

router.use(protect)

router.route('/').get(authorize('admin'), getAllUsers)

router
    .route('/:id')
    .get(authorize('admin'), getUser)
    .put(authorize('admin', 'confirmed'), updateUser)
    .delete(authorize('admin'), deleteUser)

module.exports = router
