const functions = require('firebase-functions');
const cors = require('cors')({origin: true});

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Create User
exports.createUser = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    const tokenId = request.get('Authorization');

    // Verify token
    admin.auth().verifyIdToken(tokenId)
      .then( decodedToken => (

        admin.auth().createUser({
          email: request.query.email,
          password: request.query.password,
        })

      )).then(userRecord => {

        return response.send(userRecord);

      }).catch(error => {

        response.status(400).send(error);

      });
  });
});

// Update User
exports.updateUser = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    const tokenId = request.get('Authorization');

    admin.auth().verifyIdToken(tokenId)
      .then(decodedToken => (

        admin.auth().updateUser(request.query.uid, {
          email: request.query.email,
          password: request.query.password
        })

      )).then(userRecord => {

        return response.send('Successfully updated user');

      }).catch(error => {

        return response.status(400).send(error);

      });
  });
});

// Increment View Count
exports.incrementViews = functions.https.onRequest((request, response) => {
  cors(request, response, () => {

    // Get request params
    const odieId = request.query.odie || undefined;
    const views = request.query.views || undefined;

    // Check that loteId was passed
    if (odieId === undefined) {

      // Respond: loteId us undefined
      throw new Error('odieId/undefined');

    } else {

      admin.database.enableLogging(true);

      // Verify tokeId for security
      return admin.database()
      .ref(`odies/${odieId}/views`)
      .transaction(function(currentViews) {
        let views = currentViews || 0;
        return parseInt(views) + 1;
      }).then( () => {
        console.log('Views incremented');

        // Respond with success and return owner data
        return response.status(200).json({
          message: 'Views incremented',
        });

      }).catch(error => {
        let status = 400;

        if(error.message) {

          return response
            .status(400)
            .json({
              error: error.message,
            });
        }

        console.log('ERROR', error.message);

        return response.status(status);

      });
    }
  });
});

// Odie of the Hour
exports.hourlyOdie = functions.https.onRequest((request, response) => {
  cors(request, response, () => {

    admin.database.enableLogging(true);

    const odies = admin.database().ref('odies');

    return odies.once('value').then(snapshot => {
      const numOdies = snapshot.numChildren();
      const randomIndex = Math.floor(Math.random() * numOdies);

      return odies.orderByChild('hourly').equalTo(true).once('value').then(snapshot => {
        var exists = (snapshot.val() !== null);

        if (exists) snapshot.update({'hourly': false});

        console.log('randomIndex: ' + randomIndex);
        return;
        //return odies.limitToFirst(randomIndex).update({'hourly': true});
      });
    });
  });
});
