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

const { firedb } = require('./util/admin');

exports.createNotificationOnLike = functions.firestore
  .document('likes/{id}')
  .onCreate(snapshot => {
    return firedb
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return firedb.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            screamId: doc.id,
          });
        }
      })
      .catch(err => console.error(err));
  });
exports.deleteNotificationOnUnLike = functions.firestore
  .document('likes/{id}')
  .onDelete(snapshot => {
    return firedb
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      });
  });
exports.createNotificationOnComment = functions.firestore
  .document('comments/{id}')
  .onCreate(snapshot => {
    return firedb
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return firedb.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            screamId: doc.id,
          });
        }
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.onScreamDelete = functions.firestore
  .document('/screams/{screamId}')
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = firedb.batch();
    return firedb
      .collection('comments')
      .where('screamId', '==', screamId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(firedb.doc(`/comments/${doc.id}`));
        });
        return firedb
          .collection('likes')
          .where('screamId', '==', screamId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(firedb.doc(`/likes/${doc.id}`));
        });
        return firedb
          .collection('notifications')
          .where('screamId', '==', screamId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(firedb.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => console.error(err));
  });
