const functions = require('firebase-functions');

const firebase = require('firebase');
const firebaseConfig = require('./util/config');
firebase.initializeApp(firebaseConfig);

const app = require('express')();
const {
  getAllScreams,
  postOneScream,
  getScream,
  likeScream,
  unlikeScream,
  commentOnScream,
  deleteScream,
} = require('./handlers/screams');
const {
  signup,
  login,
  uploadImage,
  postUserDetail,
  getUserDetail,
} = require('./handlers/users');

const { FBAuth } = require('./util/fbAuth');

//screams routes
app.get('/screams', getAllScreams);
app.post('/screams', FBAuth, postOneScream);
app.get('/screams/:screamId', getScream);
app.post('/screams/:screamId/like', FBAuth, likeScream);
app.post('/screams/:screamId/unlike', FBAuth, unlikeScream);
app.post('/screams/:screamId/comment', FBAuth, commentOnScream);
app.delete('/screams/:screamId', FBAuth, deleteScream);

// users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, postUserDetail);
app.get('/user', FBAuth, getUserDetail);

exports.api = functions.https.onRequest(app);
