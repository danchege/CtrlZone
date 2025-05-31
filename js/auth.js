import { auth, db, firebaseConfig } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Authentication state observer
export function initAuth() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.no-auth').forEach(el => el.style.display = 'none');
            updateUIWithUserInfo(user);
        } else {
            // User is signed out
            document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.no-auth').forEach(el => el.style.display = 'block');
            updateUIForLoggedOut();
        }
    });
}

// Register new user
export async function registerUser(email, password, username) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            username: username,
            email: email,
            createdAt: new Date().toISOString(),
            gamesPlayed: 0,
            tournamentsParticipated: 0
        });

        return user;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

// Login user
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

// Google Sign-in
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user profile exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            // Create new user profile
            await setDoc(doc(db, 'users', user.uid), {
                username: user.displayName,
                email: user.email,
                createdAt: new Date().toISOString(),
                gamesPlayed: 0,
                tournamentsParticipated: 0
            });
        }

        return user;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
}

// Logout user
export async function logoutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error logging out:', error);
        throw error;
    }
}

// Update UI with user info
function updateUIWithUserInfo(user) {
    const userDisplayElements = document.querySelectorAll('.user-display');
    userDisplayElements.forEach(element => {
        element.textContent = user.email;
    });
}

// Update UI for logged out state
function updateUIForLoggedOut() {
    const userDisplayElements = document.querySelectorAll('.user-display');
    userDisplayElements.forEach(element => {
        element.textContent = '';
    });
}

// Notification Functions
function showNotification(message) {
    const notification = document.getElementById('authNotification');
    const messageSpan = notification.querySelector('.message');
    messageSpan.textContent = message;
    notification.classList.add('show');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Handle successful authentication
function handleAuthSuccess(user, isNewUser = false) {
    const message = isNewUser 
        ? "Registration successful! Welcome to CtrlZone!" 
        : "Login successful! Welcome back!";
    
    showNotification(message);
    
    // Redirect to dashboard after 1 second
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            handleAuthSuccess(userCredential.user);
        } catch (error) {
            console.error(error);
            showNotification(error.message);
        }
    });
}

// Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const username = document.getElementById('username').value;

        if (password !== confirmPassword) {
            showNotification("Passwords don't match!");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Create user profile in Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                username: username,
                email: email,
                createdAt: new Date().toISOString(),
                gamesPlayed: 0,
                tournamentsParticipated: 0
            });
            handleAuthSuccess(userCredential.user, true);
        } catch (error) {
            console.error(error);
            showNotification(error.message);
        }
    });
}

// Google Authentication
const googleLoginBtn = document.getElementById('googleLogin');
const googleRegisterBtn = document.getElementById('googleRegister');

[googleLoginBtn, googleRegisterBtn].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', async () => {
            try {
                const result = await signInWithPopup(auth, googleProvider);
                handleAuthSuccess(result.user);
            } catch (error) {
                console.error(error);
                showNotification(error.message);
            }
        });
    }
}); 