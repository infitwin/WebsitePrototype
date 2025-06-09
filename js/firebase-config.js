/**
 * Firebase Configuration
 * 
 * This file initializes Firebase for the Infitwin application.
 * Enhanced version ported from ui-studio with Functions and measurement support.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyB0SdtkO7ngsXP7B0geafpDv_xEBAujel8",
    authDomain: "infitwin.firebaseapp.com",
    projectId: "infitwin",
    storageBucket: "infitwin.firebasestorage.app",
    messagingSenderId: "833139648849",
    appId: "1:833139648849:web:2768d8e37cf2a318018b70",
    measurementId: "G-PEJN4ZMCZ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Functions with region
export const functions = getFunctions(app, 'us-east4');

// Connect to emulators for local development
// DISABLED: Using real Firebase backend for testing
// if (location.hostname === "localhost") {
//     connectAuthEmulator(auth, "http://localhost:9099");
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     connectFunctionsEmulator(functions, 'localhost', 5001);
// }

// Export initialized Firebase services
const firebaseServices = {
    app,
    auth,
    storage,
    db,
    functions
};

export default firebaseServices;