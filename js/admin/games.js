import { db, storage } from '../firebase-config.js';
import { 
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    getDocs,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// DOM Elements
const gamesGrid = document.getElementById('gamesGrid');
const addGameBtn = document.getElementById('addGame');
const addGameModal = document.getElementById('addGameModal');

// Initialize Games
document.addEventListener('DOMContentLoaded', () => {
    initializeGames();
    setupEventListeners();
});

// Initialize Games
async function initializeGames() {
    setupGameModal();
    await loadGames();
    setupRealtimeUpdates();
}

// Setup Game Modal
function setupGameModal() {
    addGameModal.innerHTML = `
        <div class="modal-content">
            <h2>Add New Game</h2>
            <form id="gameForm">
                <div class="form-group">
                    <label>Game Title</label>
                    <input type="text" id="gameTitle" required>
                </div>
                <div class="form-group">
                    <label>Genre</label>
                    <select id="gameGenre" required>
                        <option value="">Select Genre</option>
                        <option value="action">Action</option>
                        <option value="adventure">Adventure</option>
                        <option value="rpg">RPG</option>
                        <option value="strategy">Strategy</option>
                        <option value="sports">Sports</option>
                        <option value="racing">Racing</option>
                        <option value="fighting">Fighting</option>
                        <option value="shooter">Shooter</option>
                        <option value="puzzle">Puzzle</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Platform</label>
                    <select id="gamePlatform" required>
                        <option value="">Select Platform</option>
                        <option value="pc">PC</option>
                        <option value="ps5">PlayStation 5</option>
                        <option value="ps4">PlayStation 4</option>
                        <option value="xbox">Xbox Series X/S</option>
                        <option value="switch">Nintendo Switch</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Release Year</label>
                    <input type="number" id="releaseYear" min="1970" max="2030" required>
                </div>
                <div class="form-group">
                    <label>Game Cover</label>
                    <input type="file" id="gameCover" accept="image/*">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="gameDescription" required></textarea>
                </div>
                <div class="form-group">
                    <label>Price per Hour</label>
                    <input type="number" id="pricePerHour" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Maximum Players</label>
                    <input type="number" id="maxPlayers" min="1" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="gameStatus" required>
                        <option value="available">Available</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="unavailable">Unavailable</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="action-btn">Add Game</button>
                    <button type="button" class="cancel-btn" onclick="closeGameModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
}

// Load Games
async function loadGames() {
    try {
        const gamesQuery = query(
            collection(db, 'games'),
            orderBy('title', 'asc')
        );
        
        const snapshot = await getDocs(gamesQuery);
        updateGamesGrid(snapshot.docs);
    } catch (error) {
        console.error('Error loading games:', error);
        showNotification('Error loading games', 'error');
    }
}

// Update Games Grid
function updateGamesGrid(games) {
    gamesGrid.innerHTML = '';
    
    games.forEach(doc => {
        const game = doc.data();
        const gameCard = createGameCard(doc.id, game);
        gamesGrid.appendChild(gameCard);
    });
}

// Create Game Card
function createGameCard(id, game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    const statusClass = `status-${game.status.toLowerCase()}`;
    
    card.innerHTML = `
        <div class="game-cover">
            <img src="${game.coverUrl || '../../images/default-game.jpg'}" alt="${game.title}">
            <span class="game-status ${statusClass}">${game.status}</span>
        </div>
        <div class="game-info">
            <h3>${game.title}</h3>
            <p class="game-genre">${game.genre}</p>
            <div class="game-details">
                <span><i class="fas fa-gamepad"></i> ${game.platform}</span>
                <span><i class="fas fa-users"></i> ${game.maxPlayers} Players</span>
                <span><i class="fas fa-dollar-sign"></i> ${game.pricePerHour}/hr</span>
            </div>
        </div>
        <div class="game-actions">
            <button onclick="editGame('${id}')" class="edit-btn" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteGame('${id}')" class="delete-btn" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
            <button onclick="toggleGameStatus('${id}')" class="toggle-btn" title="Toggle Status">
                <i class="fas fa-power-off"></i>
            </button>
        </div>
    `;
    
    return card;
}

// Add Game
async function addGame(formData) {
    try {
        const coverFile = formData.get('cover');
        let coverUrl = '';
        
        if (coverFile) {
            coverUrl = await uploadGameCover(coverFile);
        }
        
        const gameData = {
            title: formData.get('title'),
            genre: formData.get('genre'),
            platform: formData.get('platform'),
            releaseYear: parseInt(formData.get('releaseYear')),
            description: formData.get('description'),
            pricePerHour: parseFloat(formData.get('pricePerHour')),
            maxPlayers: parseInt(formData.get('maxPlayers')),
            status: formData.get('status'),
            coverUrl,
            createdAt: new Date(),
            totalPlayTime: 0,
            totalRevenue: 0,
            rating: 0,
            reviews: []
        };
        
        await addDoc(collection(db, 'games'), gameData);
        showNotification('Game added successfully', 'success');
        closeGameModal();
    } catch (error) {
        console.error('Error adding game:', error);
        showNotification('Error adding game', 'error');
    }
}

// Upload Game Cover
async function uploadGameCover(file) {
    try {
        const storageRef = ref(storage, `game-covers/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error('Error uploading cover:', error);
        throw error;
    }
}

// Edit Game
async function editGame(id) {
    try {
        const gameDoc = await getDoc(doc(db, 'games', id));
        const game = gameDoc.data();
        
        // Populate modal with game data
        document.getElementById('gameTitle').value = game.title;
        document.getElementById('gameGenre').value = game.genre;
        document.getElementById('gamePlatform').value = game.platform;
        document.getElementById('releaseYear').value = game.releaseYear;
        document.getElementById('gameDescription').value = game.description;
        document.getElementById('pricePerHour').value = game.pricePerHour;
        document.getElementById('maxPlayers').value = game.maxPlayers;
        document.getElementById('gameStatus').value = game.status;
        
        // Show modal
        addGameModal.style.display = 'block';
        
        // Update form submission handler
        document.getElementById('gameForm').onsubmit = (e) => {
            e.preventDefault();
            updateGame(id, new FormData(e.target));
        };
    } catch (error) {
        console.error('Error loading game:', error);
        showNotification('Error loading game', 'error');
    }
}

// Update Game
async function updateGame(id, formData) {
    try {
        const gameRef = doc(db, 'games', id);
        const coverFile = formData.get('cover');
        let coverUrl = '';
        
        if (coverFile) {
            coverUrl = await uploadGameCover(coverFile);
        }
        
        const updateData = {
            title: formData.get('title'),
            genre: formData.get('genre'),
            platform: formData.get('platform'),
            releaseYear: parseInt(formData.get('releaseYear')),
            description: formData.get('description'),
            pricePerHour: parseFloat(formData.get('pricePerHour')),
            maxPlayers: parseInt(formData.get('maxPlayers')),
            status: formData.get('status'),
            updatedAt: new Date()
        };
        
        if (coverUrl) {
            updateData.coverUrl = coverUrl;
        }
        
        await updateDoc(gameRef, updateData);
        showNotification('Game updated successfully', 'success');
        closeGameModal();
    } catch (error) {
        console.error('Error updating game:', error);
        showNotification('Error updating game', 'error');
    }
}

// Toggle Game Status
async function toggleGameStatus(id) {
    try {
        const gameRef = doc(db, 'games', id);
        const gameDoc = await getDoc(gameRef);
        const game = gameDoc.data();
        
        const newStatus = game.status === 'available' ? 'unavailable' : 'available';
        
        await updateDoc(gameRef, {
            status: newStatus,
            updatedAt: new Date()
        });
        
        showNotification(`Game ${newStatus === 'available' ? 'enabled' : 'disabled'} successfully`, 'success');
    } catch (error) {
        console.error('Error toggling game status:', error);
        showNotification('Error toggling game status', 'error');
    }
}

// Delete Game
async function deleteGame(id) {
    if (confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
        try {
            const gameRef = doc(db, 'games', id);
            const gameDoc = await getDoc(gameRef);
            const game = gameDoc.data();
            
            // Delete cover image from storage if exists
            if (game.coverUrl) {
                const coverRef = ref(storage, game.coverUrl);
                await deleteObject(coverRef);
            }
            
            await deleteDoc(gameRef);
            showNotification('Game deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting game:', error);
            showNotification('Error deleting game', 'error');
        }
    }
}

// Setup Event Listeners
function setupEventListeners() {
    addGameBtn.addEventListener('click', () => {
        addGameModal.style.display = 'block';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === addGameModal) {
            closeGameModal();
        }
    });
    
    document.getElementById('gameForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addGame(new FormData(e.target));
    });
}

// Setup Realtime Updates
function setupRealtimeUpdates() {
    const gamesQuery = query(
        collection(db, 'games'),
        orderBy('title', 'asc')
    );
    
    onSnapshot(gamesQuery, (snapshot) => {
        updateGamesGrid(snapshot.docs);
    });
}

// Helper Functions
function showNotification(message, type) {
    // Implementation for showing notifications
    console.log(`${type}: ${message}`);
}

function closeGameModal() {
    addGameModal.style.display = 'none';
    document.getElementById('gameForm').reset();
}

// Export functions for use in other modules
export {
    addGame,
    editGame,
    deleteGame,
    toggleGameStatus
}; 