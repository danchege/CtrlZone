import { db } from '../firebase-config.js';
import { 
    collection,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    getDocs,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// DOM Elements
const usersGrid = document.getElementById('usersGrid');
const userTypeFilter = document.getElementById('userTypeFilter');
const userSearchInput = document.querySelector('#users .search-bar input');

// Initialize Users
document.addEventListener('DOMContentLoaded', () => {
    initializeUsers();
    setupEventListeners();
});

// Initialize Users
async function initializeUsers() {
    await loadUsers();
    setupRealtimeUpdates();
}

// Load Users
async function loadUsers(filter = 'all') {
    try {
        let usersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc')
        );

        if (filter !== 'all') {
            usersQuery = query(
                collection(db, 'users'),
                where('status', '==', filter),
                orderBy('createdAt', 'desc')
            );
        }

        const snapshot = await getDocs(usersQuery);
        updateUsersGrid(snapshot.docs);
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

// Update Users Grid
function updateUsersGrid(users) {
    usersGrid.innerHTML = '';

    users.forEach(doc => {
        const user = doc.data();
        const userCard = createUserCard(doc.id, user);
        usersGrid.appendChild(userCard);
    });
}

// Create User Card
function createUserCard(id, user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    
    const status = user.status || 'active';
    const statusClass = `status-${status.toLowerCase()}`;
    
    card.innerHTML = `
        <div class="user-avatar">
            <img src="${user.photoURL || '../../images/default-avatar.png'}" alt="${user.username}">
            <span class="user-status ${statusClass}">${status}</span>
        </div>
        <div class="user-info">
            <h3>${user.username}</h3>
            <p class="user-email">${user.email}</p>
            <div class="user-stats">
                <span><i class="fas fa-gamepad"></i> Games: ${user.gamesPlayed || 0}</span>
                <span><i class="fas fa-trophy"></i> Tournaments: ${user.tournamentsParticipated || 0}</span>
            </div>
            <p class="user-joined">Joined: ${formatDate(user.createdAt)}</p>
        </div>
        <div class="user-actions">
            <button onclick="editUser('${id}')" class="edit-btn" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            ${status === 'active' ? `
                <button onclick="banUser('${id}')" class="ban-btn" title="Ban User">
                    <i class="fas fa-ban"></i>
                </button>
            ` : `
                <button onclick="unbanUser('${id}')" class="unban-btn" title="Unban User">
                    <i class="fas fa-undo"></i>
                </button>
            `}
            <button onclick="deleteUser('${id}')" class="delete-btn" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
            ${!user.isAdmin ? `
                <button onclick="makeAdmin('${id}')" class="admin-btn" title="Make Admin">
                    <i class="fas fa-user-shield"></i>
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Edit User
async function editUser(id) {
    try {
        const userDoc = await getDoc(doc(db, 'users', id));
        const user = userDoc.data();
        
        showEditUserModal(id, user);
    } catch (error) {
        console.error('Error loading user:', error);
        showNotification('Error loading user', 'error');
    }
}

// Update User
async function updateUser(id, updateData) {
    try {
        const userRef = doc(db, 'users', id);
        await updateDoc(userRef, {
            ...updateData,
            updatedAt: new Date()
        });
        showNotification('User updated successfully', 'success');
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Error updating user', 'error');
    }
}

// Ban User
async function banUser(id) {
    if (confirm('Are you sure you want to ban this user?')) {
        try {
            const userRef = doc(db, 'users', id);
            await updateDoc(userRef, {
                status: 'banned',
                bannedAt: new Date()
            });
            showNotification('User banned successfully', 'success');
        } catch (error) {
            console.error('Error banning user:', error);
            showNotification('Error banning user', 'error');
        }
    }
}

// Unban User
async function unbanUser(id) {
    try {
        const userRef = doc(db, 'users', id);
        await updateDoc(userRef, {
            status: 'active',
            unbannedAt: new Date()
        });
        showNotification('User unbanned successfully', 'success');
    } catch (error) {
        console.error('Error unbanning user:', error);
        showNotification('Error unbanning user', 'error');
    }
}

// Make Admin
async function makeAdmin(id) {
    if (confirm('Are you sure you want to make this user an admin?')) {
        try {
            const userRef = doc(db, 'users', id);
            await updateDoc(userRef, {
                isAdmin: true,
                adminSince: new Date()
            });
            showNotification('User promoted to admin successfully', 'success');
        } catch (error) {
            console.error('Error making user admin:', error);
            showNotification('Error making user admin', 'error');
        }
    }
}

// Delete User
async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            await deleteDoc(doc(db, 'users', id));
            showNotification('User deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Error deleting user', 'error');
        }
    }
}

// Show Edit User Modal
function showEditUserModal(id, user) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Edit User</h2>
            <form id="editUserForm">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="username" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" id="phone" value="${user.phone || ''}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="status">
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="banned" ${user.status === 'banned' ? 'selected' : ''}>Banned</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="action-btn">Save Changes</button>
                    <button type="button" class="cancel-btn" onclick="closeModal(this)">Cancel</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Form submission handler
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await updateUser(id, {
            username: formData.get('username'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            status: formData.get('status')
        });
        closeModal(e.target);
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // User type filter
    userTypeFilter.addEventListener('change', (e) => {
        loadUsers(e.target.value);
    });

    // Search
    userSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterUsers(searchTerm);
    });
}

// Filter Users
function filterUsers(searchTerm) {
    const cards = document.querySelectorAll('.user-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Setup Realtime Updates
function setupRealtimeUpdates() {
    const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
    );

    onSnapshot(usersQuery, (snapshot) => {
        updateUsersGrid(snapshot.docs);
    });
}

// Helper Functions
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type) {
    // Implementation for showing notifications
    console.log(`${type}: ${message}`);
}

function closeModal(element) {
    const modal = element.closest('.modal');
    modal.remove();
}

// Export functions for use in other modules
export {
    editUser,
    banUser,
    unbanUser,
    makeAdmin,
    deleteUser
}; 