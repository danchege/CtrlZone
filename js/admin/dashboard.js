// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, onSnapshot, orderBy, limit, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Import admin modules
import { TournamentManager } from './modules/tournaments.js';
import { BookingManager } from './modules/bookings.js';
import { GameManager } from './modules/games.js';
import { MessageManager } from './modules/messages.js';
import { SettingsManager } from './modules/settings.js';
import { PresenceManager } from './modules/presence.js';
import { UserManager } from './modules/users.js';

// Import chart initialization
import { initializeRevenueChart, initializeGamesChart } from './charts.js';

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

// Initialize Firebase with unique app name
const adminApp = initializeApp(firebaseConfig, 'admin-dashboard-app');
const auth = getAuth(adminApp);
const db = getFirestore(adminApp);
const storage = getStorage(adminApp);

// Make Firebase instances available globally
window.adminApp = adminApp;
window.adminAuth = auth;
window.adminDb = db;
window.adminStorage = storage;

// Make admin module classes available globally
window.TournamentManager = TournamentManager;
window.BookingManager = BookingManager;
window.GameManager = GameManager;
window.MessageManager = MessageManager;
window.SettingsManager = SettingsManager;
window.PresenceManager = PresenceManager;
window.UserManager = UserManager;

// Initialize admin modules
export function initializeModules() {
    try {
        // Initialize only the modules needed for the current section
        const currentSection = document.querySelector('.admin-section.active');
        const sectionId = currentSection ? currentSection.id : 'overviewSection';

        // Always initialize presence manager for online status tracking
        window.presenceManager = new PresenceManager(adminApp);

        // Initialize modules based on section
        switch (sectionId) {
            case 'usersSection':
                window.userManager = new UserManager(adminApp);
                break;
            case 'bookingsSection':
                window.bookingManager = new BookingManager(adminApp);
                break;
            case 'tournamentsSection':
                window.tournamentManager = new TournamentManager(adminApp);
                break;
            case 'gamesSection':
                window.gameManager = new GameManager(adminApp);
                break;
            case 'messagesSection':
                window.messageManager = new MessageManager(adminApp);
                break;
            case 'settingsSection':
                window.settingsManager = new SettingsManager(adminApp);
                break;
            case 'overviewSection':
                // Initialize charts
                initializeRevenueChart();
                initializeGamesChart();
                break;
        }

        console.log('Modules initialized for section:', sectionId);
    } catch (error) {
        console.error('Error initializing modules:', error);
    }
}

// Initialize admin auth
function initializeAuth() {
    onAuthStateChanged(window.adminAuth, async (user) => {
        if (user) {
            // Check if user is admin
            const userDoc = await getDoc(doc(window.adminDb, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().isAdmin) {
                // Store auth info
                localStorage.setItem('adminAuth', JSON.stringify({
                    uid: user.uid,
                    timestamp: new Date().getTime()
                }));

                // Show dashboard
                document.getElementById('adminLogin').style.display = 'none';
                document.getElementById('dashboard').style.display = 'grid';
                initializeModules();
                initializeEventListeners();
                showSection('overviewSection');
                setupRealtimeListeners();
                fetchDashboardStats();
                hideLoadingScreen();
                return;
            }
        }

        // Not authenticated or not admin
        localStorage.removeItem('adminAuth');
        document.getElementById('adminLogin').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
        hideLoadingScreen();
    });
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        startLoadingAnimation();
        const userCredential = await signInWithEmailAndPassword(window.adminAuth, email, password);
        const user = userCredential.user;

        // Check if user is admin
        const userDoc = await getDoc(doc(window.adminDb, 'users', user.uid));
        if (!userDoc.exists() || !userDoc.data().isAdmin) {
            throw new Error('Access denied. Admin privileges required.');
        }

        // Store admin auth state
        const adminAuth = {
            uid: user.uid,
            email: user.email,
            timestamp: new Date().getTime()
        };
        localStorage.setItem('adminAuth', JSON.stringify(adminAuth));

        // Show dashboard
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('dashboard').style.display = 'grid';
        initializeModules();

    } catch (error) {
        console.error('Login error:', error);
        hideLoadingScreen();
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: error.message
        });
    }
});

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});

// DOM Elements
const loadingScreen = document.querySelector('.loading-screen');
const adminName = document.getElementById('adminName');
const adminAvatar = document.getElementById('adminAvatar');
const totalUsers = document.getElementById('totalUsers');
const activeSessions = document.getElementById('activeSessions');
const activeTournaments = document.getElementById('activeTournaments');
const todayBookings = document.getElementById('todayBookings');
const activityFeed = document.getElementById('activityFeed');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize Dashboard
function startLoadingAnimation() {
    loadingScreen.classList.add('active');
}

function hideLoadingScreen() {
    loadingScreen.classList.remove('active');
}

// Authentication Check
async function getUserData(userId) {
    try {
        const userRef = collection(db, 'users');
        const q = query(userRef, where('uid', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs[0]?.data();
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Setup Dashboard
async function setupDashboard(user, userData) {
    updateAdminProfile(user, userData);
    await fetchDashboardStats();
    setupRealtimeListeners();
    hideLoadingScreen();
}

// Update Admin Profile
function updateAdminProfile(user, userData) {
    adminName.textContent = userData.username || user.email;
    if (userData.photoURL) {
        adminAvatar.src = userData.photoURL;
    }
}

// Fetch Dashboard Statistics
async function fetchDashboardStats() {
    try {
        // Fetch total users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        totalUsers.textContent = usersSnapshot.size;

        // Fetch active sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessionsQuery = query(
            collection(db, 'gameSessions'),
            where('status', '==', 'active')
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);
        activeSessions.textContent = sessionsSnapshot.size;

        // Fetch active tournaments
        const tournamentsQuery = query(
            collection(db, 'tournaments'),
            where('status', '==', 'active')
        );
        const tournamentsSnapshot = await getDocs(tournamentsQuery);
        activeTournaments.textContent = tournamentsSnapshot.size;

        // Fetch today's bookings
        const bookingsQuery = query(
            collection(db, 'bookings'),
            where('date', '>=', today)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        todayBookings.textContent = bookingsSnapshot.size;

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}



// Setup Realtime Listeners
function setupRealtimeListeners() {
    // Listen for new bookings
    const bookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc'),
        limit(10)
    );
    
    onSnapshot(bookingsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                addActivityItem('booking', change.doc.data());
                // Refresh stats when new booking is added
                fetchDashboardStats();
            }
        });
    });

    // Listen for new tournaments
    const tournamentsQuery = query(
        collection(db, 'tournaments'),
        orderBy('createdAt', 'desc'),
        limit(10)
    );

    onSnapshot(tournamentsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                addActivityItem('tournament', change.doc.data());
                // Refresh stats when new tournament is added
                fetchDashboardStats();
            }
        });
    });

    // Listen for user presence changes
    const usersQuery = query(
        collection(db, 'users'),
        where('lastSeen', '>=', new Date(Date.now() - 5 * 60 * 1000))
    );

    onSnapshot(usersQuery, (snapshot) => {
        document.getElementById('activeSessions').textContent = snapshot.size;
    });
}

// Add Activity Item
function addActivityItem(type, data) {
    const item = document.createElement('div');
    item.className = 'activity-item fade-in';
    
    let icon, text;
    switch(type) {
        case 'booking':
            icon = 'calendar-check';
            text = `New booking by ${data.userName}`;
            break;
        case 'tournament':
            icon = 'trophy';
            text = `New tournament: ${data.name}`;
            break;
        default:
            return;
    }

    item.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${text}</span>
        <small>${formatTimestamp(data.createdAt)}</small>
    `;

    activityFeed.insertBefore(item, activityFeed.firstChild);
}

// Helper Functions
function getLastSevenDays() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return days;
}

function formatTimestamp(timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}

// Event Listeners
function initializeEventListeners() {
    // Toggle Sidebar
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.admin-nav').classList.toggle('active');
        });
    }

    // Navigation
    document.querySelectorAll('.nav-links .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await window.adminAuth.signOut();
                localStorage.removeItem('adminAuth');
                document.getElementById('adminLogin').style.display = 'flex';
                document.getElementById('dashboard').style.display = 'none';
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }
}

// Show Section
function showSection(sectionId) {
    try {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');

        // Initialize modules for this section
        switch (sectionId) {
            case 'usersSection':
                if (!window.userManager) {
                    console.log('Initializing UserManager...');
                    window.userManager = new UserManager(adminApp);
                }
                window.userManager.refreshUserList();
                break;

            case 'bookingsSection':
                if (!window.bookingManager) {
                    console.log('Initializing BookingManager...');
                    window.bookingManager = new BookingManager(adminApp);
                }
                window.bookingManager.refreshBookings();
                break;

            case 'tournamentsSection':
                if (!window.tournamentManager) {
                    console.log('Initializing TournamentManager...');
                    window.tournamentManager = new TournamentManager(adminApp);
                }
                window.tournamentManager.refreshTournaments();
                break;

            case 'gamesSection':
                if (!window.gameManager) {
                    console.log('Initializing GameManager...');
                    window.gameManager = new GameManager(adminApp);
                }
                window.gameManager.refreshGames();
                break;

            case 'messagesSection':
                if (!window.messageManager) {
                    console.log('Initializing MessageManager...');
                    window.messageManager = new MessageManager(adminApp);
                }
                window.messageManager.refreshMessages();
                break;

            case 'settingsSection':
                if (!window.settingsManager) {
                    console.log('Initializing SettingsManager...');
                    window.settingsManager = new SettingsManager(adminApp);
                }
                window.settingsManager.loadSettings();
                break;

            case 'overviewSection':
                // Initialize charts if not already done
                if (!window.revenueChart || !window.gamesChart) {
                    initializeRevenueChart();
                    initializeGamesChart();
                }
                fetchDashboardStats();
                break;
        }
    } catch (error) {
        console.error('Error showing section:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load section. Please try again.'
        });
    }
}
