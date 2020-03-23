const admin = require('firebase-admin')

const serviceAccount = require('./diploma-df493-firebase-adminsdk-u8mha-5e8feaed07.json')

const firebase = () =>
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: 'https://diploma-df493.firebaseio.com'
	})

module.exports = firebase
