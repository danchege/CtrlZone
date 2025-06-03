import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export class TournamentManager {
    constructor(app) {
        this.db = getFirestore(app);
        this.initializeListeners();
    }

    initializeListeners() {
        // Search input
        const searchInput = document.getElementById('tournamentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.refreshTournaments();
            });
        }

        // Create tournament button
        const createBtn = document.getElementById('createTournamentBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateTournamentModal();
            });
        }
    }

    async refreshTournaments() {
        const tournamentsGrid = document.getElementById('tournamentsGrid');
        tournamentsGrid.innerHTML = '<div class="loading">Loading tournaments...</div>';
        await this.loadTournaments();
    }

    async loadTournaments() {
        try {
            let q = collection(this.db, 'tournaments');
            
            // Apply search if exists
            if (this.searchTerm) {
                q = query(q, 
                    where('name', '>=', this.searchTerm),
                    where('name', '<=', this.searchTerm + '\uf8ff')
                );
            }

            // Order by start date
            q = query(q, orderBy('startDate', 'desc'));

            const snapshot = await getDocs(q);
            const tournaments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderTournaments(tournaments);

        } catch (error) {
            console.error('Error loading tournaments:', error);
            this.showError('Failed to load tournaments');
        }
    }

    renderTournaments(tournaments) {
        const tournamentsGrid = document.getElementById('tournamentsGrid');
        tournamentsGrid.innerHTML = '';

        tournaments.forEach(tournament => {
            const startDate = new Date(tournament.startDate);
            const endDate = new Date(tournament.endDate);
            const status = this.getTournamentStatus(tournament);

            const tournamentCard = document.createElement('div');
            tournamentCard.className = 'tournament-card';
            tournamentCard.innerHTML = `
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
                    <p class="tournament-dates">
                        <i class="fas fa-calendar"></i>
                        ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
                    </p>
                    <p class="tournament-prize">
                        <i class="fas fa-trophy"></i>
                        Prize Pool: $${tournament.prizePool}
                    </p>
                    <p class="tournament-participants">
                        <i class="fas fa-users"></i>
                        ${tournament.participants?.length || 0}/${tournament.maxParticipants} Participants
                    </p>
                </div>
                <div class="tournament-actions">
                    <button class="edit-btn" onclick="window.tournamentManager.editTournament('${tournament.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="view-btn" onclick="window.tournamentManager.viewParticipants('${tournament.id}')">
                        <i class="fas fa-users"></i>
                    </button>
                    <button class="delete-btn" onclick="window.tournamentManager.deleteTournament('${tournament.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            tournamentsGrid.appendChild(tournamentCard);
        });

        if (tournaments.length === 0) {
            tournamentsGrid.innerHTML = '<div class="no-results">No tournaments found</div>';
        }
    }

    getTournamentStatus(tournament) {
        const now = new Date();
        const startDate = new Date(tournament.startDate);
        const endDate = new Date(tournament.endDate);

        if (now < startDate) {
            return { label: 'Upcoming', class: 'upcoming' };
        } else if (now > endDate) {
            return { label: 'Completed', class: 'completed' };
        } else {
            return { label: 'In Progress', class: 'in-progress' };
        }
    }

    async createTournament(data) {
        try {
            // Convert dates to ISO strings
            const tournamentData = {
                name: data.name,
                game: data.game,
                startDate: new Date(data.startDate).toISOString(),
                endDate: new Date(data.endDate).toISOString(),
                prizePool: parseInt(data.prizePool),
                maxParticipants: parseInt(data.maxParticipants),
                description: data.description,
                rules: data.rules,
                participants: [],
                createdAt: new Date().toISOString()
            };

            const tournamentRef = doc(collection(this.db, 'tournaments'));
            await setDoc(tournamentRef, tournamentData);

            this.showSuccess('Tournament created successfully');
            this.refreshTournaments();

            // Notify main website to refresh tournaments
            const event = new CustomEvent('tournamentUpdated');
            window.dispatchEvent(event);

        } catch (error) {
            console.error('Error creating tournament:', error);
            this.showError('Failed to create tournament');
        }
    }

    async editTournament(tournamentId) {
        try {
            const tournamentDoc = await doc(this.db, 'tournaments', tournamentId).get();
            const tournament = tournamentDoc.data();

            const { value: formValues } = await Swal.fire({
                title: 'Edit Tournament',
                html: `
                    <input id="swal-name" class="swal2-input" value="${tournament.name}" placeholder="Tournament Name">
                    <input id="swal-game" class="swal2-input" value="${tournament.game}" placeholder="Game">
                    <input id="swal-startDate" class="swal2-input" type="date" value="${tournament.startDate.split('T')[0]}">
                    <input id="swal-endDate" class="swal2-input" type="date" value="${tournament.endDate.split('T')[0]}">
                    <input id="swal-prizePool" class="swal2-input" type="number" value="${tournament.prizePool}" placeholder="Prize Pool">
                    <input id="swal-maxParticipants" class="swal2-input" type="number" value="${tournament.maxParticipants}" placeholder="Max Participants">
                    <textarea id="swal-description" class="swal2-textarea" placeholder="Description">${tournament.description}</textarea>
                    <textarea id="swal-rules" class="swal2-textarea" placeholder="Rules">${tournament.rules}</textarea>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => ({
                    name: document.getElementById('swal-name').value,
                    game: document.getElementById('swal-game').value,
                    startDate: document.getElementById('swal-startDate').value,
                    endDate: document.getElementById('swal-endDate').value,
                    prizePool: document.getElementById('swal-prizePool').value,
                    maxParticipants: document.getElementById('swal-maxParticipants').value,
                    description: document.getElementById('swal-description').value,
                    rules: document.getElementById('swal-rules').value
                })
            });

            if (formValues) {
                await updateDoc(doc(this.db, 'tournaments', tournamentId), formValues);
                this.showSuccess('Tournament updated successfully');
                this.refreshTournaments();
            }

        } catch (error) {
            console.error('Error editing tournament:', error);
            this.showError('Failed to edit tournament');
        }
    }

    async viewParticipants(tournamentId) {
        try {
            const tournamentDoc = await doc(this.db, 'tournaments', tournamentId).get();
            const tournament = tournamentDoc.data();

            // Get participant details
            const participantPromises = tournament.participants.map(userId => 
                doc(this.db, 'users', userId).get()
            );
            const participantDocs = await Promise.all(participantPromises);
            const participants = participantDocs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Show participants modal
            Swal.fire({
                title: 'Tournament Participants',
                html: `
                    <div class="participants-list">
                        ${participants.map(p => `
                            <div class="participant-item">
                                <i class="fas fa-user"></i>
                                ${p.username}
                            </div>
                        `).join('')}
                    </div>
                `,
                width: '600px'
            });

        } catch (error) {
            console.error('Error viewing participants:', error);
            this.showError('Failed to load participants');
        }
    }

    async deleteTournament(tournamentId) {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "This will permanently delete the tournament and all related data!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                await deleteDoc(doc(this.db, 'tournaments', tournamentId));
        Swal.fire({
            title: 'Edit Tournament',
            html: `
                <input id="swal-name" class="swal2-input" value="${tournament.name}" placeholder="Tournament Name">
                <input id="swal-game" class="swal2-input" value="${tournament.game}" placeholder="Game">
                <input id="swal-startDate" class="swal2-input" type="date" value="${tournament.startDate}">
                <input id="swal-endDate" class="swal2-input" type="date" value="${tournament.endDate}">
                <input id="swal-prizePool" class="swal2-input" type="number" value="${tournament.prizePool}" placeholder="Prize Pool">
                <input id="swal-maxParticipants" class="swal2-input" type="number" value="${tournament.maxParticipants}" placeholder="Max Participants">
                <textarea id="swal-description" class="swal2-textarea" placeholder="Description">${tournament.description || ''}</textarea>
                <textarea id="swal-rules" class="swal2-textarea" placeholder="Rules">${tournament.rules || ''}</textarea>
            `,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const formValues = {
                    name: document.getElementById('swal-name').value,
                    game: document.getElementById('swal-game').value,
                    startDate: document.getElementById('swal-startDate').value,
                    endDate: document.getElementById('swal-endDate').value,
                    prizePool: document.getElementById('swal-prizePool').value,
                    maxParticipants: document.getElementById('swal-maxParticipants').value,
                    description: document.getElementById('swal-description').value,
                    rules: document.getElementById('swal-rules').value
                };

                if (!formValues.name || !formValues.game || !formValues.startDate || 
                    !formValues.endDate || !formValues.prizePool || !formValues.maxParticipants) {
                    Swal.showValidationMessage('Please fill all required fields');
                    return false;
                }

                if (new Date(formValues.startDate) >= new Date(formValues.endDate)) {
                    Swal.showValidationMessage('End date must be after start date');
                    return false;
                }

                return formValues;
            }
        }).then(async (result) => {
            if (!result.value) return;

            const formValues = result.value;
            const tournamentData = {
                name: formValues.name,
                game: formValues.game,
                startDate: new Date(formValues.startDate).toISOString(),
                endDate: new Date(formValues.endDate).toISOString(),
                prizePool: parseInt(formValues.prizePool),
                maxParticipants: parseInt(formValues.maxParticipants),
                description: formValues.description,
                rules: formValues.rules,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(doc(this.db, 'tournaments', tournamentId), tournamentData);

            this.showSuccess('Tournament updated successfully');
            this.refreshTournaments();

            // Notify main website to refresh tournaments
            const event = new CustomEvent('tournamentUpdated');
            window.dispatchEvent(event);
        });

    } catch (error) {
        console.error('Error editing tournament:', error);
        this.showError('Failed to edit tournament');
    }
}

async viewParticipants(tournamentId) {
    try {
        const tournamentDoc = await doc(this.db, 'tournaments', tournamentId).get();
        const tournament = tournamentDoc.data();

        // Get participant details
        const participantPromises = tournament.participants.map(userId => 
            doc(this.db, 'users', userId).get()
        );
        const participantDocs = await Promise.all(participantPromises);
        const participants = participantDocs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Show participants modal
        Swal.fire({
            title: 'Tournament Participants',
            html: `
                <div class="participants-list">
                    ${participants.map(p => `
                        <div class="participant-item">
                            <i class="fas fa-user"></i>
                            ${p.username}
                        </div>
                    `).join('')}
                </div>
            `,
            width: '600px'
        });

    } catch (error) {
    Swal.fire({
        title: 'Tournament Participants',
        html: `
            <div class="participants-list">
                ${participants.map(p => `
                    <div class="participant-item">
                        <i class="fas fa-user"></i>
                        ${p.username}
                    </div>
                `).join('')}
            </div>
            <input id="swal-game" class="swal2-input" placeholder="Game">
            <input id="swal-startDate" class="swal2-input" type="date">
            <input id="swal-endDate" class="swal2-input" type="date">
            <input id="swal-prizePool" class="swal2-input" type="number" placeholder="Prize Pool">
            <input id="swal-maxParticipants" class="swal2-input" type="number" placeholder="Max Participants">
            <textarea id="swal-description" class="swal2-textarea" placeholder="Description"></textarea>
            <textarea id="swal-rules" class="swal2-textarea" placeholder="Rules"></textarea>
        `,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
            const formValues = {
                name: document.getElementById('swal-name').value,
                game: document.getElementById('swal-game').value,
                startDate: document.getElementById('swal-startDate').value,
                endDate: document.getElementById('swal-endDate').value,
                prizePool: document.getElementById('swal-prizePool').value,
                maxParticipants: document.getElementById('swal-maxParticipants').value,
                description: document.getElementById('swal-description').value,
                rules: document.getElementById('swal-rules').value
            };

            // Validate form
            if (!formValues.name || !formValues.game || !formValues.startDate || 
                !formValues.endDate || !formValues.prizePool || !formValues.maxParticipants) {
                Swal.showValidationMessage('Please fill all required fields');
                return false;
            }

            if (new Date(formValues.startDate) >= new Date(formValues.endDate)) {
                Swal.showValidationMessage('End date must be after start date');
                return false;
            }

            return formValues;
        }
    }).then((result) => {
        if (result.value) {
            this.createTournament(result.value);
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
