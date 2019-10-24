const { firedb } = require('../util/admin');

exports.getAllScreams = (req, res) => {
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
}

exports.postOneScream = (req, res) => {
    if (req.body.body.trim() === '') {
        return res.status(400).json({ body: 'Body must not be empty.' });
    }

    const newSreams = {
        body: req.body.body,
        userHandle: req.user.handle,
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
}