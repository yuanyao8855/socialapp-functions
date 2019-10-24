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

  //Validatiaon and Login Route
  let errors = {};
  if (isEmpty(newUser.email)) {
    errors.email = 'Must not be empty'
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be a valid emaill address'
  }
  if (isEmpty(newUser.password)) errors.password = 'Must not be empty'
  if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwird must match';
  if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

  if(Object.keys(errors).length>0) return res.status(400).json(errors);
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

app.post('/login',(req,res)=>{
  const user={
    email: req.body.email,
    password: req.body.password
  }

  let errors ={};
  if (isEmpty(user.email)) errors.email = 'Must not be empty'
  if (isEmpty(user.password)) errors.password = 'Must not be empty'

  if(Object.keys(errors).length>0) return res.status(400).json(errors);
  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
  .then(data =>{
    return data.user.getIdToken();
  })
  .then(token =>{
    return res.json(token);
  })
  .catch(err =>{
    console.error(err);
    if(err.code ==='auth/wrong-password') return res.status(403).json({error : 'wrong password.'})
    else return res.status(500).json({error: err.code});
  })
})

exports.api = functions.https.onRequest(app);

//help function

const isEmpty = str => {
  if (str.trim() === '') return true;
  else return false;
};

const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  else return false;
}