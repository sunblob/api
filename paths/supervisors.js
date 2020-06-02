const express = require('express')
const {
  getSupervisors,
  getSupervisor,
  updateSupervisor,
  deleteSupervisor,
  authWithNumber,
  codeCheck,
  updateMe,
  getMe
} = require('../controllers/supevisorController')

const Courier = require('../models/Courier')
const Supervisor = require('../models/Supervisor')
const Client = require('../models/Client')

const {createReviewForSupervisor} = require('../controllers/reviewController')
const {getMyProducts, getProducts} = require('../controllers/productController')

const router = express.Router()

const { protectUser, authorize, authorizeSupervisor } = require('../middleware/authProtect')

/*
	Роуты завязаные с отзывами по типу supervisors/id/reviews
*/
router.route('/:id/reviews').post(protectUser(Client), authorize('client'), createReviewForSupervisor)

/*
	Роуты завязаные с товарами по типу supervisors/id(me)/products
*/
router.route('/me/products/').get(protectUser(Supervisor), authorize('supervisor'), getMyProducts)
router.route('/:id/products').get(protectUser(Courier), authorize('courier'), getProducts)

router.route('/').get(getSupervisors)

router.route('/me')
  .get(protectUser(Supervisor), authorize('supervisor'), getMe)
  .put(protectUser(Supervisor), authorize('supervisor'), updateMe)

router
  .route('/:id')
  .get(getSupervisor)
  .put(protectUser(Supervisor), authorize('supervisor'), updateSupervisor)
  .delete(protectUser(Supervisor), authorize('supervisor'), deleteSupervisor)

router.route('/auth').post(authWithNumber)

router.route('/codecheck').post(codeCheck)

module.exports = router
