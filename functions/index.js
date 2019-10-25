const functions = require('firebase-functions');

const firebase = require('firebase');
const firebaseConfig = require('./util/config');
firebase.initializeApp(firebaseConfig);

const app = require('express')();
const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signup, login } = require('./handlers/users');

const { FBAuth } = require('./util/fbAuth');

//screams routes
app.get('/screams', getAllScreams);
app.post('/screams', FBAuth, postOneScream);

// users routes
app.post('/signup', signup);

app.post('/login', login);

exports.api = functions.https.onRequest(app);
