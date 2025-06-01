import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Initialize admin auth
export function initAdminAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Check if user is an admin
            const isAdmin = await checkAdminStatus(user.uid);
            if (!isAdmin) {
                // If not admin, sign out and redirect
                await signOut(auth);
                window.location.href = '/login.html';
                return;
            }
            updateAdminUI(user);
        } else {
            // Redirect to login if not in login page
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = '/login.html';
            }
        }
    });
}

// Check if user is an admin
async function checkAdminStatus(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data().isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Create admin account
export async function createAdminAccount(email, password, username) {
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Set up admin profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            username: username,
            email: email,
            isAdmin: true,
            role: 'admin',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });

        return user;
    } catch (error) {
        console.error('Error creating admin account:', error);
        throw error;
    }
}

// Admin login
export async function loginAdmin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Verify admin status
        const isAdmin = await checkAdminStatus(user.uid);
        if (!isAdmin) {
            await signOut(auth);
            throw new Error('Access denied. This account does not have admin privileges.');
        }
        
        // Update last login
        await setDoc(doc(db, 'users', user.uid), {
            lastLogin: new Date().toISOString()
        }, { merge: true });

        return user;
    } catch (error) {
        console.error('Error logging in admin:', error);
        throw error;
    }
}

// Admin logout
export async function logoutAdmin() {
    try {
        await signOut(auth);
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Error logging out admin:', error);
        throw error;
    }
}

// Update admin UI
function updateAdminUI(user) {
    const adminName = document.getElementById('adminName');
    if (adminName) {
        adminName.textContent = user.email;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminAuth);
