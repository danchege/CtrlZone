import { db } from './firebase-config.js';
import { 
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Tournament Operations
export async function createTournament(tournamentData) {
    try {
        const docRef = await addDoc(collection(db, 'tournaments'), {
            ...tournamentData,
            createdAt: new Date().toISOString(),
            participants: [],
            status: 'upcoming'
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating tournament:', error);
        throw error;
    }
}

export function subscribeTournaments(callback) {
    const q = query(
        collection(db, 'tournaments'),
        orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
        const tournaments = [];
        snapshot.forEach((doc) => {
            tournaments.push({ id: doc.id, ...doc.data() });
        });
        callback(tournaments);
    });
}

// Booking Operations
export async function createBooking(bookingData) {
    try {
        const docRef = await addDoc(collection(db, 'bookings'), {
            ...bookingData,
            createdAt: new Date().toISOString(),
            status: 'pending'
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
}

export function subscribeUserBookings(userId, callback) {
    const q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
        const bookings = [];
        snapshot.forEach((doc) => {
            bookings.push({ id: doc.id, ...doc.data() });
        });
        callback(bookings);
    });
}

// Game Session Operations
export async function updateGameSession(sessionId, sessionData) {
    try {
        const sessionRef = doc(db, 'gameSessions', sessionId);
        await updateDoc(sessionRef, {
            ...sessionData,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating game session:', error);
        throw error;
    }
}

// User Profile Operations
export async function getUserProfile(userId) {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error('User profile not found');
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
}

export async function updateUserProfile(userId, profileData) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...profileData,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

// Real-time Tournament Updates
export function subscribeTournamentUpdates(tournamentId, callback) {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    
    return onSnapshot(tournamentRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        }
    });
}

// Contact Form Submissions
export async function submitContactForm(formData) {
    try {
        const docRef = await addDoc(collection(db, 'contacts'), {
            ...formData,
            createdAt: new Date().toISOString(),
            status: 'unread'
        });
        return docRef.id;
    } catch (error) {
        console.error('Error submitting contact form:', error);
        throw error;
    }
} 