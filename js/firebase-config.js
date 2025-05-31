// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwEeNjQqHUzRXVAAJH6zu--3EDvWdMHBM",
  authDomain: "ctrlzone-ac391.firebaseapp.com",
  projectId: "ctrlzone-ac391",
  storageBucket: "ctrlzone-ac391.firebasestorage.app",
  messagingSenderId: "74572007141",
  appId: "1:74572007141:web:95df9ba8767375d30ef60c",
  measurementId: "G-4JRDEMZVR2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Export initialized services
export { auth, db, storage, analytics }; 