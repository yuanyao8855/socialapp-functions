const admin = require('firebase-admin');

admin.initializeApp();

const firedb = admin.firestore();

module.exports = { admin, firedb };
