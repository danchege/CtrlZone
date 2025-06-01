import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// List of pages that require authentication
const protectedPages = [
    'tournaments.html',
    'profile.html',
    'dashboard.html',
    'games.html',
    'services.html',
    'booking.html'
];

// List of authentication pages
const authPages = [
    'login.html',
    'register.html'
];

// Get current page name from path
function getCurrentPage() {
    const path = window.location.pathname;
    // Get the last part of the path and convert to lowercase
    const pageName = path.split('/').pop() || 'index.html';
    return pageName.toLowerCase();
}

// Check if current page requires auth
function requiresAuth(pageName) {
    return protectedPages.includes(pageName);
}

// Check if current page is an auth page
function isAuthPage(pageName) {
    return authPages.includes(pageName);
}

// Initialize auth guard
function initAuthGuard() {
    const currentPage = getCurrentPage();
    console.log('Current page:', currentPage);
    
    // No need to hide main content initially for non-protected pages
    if (requiresAuth(currentPage)) {
        const mainContent = document.querySelector('.main-wrapper');
        if (mainContent) mainContent.style.display = 'none';
    }
    
    onAuthStateChanged(auth, (user) => {
        console.log('Auth guard state changed. User:', user ? user.email : 'not logged in');
        
        const authCheckOverlay = document.getElementById('authCheckOverlay');
        const mainContent = document.querySelector('.main-wrapper');
        
        if (user) {
            // User is logged in
            if (isAuthPage(currentPage)) {
                // If on login/register page, redirect to index
                console.log('Redirecting to index from auth page');
                window.location.replace('/index.html');
                return;
            }
            
            // For all pages when logged in
            if (authCheckOverlay) {
                authCheckOverlay.style.display = 'none';
                console.log('Auth overlay hidden');
            }
            if (mainContent) {
                mainContent.style.display = 'block';
                console.log('Main content shown');
            }
            
            // Update auth-dependent UI elements
            document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.no-auth').forEach(el => el.style.display = 'none');
            
        } else {
            // User is not logged in
            if (requiresAuth(currentPage)) {
                // If on protected page, show auth overlay and hide content
                if (authCheckOverlay) {
                    authCheckOverlay.style.display = 'flex';
                    console.log('Auth overlay shown');
                }
                if (mainContent) {
                    mainContent.style.display = 'none';
                    console.log('Main content hidden');
                }
                
                // Update auth-dependent UI elements
                document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.no-auth').forEach(el => el.style.display = 'block');
            }
        }
    });
}

// Initialize auth guard when the DOM is loaded
document.addEventListener('DOMContentLoaded', initAuthGuard); 