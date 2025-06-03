import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, limit, startAfter, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const USERS_PER_PAGE = 10;

export class UserManager {
    constructor(app) {
        this.db = getFirestore(app);
        this.auth = getAuth(app);
        this.lastVisible = null;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.userStatusUnsubscribe = null;
        this.initializeListeners();
        this.setupUserStatusListener();
    }

    initializeListeners() {
        // Search input
        document.getElementById('userSearch').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.refreshUserList();
        });

        // Filter select
        document.getElementById('userFilter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.refreshUserList();
        });

        // Add user button
        const addUserBtn = document.createElement('button');
        addUserBtn.className = 'action-btn';
        addUserBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add User';
        addUserBtn.onclick = () => this.showAddUserModal();
        document.querySelector('#usersSection .header-actions').prepend(addUserBtn);
    }

    async refreshUserList() {
        this.lastVisible = null;
        const usersGrid = document.getElementById('usersGrid');
        usersGrid.innerHTML = '<div class="loading">Loading users...</div>';
        await this.loadUsers();
    }

    async loadUsers(loadMore = false) {
        try {
            // Get the users grid element
            const usersGrid = document.getElementById('usersGrid');
            if (!usersGrid) {
                console.error('Users grid element not found');
                return;
            }

            // Show loading state
            if (!loadMore) {
                usersGrid.innerHTML = '<div class="loading">Loading users...</div>';
            }

            // Build the query
            let q = collection(this.db, 'users');
            
            // Apply filters
            if (this.currentFilter !== 'all') {
                if (this.currentFilter === 'admin') {
                    q = query(q, where('isAdmin', '==', true));
                } else if (this.currentFilter === 'banned') {
                    q = query(q, where('isBanned', '==', true));
                } else if (this.currentFilter === 'active') {
                    q = query(q, where('isBanned', '==', false));
                }
            }

            // Apply search
            if (this.searchTerm) {
                q = query(q, where('username', '>=', this.searchTerm), 
                            where('username', '<=', this.searchTerm + '\uf8ff'));
            }

            // Apply pagination
            q = query(q, orderBy('username'), limit(USERS_PER_PAGE));
            if (loadMore && this.lastVisible) {
                q = query(q, startAfter(this.lastVisible));
            }

            // Get users
            const snapshot = await getDocs(q);
            if (snapshot.empty && !loadMore) {
                usersGrid.innerHTML = '<div class="no-results">No users found</div>';
                this.updatePagination(false);
                return;
            }

            this.lastVisible = snapshot.docs[snapshot.docs.length - 1];

            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderUsers(users, loadMore);
            this.updatePagination(snapshot.size === USERS_PER_PAGE);

        } catch (error) {
            console.error('Error loading users:', error);
            if (error.code === 'permission-denied') {
                this.showError('You do not have permission to view users');
            } else {
                this.showError('Failed to load users');
            }
            const usersGrid = document.getElementById('usersGrid');
            if (usersGrid) {
                usersGrid.innerHTML = '<div class="error">Failed to load users</div>';
            }
        }
    }

    setupUserStatusListener() {
        // Stop any existing listener
        if (this.userStatusUnsubscribe) {
            this.userStatusUnsubscribe();
        }

        // Listen for user status changes
        const q = query(collection(this.db, 'users'));
        this.userStatusUnsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const user = change.doc.data();
                const userCard = document.querySelector(`[data-user-id="${change.doc.id}"]`);
                if (userCard) {
                    const statusDot = userCard.querySelector('.status-dot');
                    if (statusDot) {
                        statusDot.className = `status-dot ${user.isOnline ? 'online' : 'offline'}`;
                        statusDot.title = user.isOnline ? 'Online' : `Last seen: ${this.formatLastSeen(user.lastSeen)}`;
                    }
                }
            });
        });
    }

    formatLastSeen(timestamp) {
        if (!timestamp) return 'Never';
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now - date;
        
        // Less than a minute
        if (diff < 60000) return 'Just now';
        
        // Less than an hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        
        // Less than a day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        
        // More than a day
        return date.toLocaleDateString();
    }

    renderUsers(users, append = false) {
        try {
            const usersGrid = document.getElementById('usersGrid');
            if (!usersGrid) {
                console.error('Users grid element not found');
                return;
            }

            if (!append) {
                usersGrid.innerHTML = '';
            }

            if (users.length === 0) {
                usersGrid.innerHTML = '<div class="no-results">No users found</div>';
                return;
            }

            users.forEach(user => {
                const userCard = document.createElement('div');
                userCard.className = 'user-card';
                userCard.dataset.userId = user.id;

                // Get user status
                const now = new Date();
                const lastSeen = user.lastSeen ? user.lastSeen.toDate() : null;
                const isOnline = lastSeen && (now - lastSeen) < 5 * 60 * 1000; // 5 minutes

                userCard.innerHTML = `
                    <div class="user-header">
                        <i class="fas fa-user"></i>
                        <div class="user-info">
                            <h3>${user.username || 'Anonymous'}</h3>
                            <p>${user.email}</p>
                            <div class="user-badges">
                                ${user.isAdmin ? '<span class="user-status admin">Admin</span>' : ''}
                                ${user.isBanned ? '<span class="user-status banned">Banned</span>' : ''}
                                ${!user.isBanned && !user.isAdmin ? '<span class="user-status active">Active</span>' : ''}
                            </div>
                        </div>
                        <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
                    </div>
                    <div class="user-meta">
                        <p><i class="fas fa-clock"></i> Last seen: ${this.formatLastSeen(user.lastSeen)}</p>
                    </div>
                    <div class="user-actions">
                        <button class="edit-btn" onclick="window.userManager.editUser('${user.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${user.isBanned ?
                            `<button class="unban-btn" onclick="window.userManager.toggleBan('${user.id}', false)">
                                <i class="fas fa-unlock"></i> Unban
                            </button>` :
                            `<button class="ban-btn" onclick="window.userManager.toggleBan('${user.id}', true)">
                                <i class="fas fa-ban"></i> Ban
                            </button>`
                        }
                        <button class="delete-btn" onclick="window.userManager.deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;

                usersGrid.appendChild(userCard);
            });
        } catch (error) {
            console.error('Error rendering users:', error);
            const usersGrid = document.getElementById('usersGrid');
            if (usersGrid) {
                usersGrid.innerHTML = '<div class="error">Failed to render users</div>';
            }
        }
    }

    updatePagination(hasMore) {
        try {
            const loadMoreBtn = document.getElementById('loadMoreUsers');
            const paginationDiv = document.getElementById('usersPagination');
            
            if (!loadMoreBtn || !paginationDiv) {
                console.warn('Pagination elements not found');
                return;
            }

            if (hasMore) {
                loadMoreBtn.style.display = 'block';
                paginationDiv.style.display = 'block';
            } else {
                loadMoreBtn.style.display = 'none';
                paginationDiv.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating pagination:', error);
        }
    }

    async addUser(userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, userData.email, userData.password);
            const user = userCredential.user;

            await setDoc(doc(this.db, 'users', user.uid), {
                username: userData.username,
                email: userData.email,
                isAdmin: userData.isAdmin || false,
                isBanned: false,
                createdAt: serverTimestamp(),
                lastSeen: serverTimestamp()
            });

            this.refreshUserList();
            this.showSuccess('User added successfully');
        } catch (error) {
            console.error('Error adding user:', error);
            this.showError('Failed to add user: ' + error.message);
        }
    }

    async toggleBan(userId, ban) {
        try {
            await updateDoc(doc(this.db, 'users', userId), {
                isBanned: ban
            });
            this.showSuccess(`User ${ban ? 'banned' : 'unbanned'} successfully`);
            this.refreshUserList();
        } catch (error) {
            console.error('Error toggling ban:', error);
            this.showError('Failed to update user status');
        }
    }

    async editUser(userId) {
        try {
            const userDoc = await getDoc(doc(this.db, 'users', userId));
            if (!userDoc.exists()) {
                this.showError('User not found');
                return;
            }

            const userData = userDoc.data();
            const { value: formValues } = await Swal.fire({
                title: 'Edit User',
                html: `
                    <input id="username" class="swal2-input" value="${userData.username || ''}" placeholder="Username">
                    <input id="email" class="swal2-input" value="${userData.email}" placeholder="Email" disabled>
                    <div class="swal2-checkbox">
                        <input type="checkbox" id="isAdmin" ${userData.isAdmin ? 'checked' : ''}>
                        <label for="isAdmin">Admin</label>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => {
                    return {
                        username: document.getElementById('username').value,
                        isAdmin: document.getElementById('isAdmin').checked
                    };
                }
            });

            if (formValues) {
                await updateDoc(doc(this.db, 'users', userId), {
                    username: formValues.username,
                    isAdmin: formValues.isAdmin,
                    updatedAt: serverTimestamp()
                });

                this.showSuccess('User updated successfully');
                this.refreshUserList();
            }
        } catch (error) {
            console.error('Error editing user:', error);
            this.showError('Failed to edit user: ' + error.message);
        }
    }

    async deleteUser(userId) {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "This action cannot be undone!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                // Delete from Firestore first
                await deleteDoc(doc(this.db, 'users', userId));

                // Then delete from Auth if possible
                try {
                    const user = await this.auth.getUser(userId);
                    if (user) {
                        await deleteUser(user);
                    }
                } catch (authError) {
                    console.warn('Could not delete auth user:', authError);
                    // Continue since we already deleted from Firestore
                }

                this.showSuccess('User deleted successfully');
                this.refreshUserList();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showError('Failed to delete user: ' + error.message);
        }
    }

    showAddUserModal() {
        try {
            Swal.fire({
                title: 'Add New User',
                html: `
                    <input id="swal-username" class="swal2-input" placeholder="Username">
                    <input id="swal-email" class="swal2-input" placeholder="Email">
                    <input id="swal-password" class="swal2-input" type="password" placeholder="Password">
                    <div class="swal2-checkbox">
                        <input type="checkbox" id="isAdmin">
                        <label for="isAdmin">Admin</label>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => {
                    const username = document.getElementById('swal-username').value;
                    const email = document.getElementById('swal-email').value;
                    const password = document.getElementById('swal-password').value;
                    const isAdmin = document.getElementById('isAdmin').checked;

                    if (!username || !email || !password) {
                        Swal.showValidationMessage('Please fill all fields');
                        return false;
                    }

                    if (password.length < 6) {
                        Swal.showValidationMessage('Password must be at least 6 characters');
                        return false;
                    }

                    return { username, email, password, isAdmin };
                }
            }).then((result) => {
                if (result.value) {
                    this.addUser(result.value);
                }
            });
        } catch (error) {
            console.error('Error showing add user modal:', error);
            this.showError('Failed to show add user form');
        }
    }

    showSuccess(message) {
        try {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: message,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error showing success message:', error);
        }
    }

    showError(message) {
        try {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message
            });
        } catch (error) {
            console.error('Error showing error message:', error);
        }
    }
}
