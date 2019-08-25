const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./socialapp-c241a-firebase-adminsdk-f5p0o-a0728c9a4e.key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://socialapp-c241a.firebaseio.com',
});

const app = require('express')();

const firebase = require('firebase');
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAeTub6FbLSoqo8h55VLfCKaIY6HXayNKI',
  authDomain: 'socialapp-c241a.firebaseapp.com',
  databaseURL: 'https://socialapp-c241a.firebaseio.com',
  projectId: 'socialapp-c241a',
  storageBucket: 'socialapp-c241a.appspot.com',
  messagingSenderId: '196617149433',
  appId: '1:196617149433:web:dafc1f8d294c7e29',
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const firedb = admin.firestore();

app.get('/screams', (req, res) => {
  firedb
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          ...doc.data(),
        });
      });
      return res.json(screams);
    })
    .catch(err => console.error(err));
});

app.post('/screams', (req, res) => {
  const newSreams = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString(),
  };
  firedb
    .collection('screams')
    .add(newSreams)
    .then(doc => {
      res.json({ message: `document ${doc.id} is created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: `something went wrong` });
      console.error(err);
    });
});

// Signup route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  //TODO: validate data
  let token, userId;
  firedb
    .doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({
          handle: 'this handle is already taken',
        });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idtoken => {
      token = idtoken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      return firedb.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(data => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === 'auth/email-already-in-use')
        return res.status(400).json({ email: 'email is already in user' });
      else return res.status(500).json({ err: err.code });
    });
});

exports.api = functions.https.onRequest(app);
