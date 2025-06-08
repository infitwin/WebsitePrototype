/**
 * Firebase Configuration
 * 
 * This file initializes Firebase for the Infitwin application.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyB0SdtkO7ngsXP7B0geafpDv_xEBAujel8",
    authDomain: "infitwin.firebaseapp.com",
    projectId: "infitwin",
    storageBucket: "infitwin.firebasestorage.app",
    messagingSenderId: "833139648849",
    appId: "1:833139648849:web:2768d8e37cf2a318018b70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optional: Connect to emulators for local development
// Uncomment these lines to use Firebase emulators
// if (location.hostname === "localhost") {
//     connectAuthEmulator(auth, "http://localhost:9099");
//     connectFirestoreEmulator(db, 'localhost', 8080);
// }

export default firebaseConfig;