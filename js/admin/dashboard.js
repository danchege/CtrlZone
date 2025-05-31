import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    onSnapshot,
    orderBy,
    limit 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeCharts();
    initializeEventListeners();
    startLoadingAnimation();
});

// Authentication Check
function initializeAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getUserData(user.uid);
            if (userDoc && userDoc.isAdmin) {
                setupDashboard(user, userDoc);
            } else {
                window.location.href = '/'; // Redirect non-admin users
            }
        } else {
            window.location.href = '/login.html';
        }
    });
}

// Get User Data
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

// Initialize Charts
function initializeCharts() {
    initializeRevenueChart();
    initializeGamesChart();
}

// Revenue Chart
function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: getLastSevenDays(),
            datasets: [{
                label: 'Revenue',
                data: [0, 0, 0, 0, 0, 0, 0], // Will be updated with real data
                borderColor: '#00ff9d',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0, 255, 157, 0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e1e1e1'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e1e1e1'
                    }
                }
            }
        }
    });
}

// Games Chart
function initializeGamesChart() {
    const ctx = document.getElementById('gamesChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'],
            datasets: [{
                data: [0, 0, 0, 0, 0], // Will be updated with real data
                backgroundColor: [
                    '#00ff9d',
                    '#00c3ff',
                    '#ff00ff',
                    '#ffa502',
                    '#ff4757'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#e1e1e1'
                    }
                }
            }
        }
    });
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
            }
        });
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
    toggleSidebarBtn.addEventListener('click', () => {
        document.querySelector('.admin-nav').classList.toggle('active');
    });

    // Navigation
    document.querySelectorAll('.admin-nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.closest('a').dataset.section;
            showSection(section);
        });
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });
}

// Show Section
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.admin-nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
}

// Loading Animation
function startLoadingAnimation() {
    const loadingBar = document.querySelector('.loading-bar');
    loadingBar.style.width = '100%';
}

function hideLoadingScreen() {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
} 