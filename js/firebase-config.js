// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwEeNjQqHUzRXVAAJH6zu--3EDvWdMHBM",
  projectId: "ctrlzone-ac391",
  authDomain: "ctrlzone-ac391.firebaseapp.com",
  storageBucket: "ctrlzone-ac391.appspot.com",
  messagingSenderId: "74572007141",
  appId: "1:74572007141:web:YOUR_APP_ID" // You'll need to replace this with your actual App ID
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig }; 