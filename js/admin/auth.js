import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { initializeModules } from './dashboard.js';

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

// Initialize Firebase with a unique name
const adminApp = initializeApp(firebaseConfig, 'admin-dashboard-app');
const auth = getAuth(adminApp);
const db = getFirestore(adminApp);

// Set admin claim if user is admin
async function setAdminClaim(user) {
    if (!user) return;
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin) {
            await user.getIdTokenResult(true); // Force refresh token
            const token = await user.getIdToken(true); // Get fresh token
            // Store the admin claim locally
            localStorage.setItem('adminClaim', JSON.stringify({ 
                token,
                admin: true,
                timestamp: new Date().getTime()
            }));
        }
    } catch (error) {
        console.error('Error setting admin claim:', error);
    }
}

// Check admin status
export async function checkAdminStatus(user) {
    if (!user) return false;
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        return userDoc.exists() && userDoc.data().isAdmin;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Initialize auth for admin pages
export function initAdminAuth() {
    // First check stored admin auth
    const storedAuth = localStorage.getItem('adminAuth');
    if (!storedAuth) {
        window.location.href = '/admin/secure-login.html';
        return;
    }

    const adminAuth = JSON.parse(storedAuth);
    const now = new Date().getTime();
    const authAge = now - adminAuth.timestamp;

    // If auth is older than 24 hours, clear it and redirect
    if (authAge > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('adminAuth');
        window.location.href = '/admin/secure-login.html';
        return;
    }

    // Now check Firebase auth state
    onAuthStateChanged(auth, async (user) => {
        if (!user || user.uid !== adminAuth.uid) {
            // No matching user is signed in
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminClaim');
            window.location.href = '/admin/secure-login.html';
            return;
        }

        // Check if user is still admin
        const isAdmin = await checkAdminStatus(user);
        if (!isAdmin) {
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminClaim');
            await auth.signOut();
            window.location.href = '/admin/secure-login.html';
            return;
        }

        // Set admin claim
        await setAdminClaim(user);

        // Update timestamp to keep session alive
        adminAuth.timestamp = now;
        localStorage.setItem('adminAuth', JSON.stringify(adminAuth));

        // User is admin, update UI
        const header = document.querySelector('.admin-nav-header h2');
        if (header) {
            header.textContent = `Welcome, ${user.email}`;
        }

        // Initialize modules after admin status is confirmed
        initializeModules();
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminAuth);
