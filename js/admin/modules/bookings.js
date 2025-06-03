import { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy, limit, startAfter } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const BOOKINGS_PER_PAGE = 20;

export class BookingManager {
    constructor(app) {
        this.db = getFirestore(app);
        this.lastVisible = null;
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.searchTerm = '';
        this.initializeListeners();
    }

    initializeListeners() {
        // Date filter
        const dateFilter = document.getElementById('bookingDate');
        dateFilter.value = this.selectedDate;
        dateFilter.addEventListener('change', (e) => {
            this.selectedDate = e.target.value;
            this.refreshBookings();
        });

        // Search input
        document.getElementById('bookingSearch').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.refreshBookings();
        });
    }

    async refreshBookings() {
        this.lastVisible = null;
        const bookingsTable = document.getElementById('bookingsTable');
        bookingsTable.innerHTML = '<div class="loading">Loading bookings...</div>';
        await this.loadBookings();
    }

    async loadBookings(loadMore = false) {
        try {
            let q = collection(this.db, 'bookings');
            
            // Filter by date
            const startOfDay = new Date(this.selectedDate);
            const endOfDay = new Date(this.selectedDate);
            endOfDay.setDate(endOfDay.getDate() + 1);

            q = query(q, 
                where('startTime', '>=', startOfDay.toISOString()),
                where('startTime', '<', endOfDay.toISOString())
            );

            // Apply search if exists
            if (this.searchTerm) {
                q = query(q, 
                    where('userId', '>=', this.searchTerm),
                    where('userId', '<=', this.searchTerm + '\uf8ff')
                );
            }

            // Order by start time
            q = query(q, orderBy('startTime'), limit(BOOKINGS_PER_PAGE));

            // Apply pagination
            if (loadMore && this.lastVisible) {
                q = query(q, startAfter(this.lastVisible));
            }

            const snapshot = await getDocs(q);
            this.lastVisible = snapshot.docs[snapshot.docs.length - 1];

            // Get user details for each booking
            const bookings = await Promise.all(snapshot.docs.map(async doc => {
                const booking = { id: doc.id, ...doc.data() };
                const userDoc = await doc(this.db, 'users', booking.userId).get();
                booking.user = userDoc.data();
                return booking;
            }));

            this.renderBookings(bookings, loadMore);
            this.updatePagination(snapshot.size === BOOKINGS_PER_PAGE);

        } catch (error) {
            console.error('Error loading bookings:', error);
            this.showError('Failed to load bookings');
        }
    }

    renderBookings(bookings, append = false) {
        const bookingsTable = document.getElementById('bookingsTable');
        
        if (!append) {
            bookingsTable.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>User</th>
                            <th>Station</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="bookingsTableBody"></tbody>
                </table>
            `;
        }

        const tableBody = document.getElementById('bookingsTableBody');
        
        bookings.forEach(booking => {
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            const duration = (endTime - startTime) / (1000 * 60); // in minutes

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${startTime.toLocaleTimeString()}</td>
                <td>${booking.user.username}</td>
                <td>Station ${booking.stationId}</td>
                <td>${duration} minutes</td>
                <td>
                    <span class="status-badge ${booking.status.toLowerCase()}">
                        ${booking.status}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="edit-btn" onclick="window.bookingManager.editBooking('${booking.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="cancel-btn" onclick="window.bookingManager.cancelBooking('${booking.id}')"
                            ${booking.status === 'Completed' ? 'disabled' : ''}>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        if (bookings.length === 0 && !append) {
            bookingsTable.innerHTML = '<div class="no-results">No bookings found for this date</div>';
        }
    }

    updatePagination(hasMore) {
        const pagination = document.getElementById('bookingsPagination');
        pagination.innerHTML = hasMore ? `
            <button onclick="window.bookingManager.loadBookings(true)">Load More</button>
        ` : '';
    }

    async editBooking(bookingId) {
        try {
            const bookingDoc = await doc(this.db, 'bookings', bookingId).get();
            const booking = bookingDoc.data();

            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);

            const { value: formValues } = await Swal.fire({
                title: 'Edit Booking',
                html: `
                    <div class="form-group">
                        <label>Start Time</label>
                        <input id="swal-startTime" class="swal2-input" type="datetime-local" 
                            value="${startTime.toISOString().slice(0, 16)}">
                    </div>
                    <div class="form-group">
                        <label>End Time</label>
                        <input id="swal-endTime" class="swal2-input" type="datetime-local" 
                            value="${endTime.toISOString().slice(0, 16)}">
                    </div>
                    <div class="form-group">
                        <label>Station</label>
                        <select id="swal-station" class="swal2-select">
                            ${Array.from({length: 10}, (_, i) => `
                                <option value="${i+1}" ${booking.stationId === i+1 ? 'selected' : ''}>
                                    Station ${i+1}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="swal-status" class="swal2-select">
                            <option value="Pending" ${booking.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Confirmed" ${booking.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="In Progress" ${booking.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${booking.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" ${booking.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => ({
                    startTime: new Date(document.getElementById('swal-startTime').value).toISOString(),
                    endTime: new Date(document.getElementById('swal-endTime').value).toISOString(),
                    stationId: parseInt(document.getElementById('swal-station').value),
                    status: document.getElementById('swal-status').value
                })
            });

            if (formValues) {
                await updateDoc(doc(this.db, 'bookings', bookingId), formValues);
                this.showSuccess('Booking updated successfully');
                this.refreshBookings();
            }

        } catch (error) {
            console.error('Error editing booking:', error);
            this.showError('Failed to edit booking');
        }
    }

    async cancelBooking(bookingId) {
        try {
            const result = await Swal.fire({
                title: 'Cancel Booking',
                text: "Are you sure you want to cancel this booking?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, cancel it!'
            });

            if (result.isConfirmed) {
                await updateDoc(doc(this.db, 'bookings', bookingId), {
                    status: 'Cancelled'
                });
                this.showSuccess('Booking cancelled successfully');
                this.refreshBookings();
            }

        } catch (error) {
            console.error('Error cancelling booking:', error);
            this.showError('Failed to cancel booking');
        }
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
