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
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// DOM Elements
const eventsGrid = document.getElementById('eventsGrid');
const createEventBtn = document.getElementById('createEvent');
const createEventModal = document.getElementById('createEventModal');

// Initialize Events
document.addEventListener('DOMContentLoaded', () => {
    initializeEvents();
    setupEventListeners();
});

// Initialize Events
async function initializeEvents() {
    setupEventModal();
    await loadEvents();
    setupRealtimeUpdates();
}

// Setup Event Modal
function setupEventModal() {
    createEventModal.innerHTML = `
        <div class="modal-content">
            <h2>Create Event</h2>
            <form id="eventForm">
                <div class="form-group">
                    <label>Event Name</label>
                    <input type="text" id="eventName" required>
                </div>
                <div class="form-group">
                    <label>Event Type</label>
                    <select id="eventType" required>
                        <option value="">Select Type</option>
                        <option value="tournament">Tournament</option>
                        <option value="competition">Competition</option>
                        <option value="meetup">Meetup</option>
                        <option value="workshop">Workshop</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="datetime-local" id="eventStart" required>
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="datetime-local" id="eventEnd" required>
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" id="eventLocation" required>
                </div>
                <div class="form-group">
                    <label>Max Attendees</label>
                    <input type="number" id="maxAttendees" min="1" required>
                </div>
                <div class="form-group">
                    <label>Entry Fee</label>
                    <input type="number" id="entryFee" min="0" required>
                </div>
                <div class="form-group">
                    <label>Event Banner</label>
                    <input type="file" id="eventBanner" accept="image/*">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="eventDescription" required></textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="action-btn">Create Event</button>
                    <button type="button" class="cancel-btn" onclick="closeEventModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
}

// Load Events
async function loadEvents() {
    try {
        const eventsQuery = query(
            collection(db, 'events'),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(eventsQuery);
        updateEventsGrid(snapshot.docs);
    } catch (error) {
        console.error('Error loading events:', error);
        showNotification('Error loading events', 'error');
    }
}

// Update Events Grid
function updateEventsGrid(events) {
    eventsGrid.innerHTML = '';
    events.forEach(doc => {
        const event = doc.data();
        const card = createEventCard(doc.id, event);
        eventsGrid.appendChild(card);
    });
}

// Create Event Card
function createEventCard(id, event) {
    const card = document.createElement('div');
    card.className = 'card event-card';
    card.innerHTML = `
        <div class="card-banner">
            <img src="${event.bannerUrl || '../images/default-event.jpg'}" alt="${event.name}">
        </div>
        <div class="card-content">
            <h3>${event.name}</h3>
            <p class="event-type">${event.type}</p>
            <p class="event-date">${formatDate(event.startDate)} - ${formatDate(event.endDate)}</p>
            <p class="event-location">${event.location}</p>
            <div class="event-stats">
                <span><i class="material-icons">people</i> ${event.registeredAttendees || 0}/${event.maxAttendees}</span>
                <span><i class="material-icons">attach_money</i> ${event.entryFee}</span>
            </div>
            <div class="card-actions">
                <button onclick="editEvent('${id}')" class="action-btn edit-btn">
                    <i class="material-icons">edit</i>
                </button>
                <button onclick="deleteEvent('${id}')" class="action-btn delete-btn">
                    <i class="material-icons">delete</i>
                </button>
                <button onclick="viewAttendees('${id}')" class="action-btn view-btn">
                    <i class="material-icons">people</i>
                </button>
            </div>
        </div>
    `;
    return card;
}

// Create Event
async function createEvent(formData) {
    try {
        const bannerFile = formData.get('banner');
        let bannerUrl = '';
        
        if (bannerFile) {
            bannerUrl = await uploadEventBanner(bannerFile);
        }
        
        const eventData = {
            name: formData.get('name'),
            type: formData.get('type'),
            startDate: new Date(formData.get('startDate')),
            endDate: new Date(formData.get('endDate')),
            location: formData.get('location'),
            maxAttendees: parseInt(formData.get('maxAttendees')),
            entryFee: parseFloat(formData.get('entryFee')),
            description: formData.get('description'),
            bannerUrl: bannerUrl,
            registeredAttendees: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await addDoc(collection(db, 'events'), eventData);
        showNotification('Event created successfully', 'success');
        closeEventModal();
    } catch (error) {
        console.error('Error creating event:', error);
        showNotification('Error creating event', 'error');
    }
}

// Upload Event Banner
async function uploadEventBanner(file) {
    const storageRef = ref(storage, `events/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
}

// Edit Event
async function editEvent(id) {
    try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        const event = eventDoc.data();
        
        createEventModal.innerHTML = `
            <div class="modal-content">
                <h2>Edit Event</h2>
                <form id="eventForm">
                    <div class="form-group">
                        <label>Event Name</label>
                        <input type="text" id="eventName" value="${event.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Event Type</label>
                        <select id="eventType" required>
                            <option value="tournament" ${event.type === 'tournament' ? 'selected' : ''}>Tournament</option>
                            <option value="competition" ${event.type === 'competition' ? 'selected' : ''}>Competition</option>
                            <option value="meetup" ${event.type === 'meetup' ? 'selected' : ''}>Meetup</option>
                            <option value="workshop" ${event.type === 'workshop' ? 'selected' : ''}>Workshop</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="datetime-local" id="eventStart" value="${formatDateForInput(event.startDate)}" required>
                    </div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="datetime-local" id="eventEnd" value="${formatDateForInput(event.endDate)}" required>
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="eventLocation" value="${event.location}" required>
                    </div>
                    <div class="form-group">
                        <label>Max Attendees</label>
                        <input type="number" id="maxAttendees" value="${event.maxAttendees}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Entry Fee</label>
                        <input type="number" id="entryFee" value="${event.entryFee}" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Event Banner</label>
                        <input type="file" id="eventBanner" accept="image/*">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="eventDescription" required>${event.description}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="action-btn">Update Event</button>
                        <button type="button" class="cancel-btn" onclick="closeEventModal()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        createEventModal.style.display = 'block';
        
        // Update form submission handler
        document.getElementById('eventForm').onsubmit = (e) => {
            e.preventDefault();
            updateEvent(id, new FormData(e.target));
        };
    } catch (error) {
        console.error('Error loading event:', error);
        showNotification('Error loading event', 'error');
    }
}

// Update Event
async function updateEvent(id, formData) {
    try {
        const eventRef = doc(db, 'events', id);
        const bannerFile = formData.get('banner');
        let bannerUrl = '';
        
        if (bannerFile) {
            bannerUrl = await uploadEventBanner(bannerFile);
        }
        
        const updateData = {
            name: formData.get('name'),
            type: formData.get('type'),
            startDate: new Date(formData.get('startDate')),
            endDate: new Date(formData.get('endDate')),
            location: formData.get('location'),
            maxAttendees: parseInt(formData.get('maxAttendees')),
            entryFee: parseFloat(formData.get('entryFee')),
            description: formData.get('description'),
            updatedAt: new Date()
        };
        
        if (bannerUrl) {
            updateData.bannerUrl = bannerUrl;
        }
        
        await updateDoc(eventRef, updateData);
        showNotification('Event updated successfully', 'success');
        closeEventModal();
    } catch (error) {
        console.error('Error updating event:', error);
        showNotification('Error updating event', 'error');
    }
}

// Delete Event
async function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            await deleteDoc(doc(db, 'events', id));
            showNotification('Event deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting event:', error);
            showNotification('Error deleting event', 'error');
        }
    }
}

// View Attendees
function viewAttendees(id) {
    // Implementation for viewing attendees
    console.log('View attendees for event:', id);
}

// Setup Event Listeners
function setupEventListeners() {
    createEventBtn.addEventListener('click', () => {
        createEventModal.style.display = 'block';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === createEventModal) {
            closeEventModal();
        }
    });
    
    document.getElementById('eventForm').addEventListener('submit', (e) => {
        e.preventDefault();
        createEvent(new FormData(e.target));
    });
}

// Setup Realtime Updates
function setupRealtimeUpdates() {
    const eventsQuery = query(
        collection(db, 'events'),
        orderBy('createdAt', 'desc')
    );
    
    onSnapshot(eventsQuery, (snapshot) => {
        updateEventsGrid(snapshot.docs);
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
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function closeEventModal() {
    createEventModal.style.display = 'none';
    document.getElementById('eventForm').reset();
}

// Export functions for use in other modules
export {
    createEvent,
    editEvent,
    deleteEvent,
    viewAttendees
};
