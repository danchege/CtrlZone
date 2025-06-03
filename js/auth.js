import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Initialize Google Provider with mobile optimization
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Authentication state observer
export function initAuth() {
    // Skip auth check if flag is set
    if (window.skipAuthCheck) {
        console.log('Skipping auth check for admin setup');
        return;
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user.email);
            updateUIWithUserInfo(user);
        } else {
            // User is signed out
            console.log('User is signed out');
            updateUIForLoggedOut();
        }
    });
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    // Secret admin access through logo clicks
    const logoText = document.getElementById('logoText');
    let clickCount = 0;
    let lastClickTime = 0;

    if (logoText) {
        logoText.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTime = new Date().getTime();

            // Reset click count if more than 2 seconds between clicks
            if (currentTime - lastClickTime > 2000) {
                clickCount = 0;
            }

            clickCount++;
            lastClickTime = currentTime;

            // Show admin access form after 3 rapid clicks
            if (clickCount === 3) {
                const adminAccess = document.getElementById('adminAccess');
                if (adminAccess) {
                    adminAccess.style.display = 'block';
                    clickCount = 0;
                }
            }
        });
    }

    // Handle admin access form
    const adminAccessForm = document.getElementById('adminAccessForm');
    if (adminAccessForm) {
        adminAccessForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const adminKey = document.getElementById('adminKey').value;

            // Check admin key
            if (adminKey === 'CtrlZone2025@Admin') {
                window.location.href = 'admin/secure-login.html';
            } else {
                // Wrong key - hide the form
                document.getElementById('adminAccess').style.display = 'none';
            }
        });
    }
});

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
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log('Device type:', isMobile ? 'mobile' : 'desktop');
        
        let result;
        if (isMobile) {
            // Use redirect method for mobile
            await signInWithRedirect(auth, googleProvider);
            // Note: The page will reload after redirect
        } else {
            // Use popup for desktop
            result = await signInWithPopup(auth, googleProvider);
            if (result) {
                const user = result.user;
                // Handle desktop login success
                try {
                    // Check if user profile exists
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (!userDoc.exists()) {
                        await setDoc(doc(db, 'users', user.uid), {
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            createdAt: new Date().toISOString(),
                            gamesPlayed: 0,
                            tournamentsParticipated: 0
                        });
                    }
                    handleAuthSuccess(user);
                } catch (error) {
                    console.error('Error handling user profile:', error);
                    showNotification('Error creating user profile', true);
                }
            }
        }
    } catch (error) {
        console.error('Error signing in with Google:', error);
        showNotification(error.message, true);
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

// Show loading state
function showLoading(button) {
    if (!button) return;
    const btnText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.loading-spinner');
    if (btnText && spinner) {
        button.disabled = true;
        btnText.style.opacity = '0';
        spinner.style.display = 'block';
    } else {
        // Fallback for buttons without spinner structure
        button.disabled = true;
        button.style.opacity = '0.7';
    }
}

// Hide loading state
function hideLoading(button, originalText) {
    if (!button) return;
    const btnText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.loading-spinner');
    if (btnText && spinner) {
        button.disabled = false;
        btnText.style.opacity = '1';
        btnText.textContent = originalText;
        spinner.style.display = 'none';
    } else {
        // Fallback for buttons without spinner structure
        button.disabled = false;
        button.style.opacity = '1';
    }
}

// Show notification
function showNotification(message, isError = false) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    container.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Handle successful authentication
function handleAuthSuccess(user) {
    showNotification('Login successful! Redirecting...');
    
    // Update UI immediately
    const authCheckOverlay = document.getElementById('authCheckOverlay');
    const mainContent = document.getElementById('mainContent');
    if (authCheckOverlay) authCheckOverlay.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    
    // Force redirect to index.html after a short delay
    setTimeout(() => {
        window.location.replace('/index.html');
    }, 1500);
}

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        try {
            showLoading(submitBtn);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful:', userCredential.user.email);
            showNotification('Login successful! Redirecting...');
            
            // Force redirect to index.html
            setTimeout(() => {
                window.location.replace('/index.html');
            }, 1500);
        } catch (error) {
            console.error('Login error:', error);
            showNotification(error.message, true);
        } finally {
            hideLoading(submitBtn, 'Login');
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
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        if (password !== confirmPassword) {
            showNotification("Passwords don't match!", true);
            return;
        }

        try {
            showLoading(submitBtn);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create user profile
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: email,
                createdAt: new Date().toISOString(),
                gamesPlayed: 0,
                tournamentsParticipated: 0
            });

            console.log('Registration successful:', userCredential.user.email);
            showNotification('Registration successful! Redirecting...');
            
            // Force redirect to index.html
            setTimeout(() => {
                window.location.replace('/index.html');
            }, 1500);
        } catch (error) {
            console.error('Registration error:', error);
            showNotification(error.message, true);
        } finally {
            hideLoading(submitBtn, 'Register');
        }
    });
}

// Google Sign In
async function handleGoogleSignIn(button) {
    if (!button) return;
    
    try {
        showLoading(button);
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        await handleAuthSuccess(user);
    } catch (error) {
        console.error('Google sign in error:', error);
        showNotification(error.message, true);
    } finally {
        hideLoading(button, button.textContent || 'Continue with Google');
    }
}

// Google Authentication Buttons
const googleLoginBtn = document.getElementById('googleLogin');
const googleRegisterBtn = document.getElementById('googleRegister');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => handleGoogleSignIn(googleLoginBtn));
}

if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', () => handleGoogleSignIn(googleRegisterBtn));
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            showNotification(error.message, true);
        }
    });
}

// Forgot Password
const forgotPasswordLink = document.getElementById('forgotPassword');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        if (!email) {
            alert('Please enter your email address first.');
            return;
        }
        // Implement password reset functionality here
        alert('Password reset functionality coming soon!');
    });
}

// Update the redirect result handler
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check for redirect result on page load
        const result = await getRedirectResult(auth);
        if (result) {
            const user = result.user;
            console.log('Redirect result received:', user.email);
            
            try {
                // Check if user profile exists
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (!userDoc.exists()) {
                    // Create user profile
                    await setDoc(doc(db, 'users', user.uid), {
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        createdAt: new Date().toISOString(),
                        gamesPlayed: 0,
                        tournamentsParticipated: 0
                    });
                    console.log('Created new user profile');
                }

                // Handle successful authentication
                handleAuthSuccess(user);

            } catch (error) {
                console.error('Error handling user profile:', error);
                showNotification('Error creating user profile', true);
            }
        }
    } catch (error) {
        console.error('Redirect result error:', error);
        showNotification(error.message, true);
    }
}); 