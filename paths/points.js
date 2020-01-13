const express = require('express')
const {
    getAllPoints,
    getPoint,
    createPoint,
    updatePoint,
    deletePoint,
    getPointsForUser
} = require('./../controllers/pointsController')

const router = express.Router()

const { protect, authorize } = require('../middleware/authProtect')

router
    .route('/')
    .get(getAllPoints)
    .post(protect, authorize('admin', 'confirmed'), createPoint)

router.get('/currentuser', protect, getPointsForUser)

router
    .route('/:id')
    .get(getPoint)
    .put(protect, authorize('admin', 'confirmed'), updatePoint)
    .delete(protect, authorize('admin', 'confirmed'), deletePoint)

module.exports = router
