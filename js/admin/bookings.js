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
    onSnapshot,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// DOM Elements
const bookingsTable = document.getElementById('bookingsTable');
const bookingDateFilter = document.getElementById('bookingDateFilter');
const bookingSearchInput = document.querySelector('#bookings .search-bar input');

// Initialize Bookings
document.addEventListener('DOMContentLoaded', () => {
    initializeBookings();
    setupEventListeners();
});

// Initialize Bookings
async function initializeBookings() {
    setupBookingsTable();
    await loadBookings();
    setupRealtimeUpdates();
}

// Setup Bookings Table
function setupBookingsTable() {
    bookingsTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date & Time</th>
                    <th>User</th>
                    <th>Station</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="bookingsTableBody">
                <!-- Bookings will be populated here -->
            </tbody>
        </table>
    `;
}

// Load Bookings
async function loadBookings(date = null) {
    try {
        let bookingsQuery = query(
            collection(db, 'bookings'),
            orderBy('startTime', 'desc')
        );

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            bookingsQuery = query(
                collection(db, 'bookings'),
                where('startTime', '>=', Timestamp.fromDate(startOfDay)),
                where('startTime', '<=', Timestamp.fromDate(endOfDay)),
                orderBy('startTime', 'desc')
            );
        }

        const snapshot = await getDocs(bookingsQuery);
        updateBookingsTable(snapshot.docs);
    } catch (error) {
        console.error('Error loading bookings:', error);
        showNotification('Error loading bookings', 'error');
    }
}

// Update Bookings Table
function updateBookingsTable(bookings) {
    const tableBody = document.getElementById('bookingsTableBody');
    tableBody.innerHTML = '';

    bookings.forEach(doc => {
        const booking = doc.data();
        const row = createBookingRow(doc.id, booking);
        tableBody.appendChild(row);
    });
}

// Create Booking Row
function createBookingRow(id, booking) {
    const row = document.createElement('tr');
    const status = getBookingStatus(booking.startTime, booking.duration);
    const statusClass = `status-${status.toLowerCase()}`;

    row.innerHTML = `
        <td>${formatDateTime(booking.startTime)}</td>
        <td>${booking.userName}</td>
        <td>${booking.stationNumber}</td>
        <td>${booking.duration} hours</td>
        <td><span class="booking-status ${statusClass}">${status}</span></td>
        <td>$${booking.totalAmount}</td>
        <td class="actions">
            <button onclick="editBooking('${id}')" class="edit-btn" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteBooking('${id}')" class="delete-btn" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
            ${status === 'Pending' ? `
                <button onclick="approveBooking('${id}')" class="approve-btn" title="Approve">
                    <i class="fas fa-check"></i>
                </button>
            ` : ''}
            ${status === 'Active' ? `
                <button onclick="completeBooking('${id}')" class="complete-btn" title="Complete">
                    <i class="fas fa-flag-checkered"></i>
                </button>
            ` : ''}
        </td>
    `;

    return row;
}

// Get Booking Status
function getBookingStatus(startTime, duration) {
    const now = new Date();
    const start = startTime.toDate();
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

    if (now < start) return 'Pending';
    if (now > end) return 'Completed';
    return 'Active';
}

// Edit Booking
async function editBooking(id) {
    try {
        const bookingDoc = await getDoc(doc(db, 'bookings', id));
        const booking = bookingDoc.data();

        // Show edit modal with booking data
        showEditBookingModal(id, booking);
    } catch (error) {
        console.error('Error loading booking:', error);
        showNotification('Error loading booking', 'error');
    }
}

// Update Booking
async function updateBooking(id, updateData) {
    try {
        const bookingRef = doc(db, 'bookings', id);
        await updateDoc(bookingRef, {
            ...updateData,
            updatedAt: new Date()
        });
        showNotification('Booking updated successfully', 'success');
    } catch (error) {
        console.error('Error updating booking:', error);
        showNotification('Error updating booking', 'error');
    }
}

// Delete Booking
async function deleteBooking(id) {
    if (confirm('Are you sure you want to delete this booking?')) {
        try {
            await deleteDoc(doc(db, 'bookings', id));
            showNotification('Booking deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting booking:', error);
            showNotification('Error deleting booking', 'error');
        }
    }
}

// Approve Booking
async function approveBooking(id) {
    try {
        const bookingRef = doc(db, 'bookings', id);
        await updateDoc(bookingRef, {
            status: 'approved',
            approvedAt: new Date()
        });
        showNotification('Booking approved successfully', 'success');
    } catch (error) {
        console.error('Error approving booking:', error);
        showNotification('Error approving booking', 'error');
    }
}

// Complete Booking
async function completeBooking(id) {
    try {
        const bookingRef = doc(db, 'bookings', id);
        await updateDoc(bookingRef, {
            status: 'completed',
            completedAt: new Date()
        });
        showNotification('Booking completed successfully', 'success');
    } catch (error) {
        console.error('Error completing booking:', error);
        showNotification('Error completing booking', 'error');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Date filter
    bookingDateFilter.addEventListener('change', (e) => {
        loadBookings(e.target.value);
    });

    // Search
    bookingSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterBookings(searchTerm);
    });
}

// Filter Bookings
function filterBookings(searchTerm) {
    const rows = document.querySelectorAll('#bookingsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Setup Realtime Updates
function setupRealtimeUpdates() {
    const bookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('startTime', 'desc')
    );

    onSnapshot(bookingsQuery, (snapshot) => {
        updateBookingsTable(snapshot.docs);
    });
}

// Helper Functions
function formatDateTime(timestamp) {
    return timestamp.toDate().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type) {
    // Implementation for showing notifications
    console.log(`${type}: ${message}`);
}

// Export functions for use in other modules
export {
    editBooking,
    deleteBooking,
    approveBooking,
    completeBooking
}; 