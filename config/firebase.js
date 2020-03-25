const admin = require('firebase-admin')

const serviceAccount = require('./coffeepointsapp-firebase-adminsdk-hxjgv-663a2c271a.json')

const firebase = () =>
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: "https://coffeepointsapp.firebaseio.com"
	})

module.exports = firebase
