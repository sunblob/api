const express = require('express')
const {
	register,
	login,
	getSupervisors,
	getSupervisor,
	updateName,
	updateSupervisor,
	deleteSupervisor,
	authWithNumber,
	codeCheck
} = require('../controllers/supevisorController')

const router = express.Router()
const reviewRouter = require('./reviews')
const productRouter = require('./products')

const { protect, authorize, authorizeSupervisor } = require('../middleware/authProtect')

router.use('/:id/reviews', protect, authorize('courier'), reviewRouter)
router.use('/:id/products', protect, authorize('courier'), productRouter)

router.route('/').get(getSupervisors)

router
	.route('/:id')
	.get(getSupervisor)
	.put(protect, authorize('supervisor'), authorizeSupervisor('standard', 'premium'), updateSupervisor)
	.put(protect, authorize('supervisor'), updateName)
	.delete(protect, authorize('supervisor'), authorizeSupervisor('standard', 'premium'), deleteSupervisor)

router.route('/login').post(login)

router.route('/register').post(register)

router.route('/auth').post(authWithNumber)

router.route('/codecheck').post(codeCheck)

module.exports = router
