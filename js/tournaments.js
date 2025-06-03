import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, query, getDocs, orderBy, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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
const db = getFirestore(app);

// Get tournament status
function getTournamentStatus(tournament) {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);

    if (now < startDate) {
        return {
            label: 'Upcoming',
            class: 'upcoming'
        };
    } else if (now >= startDate && now <= endDate) {
        return {
            label: 'In Progress',
            class: 'in-progress'
        };
    } else {
        return {
            label: 'Completed',
            class: 'completed'
        };
    }
}

// Format date
function formatDate(dateString) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Load tournaments
async function loadTournaments() {
    try {
        const tournamentGrid = document.querySelector('.tournament-grid');
        if (!tournamentGrid) {
            console.error('Tournament grid not found');
            return;
        }

        // Clear existing tournaments
        tournamentGrid.innerHTML = '<div class="loading">Loading tournaments...</div>';

        // Get tournaments from Firestore
        const q = query(
            collection(db, 'tournaments'),
            where('endDate', '>=', new Date().toISOString()), // Only future and ongoing tournaments
            orderBy('endDate', 'asc')
        );
        
        const snapshot = await getDocs(q);
        const tournaments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (tournaments.length === 0) {
            tournamentGrid.innerHTML = `
                <div class="no-tournaments">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Upcoming Tournaments</h3>
                    <p>Check back later for new tournaments!</p>
                </div>
            `;
            return;
        }

        // Clear loading message
        tournamentGrid.innerHTML = '';

        // Render each tournament
        tournaments.forEach(tournament => {
            const status = getTournamentStatus(tournament);
            const card = document.createElement('div');
            card.className = 'tournament-card';
            card.setAttribute('data-aos', 'zoom-in');
            card.setAttribute('data-aos-delay', '100');

            card.innerHTML = `
                <div class="tournament-header">
                    <div class="tournament-game">
                        <i class="fas fa-gamepad"></i>
                        ${tournament.game}
                    </div>
                    <div class="tournament-status ${status.class}">
                        ${status.label}
                    </div>
                </div>
                <div class="tournament-info">
                    <h3>${tournament.name}</h3>
                    <div class="tournament-details">
                        <p><i class="fas fa-calendar"></i> Starts: ${formatDate(tournament.startDate)}</p>
                        <p><i class="fas fa-hourglass-end"></i> Ends: ${formatDate(tournament.endDate)}</p>
                        <p><i class="fas fa-trophy"></i> Prize Pool: $${tournament.prizePool}</p>
                        <p><i class="fas fa-users"></i> Slots: ${tournament.participants?.length || 0}/${tournament.maxParticipants}</p>
                    </div>
                    ${tournament.description ? `
                        <div class="tournament-description">
                            <p>${tournament.description}</p>
                        </div>
                    ` : ''}
                    ${tournament.rules ? `
                        <div class="tournament-rules">
                            <h4>Rules:</h4>
                            <p>${tournament.rules}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="tournament-actions">
                    ${tournament.participants?.length >= tournament.maxParticipants ? `
                        <button class="register-btn full" disabled>Tournament Full</button>
                    ` : `
                        <button class="register-btn" onclick="showRegistrationForm('${tournament.id}')">Register Now</button>
                    `}
                </div>
            `;

            tournamentGrid.appendChild(card);
        });

        // Initialize AOS for new elements
        AOS.refresh();

    } catch (error) {
        console.error('Error loading tournaments:', error);
        const tournamentGrid = document.querySelector('.tournament-grid');
        if (tournamentGrid) {
            tournamentGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error Loading Tournaments</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }
}

// Show registration form
function showRegistrationForm(tournamentId) {
    // Scroll to registration form
    const form = document.getElementById('tournamentForm');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
        // Store tournament ID
        document.getElementById('slotNumber').value = tournamentId;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadTournaments();
});
