import { storage } from './firebase-config.js';
import { 
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Upload profile picture
export async function uploadProfilePicture(userId, file) {
    try {
        const storageRef = ref(storage, `profile-pictures/${userId}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw error;
    }
}

// Upload tournament banner
export async function uploadTournamentBanner(tournamentId, file) {
    try {
        const storageRef = ref(storage, `tournament-banners/${tournamentId}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading tournament banner:', error);
        throw error;
    }
}

// Upload game cover image
export async function uploadGameCover(gameId, file) {
    try {
        const storageRef = ref(storage, `game-covers/${gameId}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading game cover:', error);
        throw error;
    }
}

// Delete file
export async function deleteFile(path) {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

// Get file URL
export async function getFileURL(path) {
    try {
        const storageRef = ref(storage, path);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error('Error getting file URL:', error);
        throw error;
    }
} 