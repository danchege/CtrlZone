import { db } from '../firebase-config.js';
import { 
    doc,
    getDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// DOM Elements
const generalSettingsForm = document.getElementById('generalSettingsForm');
const notificationSettingsForm = document.getElementById('notificationSettingsForm');

// Initialize Settings
document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    setupEventListeners();
});

// Initialize Settings
async function initializeSettings() {
    await loadSettings();
}

// Load Settings
async function loadSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        const notificationDoc = await getDoc(doc(db, 'settings', 'notifications'));
        
        if (settingsDoc.exists()) {
            populateGeneralSettings(settingsDoc.data());
        }
        
        if (notificationDoc.exists()) {
            populateNotificationSettings(notificationDoc.data());
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Error loading settings', 'error');
    }
}

// Populate General Settings
function populateGeneralSettings(settings) {
    document.getElementById('centerName').value = settings.centerName || '';
    document.getElementById('contactEmail').value = settings.contactEmail || '';
    document.getElementById('operatingHours').value = settings.operatingHours || '';
}

// Populate Notification Settings
function populateNotificationSettings(settings) {
    document.getElementById('emailNotifications').checked = settings.emailEnabled || false;
    document.getElementById('smsNotifications').checked = settings.smsEnabled || false;
}

// Update General Settings
async function updateGeneralSettings(formData) {
    try {
        const settingsRef = doc(db, 'settings', 'general');
        const updateData = {
            centerName: formData.get('centerName'),
            contactEmail: formData.get('contactEmail'),
            operatingHours: formData.get('operatingHours'),
            updatedAt: new Date()
        };
        
        await updateDoc(settingsRef, updateData);
        showNotification('General settings updated successfully', 'success');
    } catch (error) {
        console.error('Error updating general settings:', error);
        showNotification('Error updating general settings', 'error');
    }
}

// Update Notification Settings
async function updateNotificationSettings(formData) {
    try {
        const settingsRef = doc(db, 'settings', 'notifications');
        const updateData = {
            emailEnabled: formData.get('emailNotifications') === 'on',
            smsEnabled: formData.get('smsNotifications') === 'on',
            updatedAt: new Date()
        };
        
        await updateDoc(settingsRef, updateData);
        showNotification('Notification settings updated successfully', 'success');
    } catch (error) {
        console.error('Error updating notification settings:', error);
        showNotification('Error updating notification settings', 'error');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // General Settings Form
    generalSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateGeneralSettings(new FormData(e.target));
    });
    
    // Notification Settings Form
    notificationSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateNotificationSettings(new FormData(e.target));
    });
}

// Helper Functions
function showNotification(message, type) {
    // Implementation for showing notifications
    console.log(`${type}: ${message}`);
}

// Export functions for use in other modules
export {
    updateGeneralSettings,
    updateNotificationSettings
}; 