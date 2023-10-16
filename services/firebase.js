const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
    credential: cert(credentials),
    storageBucket: "server-ue5.appspot.com"
})

const db = getFirestore()
const bucket = getStorage().bucket()

module.exports = { db, bucket }