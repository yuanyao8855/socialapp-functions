const { admin, firedb } = require('../util/admin');
const config = require('../util/config');

const firebase = require('firebase');

const { validateSignupData, validateLoginData } = require('../util/validators');

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const { valid, errors } = validateSignupData(newUser);
  if (!valid) res.status(400).json(errors);

  const defaultImage = 'blank-profile-picture.png';

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultImage}?alt=media`,
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
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };
  const { valid, errors } = validateLoginData(user);
  if (!valid) res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json(token);
    })
    .catch(err => {
      console.error(err);
      if (err.code === 'auth/wrong-password')
        return res.status(403).json({ error: 'wrong password.' });
      else return res.status(500).json({ error: err.code });
    });
};

exports.uploadImage = (req, res) => {
  const Busboy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');
  const busboy = new Busboy({ headers: req.headers });

  let imageTobeUploaded = {};
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong file type submitted' });
    }

    // image.png
    const imageExtension = filename.split('.')[filename.split('.').length - 1];
    const imageFileName = `${Math.random()
      .toString(36)
      .substring(2, 15) +
      Math.random()
        .toString(36)
        .substring(2, 15)}.${imageExtension}`;
    const imageFilePath = path.join(os.tmpdir(), imageFileName);
    imageTobeUploaded = { imageFileName, imageFilePath, mimetype };

    file.pipe(fs.createWriteStream(imageFilePath));
  });

  busboy.on('finish', () => {
    admin
      .storage()
      .bucket()
      .upload(imageTobeUploaded.imageFilePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageTobeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageTobeUploaded.imageFileName}?alt=media`;
        return firedb.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: 'Image uploaded successfully' });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
};
