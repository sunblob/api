const express = require('express')
const {
    getAllPoints,
    getPoint,
    createPoint,
    updatePoint,
    deletePoint
} = require('./../controllers/pointsController')

const router = express.Router()

const { protect, authorize } = require('../middleware/authProtect')

router
    .route('/')
    .get(getAllPoints)
    .post(protect, authorize(true), createPoint)
router
    .route('/:id')
    .get(getPoint)
    .put(protect, authorize(true), updatePoint)
    .delete(protect, authorize(true), deletePoint)

module.exports = router
