import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

export class GameManager {
    constructor(app) {
        this.db = getFirestore(app);
        this.storage = getStorage(app);
        this.searchTerm = '';
        this.initializeListeners();
    }

    initializeListeners() {
        // Search input
        document.getElementById('gameSearch').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.refreshGames();
        });

        // Add game button
        document.getElementById('addGameBtn').addEventListener('click', () => {
            this.showAddGameModal();
        });
    }

    async refreshGames() {
        const gamesGrid = document.getElementById('gamesGrid');
        gamesGrid.innerHTML = '<div class="loading">Loading games...</div>';
        await this.loadGames();
    }

    async loadGames() {
        try {
            let q = collection(this.db, 'games');
            
            // Apply search if exists
            if (this.searchTerm) {
                q = query(q, 
                    where('title', '>=', this.searchTerm),
                    where('title', '<=', this.searchTerm + '\uf8ff')
                );
            }

            // Order by title
            q = query(q, orderBy('title'));

            const snapshot = await getDocs(q);
            const games = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderGames(games);

        } catch (error) {
            console.error('Error loading games:', error);
            this.showError('Failed to load games');
        }
    }

    renderGames(games) {
        const gamesGrid = document.getElementById('gamesGrid');
        gamesGrid.innerHTML = '';

        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = `
                <div class="game-image">
                    <img src="${game.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${game.title}">
                    <div class="game-overlay">
                        <button class="edit-btn" onclick="window.gameManager.editGame('${game.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="window.gameManager.deleteGame('${game.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="game-info">
                    <h3>${game.title}</h3>
                    <div class="game-meta">
                        <span class="game-genre">${game.genre}</span>
                        <span class="game-rating">
                            <i class="fas fa-star"></i>
                            ${game.rating}/5
                        </span>
                    </div>
                    <div class="game-stats">
                        <div class="stat">
                            <i class="fas fa-users"></i>
                            ${game.totalPlays || 0} Plays
                        </div>
                        <div class="stat">
                            <i class="fas fa-clock"></i>
                            ${game.averagePlayTime || 0} mins
                        </div>
                    </div>
                    <div class="game-status ${game.isActive ? 'active' : 'inactive'}">
                        ${game.isActive ? 'Active' : 'Inactive'}
                    </div>
                </div>
            `;
            gamesGrid.appendChild(gameCard);
        });

        if (games.length === 0) {
            gamesGrid.innerHTML = '<div class="no-results">No games found</div>';
        }
    }

    async uploadGameImage(file) {
        try {
            const storageRef = ref(this.storage, `games/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    async addGame(data) {
        try {
            // Upload image if provided
            let imageUrl = null;
            if (data.image) {
                imageUrl = await this.uploadGameImage(data.image);
            }

            // Create game document
            const gameRef = doc(collection(this.db, 'games'));
            await setDoc(gameRef, {
                title: data.title,
                genre: data.genre,
                description: data.description,
                rating: parseFloat(data.rating),
                imageUrl: imageUrl,
                requirements: data.requirements,
                isActive: true,
                totalPlays: 0,
                averagePlayTime: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            this.showSuccess('Game added successfully');
            this.refreshGames();

        } catch (error) {
            console.error('Error adding game:', error);
            this.showError('Failed to add game');
        }
    }

    async editGame(gameId) {
        try {
            const gameDoc = await doc(this.db, 'games', gameId).get();
            const game = gameDoc.data();

            const { value: formValues } = await Swal.fire({
                title: 'Edit Game',
                html: `
                    <div class="form-group">
                        <label>Title</label>
                        <input id="swal-title" class="swal2-input" value="${game.title}">
                    </div>
                    <div class="form-group">
                        <label>Genre</label>
                        <input id="swal-genre" class="swal2-input" value="${game.genre}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="swal-description" class="swal2-textarea">${game.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Rating</label>
                        <input id="swal-rating" class="swal2-input" type="number" min="0" max="5" step="0.1" value="${game.rating}">
                    </div>
                    <div class="form-group">
                        <label>Requirements</label>
                        <textarea id="swal-requirements" class="swal2-textarea">${game.requirements}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="swal-status" class="swal2-select">
                            <option value="true" ${game.isActive ? 'selected' : ''}>Active</option>
                            <option value="false" ${!game.isActive ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>New Image (optional)</label>
                        <input id="swal-image" type="file" accept="image/*" class="swal2-file">
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: async () => {
                    const imageFile = document.getElementById('swal-image').files[0];
                    let imageUrl = game.imageUrl;

                    if (imageFile) {
                        imageUrl = await this.uploadGameImage(imageFile);
                    }

                    return {
                        title: document.getElementById('swal-title').value,
                        genre: document.getElementById('swal-genre').value,
                        description: document.getElementById('swal-description').value,
                        rating: document.getElementById('swal-rating').value,
                        requirements: document.getElementById('swal-requirements').value,
                        isActive: document.getElementById('swal-status').value === 'true',
                        imageUrl: imageUrl,
                        updatedAt: new Date().toISOString()
                    };
                }
            });

            if (formValues) {
                await updateDoc(doc(this.db, 'games', gameId), formValues);
                this.showSuccess('Game updated successfully');
                this.refreshGames();
            }

        } catch (error) {
            console.error('Error editing game:', error);
            this.showError('Failed to edit game');
        }
    }

    async deleteGame(gameId) {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "This will permanently delete the game!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                // Get game data to delete image
                const gameDoc = await doc(this.db, 'games', gameId).get();
                const game = gameDoc.data();

                // Delete image from storage if exists
                if (game.imageUrl) {
                    const imageRef = ref(this.storage, game.imageUrl);
                    await deleteObject(imageRef);
                }

                // Delete game document
                await deleteDoc(doc(this.db, 'games', gameId));
                
                this.showSuccess('Game deleted successfully');
                this.refreshGames();
            }

        } catch (error) {
            console.error('Error deleting game:', error);
            this.showError('Failed to delete game');
        }
    }

    showAddGameModal() {
        Swal.fire({
            title: 'Add New Game',
            html: `
                <div class="form-group">
                    <label>Title</label>
                    <input id="swal-title" class="swal2-input" placeholder="Game Title">
                </div>
                <div class="form-group">
                    <label>Genre</label>
                    <input id="swal-genre" class="swal2-input" placeholder="Game Genre">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="swal-description" class="swal2-textarea" placeholder="Game Description"></textarea>
                </div>
                <div class="form-group">
                    <label>Rating</label>
                    <input id="swal-rating" class="swal2-input" type="number" min="0" max="5" step="0.1" placeholder="Rating (0-5)">
                </div>
                <div class="form-group">
                    <label>Requirements</label>
                    <textarea id="swal-requirements" class="swal2-textarea" placeholder="System Requirements"></textarea>
                </div>
                <div class="form-group">
                    <label>Game Image</label>
                    <input id="swal-image" type="file" accept="image/*" class="swal2-file">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const formValues = {
                    title: document.getElementById('swal-title').value,
                    genre: document.getElementById('swal-genre').value,
                    description: document.getElementById('swal-description').value,
                    rating: document.getElementById('swal-rating').value,
                    requirements: document.getElementById('swal-requirements').value,
                    image: document.getElementById('swal-image').files[0]
                };

                if (!formValues.title || !formValues.genre || !formValues.description) {
                    Swal.showValidationMessage('Please fill all required fields');
                    return false;
                }

                if (formValues.rating < 0 || formValues.rating > 5) {
                    Swal.showValidationMessage('Rating must be between 0 and 5');
                    return false;
                }

                return formValues;
            }
        }).then((result) => {
            if (result.value) {
                this.addGame(result.value);
            }
        });
    }

    showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
            timer: 2000,
            showConfirmButton: false
        });
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    }
}
