import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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
const auth = getAuth(app);
const db = getFirestore(app);

// Check which admin page we're on
const isAdminPage = window.location.pathname.includes('/admin/');
const isLoginPage = window.location.pathname.includes('/admin/login.html');
const isSetupPage = window.location.pathname.includes('/admin/setup.html');

// Only check admin status for admin pages that aren't login or setup
if (isAdminPage && !isLoginPage && !isSetupPage) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // No user is signed in, redirect to login
            window.location.href = '/login.html';
            return;
        }

        // Check if user is admin
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists() || !userDoc.data().isAdmin) {
                // Not an admin, sign out and redirect
                await auth.signOut();
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            window.location.href = '/login.html';
        }
    });
}
