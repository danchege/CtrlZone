import { db } from '../firebase-config.js';
import { 
    collection,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    getDocs,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// DOM Elements
const messageList = document.getElementById('messageList');
const messageView = document.getElementById('messageView');

// Initialize Messages
document.addEventListener('DOMContentLoaded', () => {
    initializeMessages();
    setupEventListeners();
});

// Initialize Messages
async function initializeMessages() {
    await loadMessages();
    setupRealtimeUpdates();
}

// Load Messages
async function loadMessages() {
    try {
        const messagesQuery = query(
            collection(db, 'contacts'),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(messagesQuery);
        updateMessageList(snapshot.docs);
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Error loading messages', 'error');
    }
}

// Update Message List
function updateMessageList(messages) {
    messageList.innerHTML = '';
    
    messages.forEach(doc => {
        const message = doc.data();
        const messageItem = createMessageItem(doc.id, message);
        messageList.appendChild(messageItem);
    });
}

// Create Message Item
function createMessageItem(id, message) {
    const item = document.createElement('div');
    item.className = `message-item ${message.status === 'unread' ? 'unread' : ''}`;
    item.onclick = () => viewMessage(id, message);
    
    const date = message.createdAt.toDate();
    
    item.innerHTML = `
        <div class="message-header">
            <h4>${message.name}</h4>
            <span class="message-date">${formatDate(date)}</span>
        </div>
        <p class="message-subject">${message.subject || 'No Subject'}</p>
        <p class="message-preview">${message.message.substring(0, 100)}...</p>
    `;
    
    return item;
}

// View Message
function viewMessage(id, message) {
    messageView.innerHTML = `
        <div class="message-details">
            <div class="message-actions">
                <button onclick="markAsRead('${id}')" class="action-btn" ${message.status === 'read' ? 'disabled' : ''}>
                    <i class="fas fa-check"></i> Mark as Read
                </button>
                <button onclick="deleteMessage('${id}')" class="delete-btn">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            <div class="message-content">
                <h3>${message.subject || 'No Subject'}</h3>
                <div class="sender-info">
                    <p><strong>From:</strong> ${message.name}</p>
                    <p><strong>Email:</strong> ${message.email}</p>
                    <p><strong>Phone:</strong> ${message.phone || 'Not provided'}</p>
                    <p><strong>Date:</strong> ${formatDateTime(message.createdAt.toDate())}</p>
                </div>
                <div class="message-body">
                    <p>${message.message}</p>
                </div>
            </div>
            <div class="message-response">
                <button onclick="showReplyForm('${id}')" class="reply-btn">
                    <i class="fas fa-reply"></i> Reply
                </button>
            </div>
        </div>
    `;
    
    // Mark as read when viewed
    if (message.status === 'unread') {
        markAsRead(id);
    }
}

// Mark Message as Read
async function markAsRead(id) {
    try {
        const messageRef = doc(db, 'contacts', id);
        await updateDoc(messageRef, {
            status: 'read',
            readAt: new Date()
        });
        showNotification('Message marked as read', 'success');
    } catch (error) {
        console.error('Error marking message as read:', error);
        showNotification('Error marking message as read', 'error');
    }
}

// Delete Message
async function deleteMessage(id) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            await deleteDoc(doc(db, 'contacts', id));
            showNotification('Message deleted successfully', 'success');
            messageView.innerHTML = '<p class="no-message">Select a message to view</p>';
        } catch (error) {
            console.error('Error deleting message:', error);
            showNotification('Error deleting message', 'error');
        }
    }
}

// Show Reply Form
function showReplyForm(id) {
    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    replyForm.innerHTML = `
        <form id="replyForm">
            <div class="form-group">
                <label>Reply Message</label>
                <textarea id="replyMessage" required></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="action-btn">Send Reply</button>
                <button type="button" class="cancel-btn" onclick="closeReplyForm()">Cancel</button>
            </div>
        </form>
    `;
    
    document.querySelector('.message-response').appendChild(replyForm);
    
    document.getElementById('replyForm').onsubmit = async (e) => {
        e.preventDefault();
        await sendReply(id, e.target.replyMessage.value);
    };
}

// Send Reply
async function sendReply(messageId, replyText) {
    try {
        const messageRef = doc(db, 'contacts', messageId);
        await updateDoc(messageRef, {
            replied: true,
            repliedAt: new Date(),
            reply: replyText
        });
        showNotification('Reply sent successfully', 'success');
        closeReplyForm();
    } catch (error) {
        console.error('Error sending reply:', error);
        showNotification('Error sending reply', 'error');
    }
}

// Close Reply Form
function closeReplyForm() {
    const replyForm = document.querySelector('.reply-form');
    if (replyForm) {
        replyForm.remove();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Add any additional event listeners here
}

// Setup Realtime Updates
function setupRealtimeUpdates() {
    const messagesQuery = query(
        collection(db, 'contacts'),
        orderBy('createdAt', 'desc')
    );
    
    onSnapshot(messagesQuery, (snapshot) => {
        updateMessageList(snapshot.docs);
    });
}

// Helper Functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
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
    markAsRead,
    deleteMessage,
    sendReply
}; 