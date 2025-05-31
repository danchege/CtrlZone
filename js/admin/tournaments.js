import { db, storage } from '../firebase-config.js';
import { 
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    getDocs,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// DOM Elements
const tournamentsGrid = document.getElementById('tournamentsGrid');
const createTournamentBtn = document.getElementById('createTournament');
const createTournamentModal = document.getElementById('createTournamentModal');

// Initialize Tournaments
document.addEventListener('DOMContentLoaded', () => {
    initializeTournaments();
    setupEventListeners();
});

// Initialize Tournaments
async function initializeTournaments() {
    setupTournamentModal();
    await loadTournaments();
    setupRealtimeUpdates();
}

// Setup Tournament Modal
function setupTournamentModal() {
    createTournamentModal.innerHTML = `
        <div class="modal-content">
            <h2>Create Tournament</h2>
            <form id="tournamentForm">
                <div class="form-group">
                    <label>Tournament Name</label>
                    <input type="text" id="tournamentName" required>
                </div>
                <div class="form-group">
                    <label>Game</label>
                    <select id="tournamentGame" required>
                        <option value="">Select Game</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="datetime-local" id="tournamentStart" required>
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="datetime-local" id="tournamentEnd" required>
                </div>
                <div class="form-group">
                    <label>Max Participants</label>
                    <input type="number" id="maxParticipants" min="2" required>
                </div>
                <div class="form-group">
                    <label>Entry Fee</label>
                    <input type="number" id="entryFee" min="0" required>
                </div>
                <div class="form-group">
                    <label>Prize Pool</label>
                    <input type="number" id="prizePool" min="0" required>
                </div>
                <div class="form-group">
                    <label>Tournament Banner</label>
                    <input type="file" id="tournamentBanner" accept="image/*">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="tournamentDescription" required></textarea>
                </div>
                <div class="form-group">
                    <label>Rules</label>
                    <textarea id="tournamentRules" required></textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="action-btn">Create Tournament</button>
                    <button type="button" class="cancel-btn" onclick="closeTournamentModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
}

// Load Tournaments
async function loadTournaments() {
    try {
        const tournamentsQuery = query(
            collection(db, 'tournaments'),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(tournamentsQuery);
        updateTournamentsGrid(snapshot.docs);
    } catch (error) {
        console.error('Error loading tournaments:', error);
        showNotification('Error loading tournaments', 'error');
    }
}

// Update Tournaments Grid
function updateTournamentsGrid(tournaments) {
    tournamentsGrid.innerHTML = '';
    
    tournaments.forEach(doc => {
        const tournament = doc.data();
        const tournamentCard = createTournamentCard(doc.id, tournament);
        tournamentsGrid.appendChild(tournamentCard);
    });
}

// Create Tournament Card
function createTournamentCard(id, tournament) {
    const card = document.createElement('div');
    card.className = 'tournament-card';
    
    const status = getTournamentStatus(tournament.startDate, tournament.endDate);
    const statusClass = `status-${status.toLowerCase()}`;
    
    card.innerHTML = `
        <div class="tournament-banner">
            <img src="${tournament.bannerUrl || '../../images/default-tournament.jpg'}" alt="${tournament.name}">
            <span class="tournament-status ${statusClass}">${status}</span>
        </div>
        <div class="tournament-info">
            <h3>${tournament.name}</h3>
            <p class="tournament-game">${tournament.game}</p>
            <div class="tournament-details">
                <span><i class="fas fa-calendar"></i> ${formatDate(tournament.startDate)}</span>
                <span><i class="fas fa-users"></i> ${tournament.participants?.length || 0}/${tournament.maxParticipants}</span>
                <span><i class="fas fa-trophy"></i> $${tournament.prizePool}</span>
            </div>
        </div>
        <div class="tournament-actions">
            <button onclick="editTournament('${id}')" class="edit-btn">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="deleteTournament('${id}')" class="delete-btn">
                <i class="fas fa-trash"></i> Delete
            </button>
            <button onclick="viewParticipants('${id}')" class="view-btn">
                <i class="fas fa-users"></i> Participants
            </button>
        </div>
    `;
    
    return card;
}

// Get Tournament Status
function getTournamentStatus(startDate, endDate) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 'Upcoming';
    if (now > end) return 'Completed';
    return 'Active';
}

// Create Tournament
async function createTournament(formData) {
    try {
        const bannerFile = formData.get('banner');
        let bannerUrl = '';
        
        if (bannerFile) {
            bannerUrl = await uploadTournamentBanner(bannerFile);
        }
        
        const tournamentData = {
            name: formData.get('name'),
            game: formData.get('game'),
            startDate: new Date(formData.get('startDate')),
            endDate: new Date(formData.get('endDate')),
            maxParticipants: parseInt(formData.get('maxParticipants')),
            entryFee: parseFloat(formData.get('entryFee')),
            prizePool: parseFloat(formData.get('prizePool')),
            description: formData.get('description'),
            rules: formData.get('rules'),
            bannerUrl,
            participants: [],
            status: 'upcoming',
            createdAt: new Date(),
            matches: []
        };
        
        await addDoc(collection(db, 'tournaments'), tournamentData);
        showNotification('Tournament created successfully', 'success');
        closeTournamentModal();
    } catch (error) {
        console.error('Error creating tournament:', error);
        showNotification('Error creating tournament', 'error');
    }
}

// Upload Tournament Banner
async function uploadTournamentBanner(file) {
    try {
        const storageRef = ref(storage, `tournament-banners/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error('Error uploading banner:', error);
        throw error;
    }
}

// Edit Tournament
async function editTournament(id) {
    try {
        const tournamentDoc = await getDoc(doc(db, 'tournaments', id));
        const tournament = tournamentDoc.data();
        
        // Populate modal with tournament data
        document.getElementById('tournamentName').value = tournament.name;
        document.getElementById('tournamentGame').value = tournament.game;
        document.getElementById('tournamentStart').value = formatDateForInput(tournament.startDate);
        document.getElementById('tournamentEnd').value = formatDateForInput(tournament.endDate);
        document.getElementById('maxParticipants').value = tournament.maxParticipants;
        document.getElementById('entryFee').value = tournament.entryFee;
        document.getElementById('prizePool').value = tournament.prizePool;
        document.getElementById('tournamentDescription').value = tournament.description;
        document.getElementById('tournamentRules').value = tournament.rules;
        
        // Show modal
        createTournamentModal.style.display = 'block';
        
        // Update form submission handler
        document.getElementById('tournamentForm').onsubmit = (e) => {
            e.preventDefault();
            updateTournament(id, new FormData(e.target));
        };
    } catch (error) {
        console.error('Error loading tournament:', error);
        showNotification('Error loading tournament', 'error');
    }
}

// Update Tournament
async function updateTournament(id, formData) {
    try {
        const tournamentRef = doc(db, 'tournaments', id);
        const bannerFile = formData.get('banner');
        let bannerUrl = '';
        
        if (bannerFile) {
            bannerUrl = await uploadTournamentBanner(bannerFile);
        }
        
        const updateData = {
            name: formData.get('name'),
            game: formData.get('game'),
            startDate: new Date(formData.get('startDate')),
            endDate: new Date(formData.get('endDate')),
            maxParticipants: parseInt(formData.get('maxParticipants')),
            entryFee: parseFloat(formData.get('entryFee')),
            prizePool: parseFloat(formData.get('prizePool')),
            description: formData.get('description'),
            rules: formData.get('rules'),
            updatedAt: new Date()
        };
        
        if (bannerUrl) {
            updateData.bannerUrl = bannerUrl;
        }
        
        await updateDoc(tournamentRef, updateData);
        showNotification('Tournament updated successfully', 'success');
        closeTournamentModal();
    } catch (error) {
        console.error('Error updating tournament:', error);
        showNotification('Error updating tournament', 'error');
    }
}

// Delete Tournament
async function deleteTournament(id) {
    if (confirm('Are you sure you want to delete this tournament?')) {
        try {
            await deleteDoc(doc(db, 'tournaments', id));
            showNotification('Tournament deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting tournament:', error);
            showNotification('Error deleting tournament', 'error');
        }
    }
}

// View Participants
function viewParticipants(id) {
    // Implementation for viewing participants
    // This could open a modal showing the list of participants
    console.log('View participants for tournament:', id);
}

// Setup Event Listeners
function setupEventListeners() {
    createTournamentBtn.addEventListener('click', () => {
        createTournamentModal.style.display = 'block';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === createTournamentModal) {
            closeTournamentModal();
        }
    });
    
    document.getElementById('tournamentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        createTournament(new FormData(e.target));
    });
}

// Setup Realtime Updates
function setupRealtimeUpdates() {
    const tournamentsQuery = query(
        collection(db, 'tournaments'),
        orderBy('createdAt', 'desc')
    );
    
    onSnapshot(tournamentsQuery, (snapshot) => {
        updateTournamentsGrid(snapshot.docs);
    });
}

// Helper Functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateForInput(date) {
    return new Date(date).toISOString().slice(0, 16);
}

function showNotification(message, type) {
    // Implementation for showing notifications
    console.log(`${type}: ${message}`);
}

function closeTournamentModal() {
    createTournamentModal.style.display = 'none';
    document.getElementById('tournamentForm').reset();
}

// Export functions for use in other modules
export {
    createTournament,
    editTournament,
    deleteTournament,
    viewParticipants
}; 