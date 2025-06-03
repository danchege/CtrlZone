import { getFirestore, doc, updateDoc, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

export class PresenceManager {
    constructor(app) {
        this.db = getFirestore(app);
        this.auth = getAuth(app);
        this.setupPresence();
        this.heartbeatInterval = null;
    }

    setupPresence() {
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                // User is signed in
                this.updateUserStatus(user.uid, true);
                this.startHeartbeat(user.uid);
            } else {
                // User is signed out
                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                    this.heartbeatInterval = null;
                }
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            const user = this.auth.currentUser;
            if (user) {
                const isVisible = !document.hidden;
                this.updateUserStatus(user.uid, isVisible);
            }
        });

        // Handle before unload
        window.addEventListener('beforeunload', () => {
            const user = this.auth.currentUser;
            if (user) {
                // Synchronous update on page unload
                const userRef = doc(this.db, 'users', user.uid);
                try {
                    updateDoc(userRef, {
                        isOnline: false,
                        lastSeen: serverTimestamp()
                    });
                } catch (error) {
                    console.error('Error updating user status:', error);
                }
            }
        });
    }

    startHeartbeat(userId) {
        // Clear any existing heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Update presence every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            this.updateUserStatus(userId, true);
        }, 30000);

        // Set up cleanup on window close
        window.addEventListener('unload', () => {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
        });
    }

    async updateUserStatus(userId, isOnline) {
        try {
            const userRef = doc(this.db, 'users', userId);
            await updateDoc(userRef, {
                isOnline: isOnline,
                lastSeen: isOnline ? serverTimestamp() : serverTimestamp(),
                lastHeartbeat: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    }
}
