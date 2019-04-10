const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.createUser = functions.firestore
    .document('users/{userId}')
    .onCreate((snap, context) => {
      const nickname = snap.get('nickname');
      return admin.firestore().collection('testing').add({testing:`Welcome to our new user : ${nickname} !`});
    });

// exports.notifyReceiver = functions.firestore
//     .document('messages/{groupChatId}/{groupChatIdCollection}/{message}')
//     .onCreate((snap, context) => {;
//       const senderID = snap.get('idFrom');
//       const receiverID = snap.get('idTo');
//       const content = snap.get('content');
//       console.log("senderID: "+senderID+", receiverID: "+receiverID+", content: "+content);

//       var getReceiverDoc = admin.firestore().collection('users').doc(receiverID);
//       //console.log("fcmTokenReceiver :"+fcmTokenReceiver);
//       var getSenderDoc = admin.firestore().collection('users').doc(senderID);
//       //console.log("photoUrlSender :"+photoUrlSender);
//       var fcm_token;
//       var photoUrl;
//       var nameSender;

//       return admin.firestore()
//         .collection('users')
//         .doc(receiverID)
//         .get()
//         .then(doc => {
//           fcm_token =  doc.data().fcm_token
//           return admin.firestore()
//             .collection('users')
//             .doc(senderID)
//             .get()
//             .then(doc => {
//               photoUrlSender =  doc.data().photoUrl
//               nameSender = doc.data().nickname
//               console.log("fcm_token: "+fcm_token+", photoUrlSender: "+photoUrlSender+", nameSender: "+nameSender);
//               const payload = {
//                 notification: {
//                   title: nameSender,
//                   body: content ? (content.length <= 100 ? content : content.substring(0, 97) + '...') : '',
//                   icon: photoUrlSender,
//                   click_action: "FLUTTER_NOTIFICATION_CLICK"
//                 },
//                 data : {
//                   click_action: "FLUTTER_NOTIFICATION_CLICK",
//                   id: "1",
//                   status: "done"
//                 }
//               };
//               return admin.messaging().sendToDevice(fcm_token, payload)
            
//           });
//         });
        
//       });

      // return Promise.all([getReceiverDoc, getSenderDoc]).then(results=>{
      // }).then((response)=>{
      //     const tokensToRemove = [];
      //     response.results.forEach((result, index) => {
      //       const error = result.error;
      //       if (error) {
      //         console.error('Failure sending notification to', tokens[index], error);
      //         if (error.code === 'messaging/invalid-registration-token' ||
      //             error.code === 'messaging/registration-token-not-registered') {
      //           tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
      //         }
      //       }
      //     });
      //       return Promise.all(tokensToRemove);
      //   });

      //return admin.messaging().sendToDevice(fcmTokenReceiver, payload).then((response)=>{

        exports.notifyReceiver = functions.firestore
        .document('messages/{groupChatId}/{groupChatIdCollection}/{message}')
        .onCreate((docSnapshot, context) => {
            const message = docSnapshot.data();
            const idReceiver = message['idTo'];
            const senderName = message['idFrom'];
     
            return admin.firestore().doc('users/' + idReceiver).get().then(userDoc => {
                const registrationTokens = userDoc.get('fcm_token')
     
                const notificationBody = (message['type'] === 0) ? message['content'] : "You received a new image message."
                const payload = {
                    notification: {
                        title: senderName + " sent you a message.",
                        body: notificationBody,
                        //clickAction: "ChatActivity"
                        click_action: "FLUTTER_NOTIFICATION_CLICK"
                    },
                    data: {
                        USER_NAME: senderName,
                        //USER_ID: message['senderId']
                        USER_ID: senderName
                    }
                }
     
                return admin.messaging().sendToDevice(registrationTokens, payload).then( response => {
                    const stillRegisteredTokens = registrationTokens
     
                    response.results.forEach((result, index) => {
                        const error = result.error
                        if (error) {
                            const failedRegistrationToken = registrationTokens[index]
                            console.error('blah', failedRegistrationToken, error)
                            if (error.code === 'messaging/invalid-registration-token'
                                || error.code === 'messaging/registration-token-not-registered') {
                                    const failedIndex = stillRegisteredTokens.indexOf(failedRegistrationToken)
                                    if (failedIndex > -1) {
                                        stillRegisteredTokens.splice(failedIndex, 1)
                                    }
                                }
                        }
                    })
     
                    return admin.firestore().doc("users/" + idReceiver).update({
                        registrationTokens: stillRegisteredTokens
                    })
                })
            })
        })

    