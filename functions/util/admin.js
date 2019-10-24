const admin = require('firebase-admin');
const serviceAccount = require('../socialapp-c241a-firebase-adminsdk-f5p0o-a0728c9a4e.key.json');
const firebase = require('firebase');
const firebaseConfig = require('./config');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://socialapp-c241a.firebaseio.com',
});

const firedb = admin.firestore();

module.exports = { admin, firedb };