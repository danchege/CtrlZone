import { getFirestore, collection, query, where, getDocs, doc, updateDoc, onSnapshot, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export class MessageManager {
    constructor(app) {
        this.db = getFirestore(app);
        this.unsubscribe = null;
        this.selectedMessageId = null;
        this.initializeListeners();
    }

    initializeListeners() {
        // Start real-time message updates
        this.startMessageListener();

        // Handle message selection
        document.getElementById('messageList').addEventListener('click', (e) => {
            const messageItem = e.target.closest('.message-item');
            if (messageItem) {
                this.selectMessage(messageItem.dataset.id);
            }
        });
    }

    async startMessageListener() {
        try {
            // Create query for unread messages first
            const q = query(
                collection(this.db, 'messages'),
                orderBy('timestamp', 'desc'),
                limit(50)
            );

            // Set up real-time listener
            this.unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const message = {
                        id: change.doc.id,
                        ...change.doc.data()
                    };

                    if (change.type === 'added') {
                        this.addMessageToList(message);
                    } else if (change.type === 'modified') {
                        this.updateMessageInList(message);
                    } else if (change.type === 'removed') {
                        this.removeMessageFromList(message.id);
                    }
                });
            });

        } catch (error) {
            console.error('Error starting message listener:', error);
            this.showError('Failed to load messages');
        }
    }

    addMessageToList(message) {
        const messageList = document.getElementById('messageList');
        const messageItem = this.createMessageListItem(message);
        
        // Add to the beginning of the list
        if (messageList.firstChild) {
            messageList.insertBefore(messageItem, messageList.firstChild);
        } else {
            messageList.appendChild(messageItem);
        }

        // If this is a new unread message, show notification
        if (!message.read && message.timestamp > (Date.now() - 5000)) {
            this.showNotification(message);
        }
    }

    updateMessageInList(message) {
        const existingItem = document.querySelector(`.message-item[data-id="${message.id}"]`);
        if (existingItem) {
            const newItem = this.createMessageListItem(message);
            existingItem.replaceWith(newItem);

            // Update message view if this is the selected message
            if (this.selectedMessageId === message.id) {
                this.selectMessage(message.id);
            }
        }
    }

    removeMessageFromList(messageId) {
        const item = document.querySelector(`.message-item[data-id="${messageId}"]`);
        if (item) {
            item.remove();
        }
    }

    createMessageListItem(message) {
        const item = document.createElement('div');
        item.className = `message-item ${message.read ? 'read' : 'unread'}`;
        item.dataset.id = message.id;
        
        const timestamp = new Date(message.timestamp);
        const timeString = timestamp.toLocaleString();

        item.innerHTML = `
            <div class="message-preview">
                <div class="message-header">
                    <span class="message-from">${message.senderName}</span>
                    <span class="message-time">${timeString}</span>
                </div>
                <div class="message-subject">${message.subject}</div>
                <div class="message-snippet">${message.content.substring(0, 100)}...</div>
            </div>
        `;

        return item;
    }

    async selectMessage(messageId) {
        try {
            this.selectedMessageId = messageId;

            // Update UI to show selected message
            document.querySelectorAll('.message-item').forEach(item => {
                item.classList.remove('selected');
                if (item.dataset.id === messageId) {
                    item.classList.add('selected');
                }
            });

            // Get message data
            const messageDoc = await doc(this.db, 'messages', messageId).get();
            const message = messageDoc.data();

            // Mark as read if unread
            if (!message.read) {
                await updateDoc(doc(this.db, 'messages', messageId), {
                    read: true,
                    readAt: new Date().toISOString()
                });
            }

            // Show message in view panel
            const messageView = document.getElementById('messageView');
            messageView.innerHTML = `
                <div class="message-full">
                    <div class="message-header">
                        <h2>${message.subject}</h2>
                        <div class="message-meta">
                            <div class="message-from">
                                <strong>From:</strong> ${message.senderName} (${message.senderEmail})
                            </div>
                            <div class="message-time">
                                <strong>Sent:</strong> ${new Date(message.timestamp).toLocaleString()}
                            </div>
                            ${message.read ? `
                                <div class="message-read-status">
                                    <strong>Read:</strong> ${new Date(message.readAt).toLocaleString()}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="message-content">
                        ${message.content.replace(/\\n/g, '<br>')}
                    </div>
                    <div class="message-actions">
                        <button onclick="window.messageManager.replyToMessage('${messageId}')">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                        <button onclick="window.messageManager.forwardMessage('${messageId}')">
                            <i class="fas fa-share"></i> Forward
                        </button>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error selecting message:', error);
            this.showError('Failed to load message');
        }
    }

    async replyToMessage(messageId) {
        try {
            const messageDoc = await doc(this.db, 'messages', messageId).get();
            const message = messageDoc.data();

            const { value: replyContent } = await Swal.fire({
                title: 'Reply to Message',
                html: `
                    <div class="form-group">
                        <label>To: ${message.senderName}</label>
                    </div>
                    <div class="form-group">
                        <label>Subject: Re: ${message.subject}</label>
                    </div>
                    <div class="form-group">
                        <textarea id="swal-reply" class="swal2-textarea" placeholder="Type your reply..."></textarea>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => document.getElementById('swal-reply').value
            });

            if (replyContent) {
                // Create reply message
                const replyRef = doc(collection(this.db, 'messages'));
                await setDoc(replyRef, {
                    senderName: 'Admin',
                    senderEmail: 'admin@ctrlzone.com',
                    recipientId: message.senderId,
                    recipientName: message.senderName,
                    recipientEmail: message.senderEmail,
                    subject: `Re: ${message.subject}`,
                    content: replyContent,
                    timestamp: new Date().toISOString(),
                    read: false,
                    replyTo: messageId
                });

                this.showSuccess('Reply sent successfully');
            }

        } catch (error) {
            console.error('Error sending reply:', error);
            this.showError('Failed to send reply');
        }
    }

    async forwardMessage(messageId) {
        try {
            const messageDoc = await doc(this.db, 'messages', messageId).get();
            const message = messageDoc.data();

            const { value: formValues } = await Swal.fire({
                title: 'Forward Message',
                html: `
                    <div class="form-group">
                        <label>To:</label>
                        <input id="swal-recipient" class="swal2-input" placeholder="Recipient Email">
                    </div>
                    <div class="form-group">
                        <label>Subject: Fwd: ${message.subject}</label>
                    </div>
                    <div class="form-group">
                        <textarea id="swal-content" class="swal2-textarea">

-------- Original Message --------
From: ${message.senderName}
Date: ${new Date(message.timestamp).toLocaleString()}

${message.content}</textarea>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => ({
                    recipient: document.getElementById('swal-recipient').value,
                    content: document.getElementById('swal-content').value
                })
            });

            if (formValues) {
                // Create forwarded message
                const forwardRef = doc(collection(this.db, 'messages'));
                await setDoc(forwardRef, {
                    senderName: 'Admin',
                    senderEmail: 'admin@ctrlzone.com',
                    recipientEmail: formValues.recipient,
                    subject: `Fwd: ${message.subject}`,
                    content: formValues.content,
                    timestamp: new Date().toISOString(),
                    read: false,
                    forwardedFrom: messageId
                });

                this.showSuccess('Message forwarded successfully');
            }

        } catch (error) {
            console.error('Error forwarding message:', error);
            this.showError('Failed to forward message');
        }
    }

    showNotification(message) {
        // Create and show browser notification
        if (Notification.permission === 'granted') {
            new Notification('New Message', {
                body: `From: ${message.senderName}\n${message.subject}`,
                icon: '/path/to/notification-icon.png'
            });
        }

        // Show in-app notification
        this.showSuccess(`New message from ${message.senderName}`);
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

    // Clean up listener when module is destroyed
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}
