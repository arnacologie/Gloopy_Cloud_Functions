const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.createUser = functions.firestore
    .document('users/{userId}')
    .onCreate((snap, context) => {
      const nickname = snap.get('nickname');
      return admin.firestore().collection('testing').add({testing:`Welcome to our new user : ${nickname} !`});
    });

exports.notifyReceiver = functions.firestore
    .document('messages/{groupChatId}/{groupChatIdCollection}/{message}')
    .onCreate((snap, context) => {;
      const senderID = snap.get('idFrom');
      const receiverID = snap.get('idTo');
      const content = snap.get('content');
      console.log("senderID "+senderID+)

      const fcmTokenReceiver = admin.firestore().collection('users').get(receiverID);

      console.log("fcmTokenReceiver :"+fcmTokenReceiver.fcm_token);
      const photoUrlSender = admin.firestore().collection('users').get(senderID).get('photoUrl');
      console.log("photoUrlSender :"+photoUrlSender);
      const nameSender = admin.firestore().collection('users').get(senderID).get('nickname');
      console.log("nameSender :"+nameSender);
      //return admin.firestore().collection('testing').add({testing:`Welcome to our new user : ${nickname} !`});
      

      const sendNotification = admin.messaging().sendToDevice(fcmTokenReceiver, payload);

      return Promise.resolve(sendNotification).then(results=>{

        const payload = {
          notification: {
            title: nameSender,
            body: content ? (content.length <= 100 ? content : content.substring(0, 97) + '...') : '',
            icon: photoUrlSender,
            click_action: "FLUTTER_NOTIFICATION_CLICK"
          }
        };

        return admin.messaging().sendToDevice(fcmTokenReceiver, payload);
      }).then((response)=>{
        const tokensToRemove = [];
        response.results.forEach((result, index) => {
          const error = result.error;
          if (error) {
            console.error('Failure sending notification to', tokens[index], error);
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
              tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
            }
          }
        });
          return Promise.all(tokensToRemove);
      });
      
    });

    