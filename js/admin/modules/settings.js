import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export class SettingsManager {
    constructor(app) {
        this.db = getFirestore(app);
        this.settings = null;
        this.initializeListeners();
        this.loadSettings();
    }

    initializeListeners() {
        // Save general settings form
        document.getElementById('generalSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGeneralSettings();
        });

        // Save notification settings form
        document.getElementById('notificationSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNotificationSettings();
        });

        // Save booking settings form
        document.getElementById('bookingSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBookingSettings();
        });

        // Save payment settings form
        document.getElementById('paymentSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePaymentSettings();
        });
    }

    async loadSettings() {
        try {
            const settingsDoc = await getDoc(doc(this.db, 'settings', 'global'));
            this.settings = settingsDoc.data() || this.getDefaultSettings();
            this.populateSettingsForms();
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showError('Failed to load settings');
        }
    }

    getDefaultSettings() {
        return {
            general: {
                siteName: 'CtrlZone',
                description: 'Premium Gaming Zone',
                contactEmail: 'contact@ctrlzone.com',
                phoneNumber: '',
                address: '',
                openingHours: '9:00 AM - 10:00 PM',
                maintenanceMode: false
            },
            notifications: {
                emailNotifications: true,
                pushNotifications: true,
                bookingConfirmations: true,
                bookingReminders: true,
                tournamentUpdates: true,
                systemAlerts: true
            },
            booking: {
                maxBookingsPerUser: 2,
                minBookingDuration: 30,
                maxBookingDuration: 240,
                advanceBookingDays: 7,
                cancellationPeriod: 24,
                autoConfirm: true,
                requireDeposit: false
            },
            payment: {
                currency: 'USD',
                baseRate: 10.00,
                depositAmount: 5.00,
                acceptedPaymentMethods: ['card', 'cash'],
                stripeEnabled: false,
                stripePublicKey: '',
                stripeSecretKey: ''
            }
        };
    }

    populateSettingsForms() {
        // Populate General Settings
        const general = this.settings.general;
        document.getElementById('siteName').value = general.siteName;
        document.getElementById('siteDescription').value = general.description;
        document.getElementById('contactEmail').value = general.contactEmail;
        document.getElementById('phoneNumber').value = general.phoneNumber;
        document.getElementById('address').value = general.address;
        document.getElementById('openingHours').value = general.openingHours;
        document.getElementById('maintenanceMode').checked = general.maintenanceMode;

        // Populate Notification Settings
        const notifications = this.settings.notifications;
        document.getElementById('emailNotifications').checked = notifications.emailNotifications;
        document.getElementById('pushNotifications').checked = notifications.pushNotifications;
        document.getElementById('bookingConfirmations').checked = notifications.bookingConfirmations;
        document.getElementById('bookingReminders').checked = notifications.bookingReminders;
        document.getElementById('tournamentUpdates').checked = notifications.tournamentUpdates;
        document.getElementById('systemAlerts').checked = notifications.systemAlerts;

        // Populate Booking Settings
        const booking = this.settings.booking;
        document.getElementById('maxBookingsPerUser').value = booking.maxBookingsPerUser;
        document.getElementById('minBookingDuration').value = booking.minBookingDuration;
        document.getElementById('maxBookingDuration').value = booking.maxBookingDuration;
        document.getElementById('advanceBookingDays').value = booking.advanceBookingDays;
        document.getElementById('cancellationPeriod').value = booking.cancellationPeriod;
        document.getElementById('autoConfirm').checked = booking.autoConfirm;
        document.getElementById('requireDeposit').checked = booking.requireDeposit;

        // Populate Payment Settings
        const payment = this.settings.payment;
        document.getElementById('currency').value = payment.currency;
        document.getElementById('baseRate').value = payment.baseRate;
        document.getElementById('depositAmount').value = payment.depositAmount;
        document.getElementById('stripeEnabled').checked = payment.stripeEnabled;
        document.getElementById('stripePublicKey').value = payment.stripePublicKey;
        document.getElementById('stripeSecretKey').value = payment.stripeSecretKey;

        payment.acceptedPaymentMethods.forEach(method => {
            document.getElementById(`payment-${method}`).checked = true;
        });
    }

    async saveGeneralSettings() {
        try {
            const generalSettings = {
                siteName: document.getElementById('siteName').value,
                description: document.getElementById('siteDescription').value,
                contactEmail: document.getElementById('contactEmail').value,
                phoneNumber: document.getElementById('phoneNumber').value,
                address: document.getElementById('address').value,
                openingHours: document.getElementById('openingHours').value,
                maintenanceMode: document.getElementById('maintenanceMode').checked
            };

            await this.updateSettings('general', generalSettings);
            this.showSuccess('General settings saved successfully');

        } catch (error) {
            console.error('Error saving general settings:', error);
            this.showError('Failed to save general settings');
        }
    }

    async saveNotificationSettings() {
        try {
            const notificationSettings = {
                emailNotifications: document.getElementById('emailNotifications').checked,
                pushNotifications: document.getElementById('pushNotifications').checked,
                bookingConfirmations: document.getElementById('bookingConfirmations').checked,
                bookingReminders: document.getElementById('bookingReminders').checked,
                tournamentUpdates: document.getElementById('tournamentUpdates').checked,
                systemAlerts: document.getElementById('systemAlerts').checked
            };

            await this.updateSettings('notifications', notificationSettings);
            this.showSuccess('Notification settings saved successfully');

        } catch (error) {
            console.error('Error saving notification settings:', error);
            this.showError('Failed to save notification settings');
        }
    }

    async saveBookingSettings() {
        try {
            const bookingSettings = {
                maxBookingsPerUser: parseInt(document.getElementById('maxBookingsPerUser').value),
                minBookingDuration: parseInt(document.getElementById('minBookingDuration').value),
                maxBookingDuration: parseInt(document.getElementById('maxBookingDuration').value),
                advanceBookingDays: parseInt(document.getElementById('advanceBookingDays').value),
                cancellationPeriod: parseInt(document.getElementById('cancellationPeriod').value),
                autoConfirm: document.getElementById('autoConfirm').checked,
                requireDeposit: document.getElementById('requireDeposit').checked
            };

            // Validate settings
            if (bookingSettings.minBookingDuration >= bookingSettings.maxBookingDuration) {
                throw new Error('Minimum booking duration must be less than maximum duration');
            }

            await this.updateSettings('booking', bookingSettings);
            this.showSuccess('Booking settings saved successfully');

        } catch (error) {
            console.error('Error saving booking settings:', error);
            this.showError(error.message || 'Failed to save booking settings');
        }
    }

    async savePaymentSettings() {
        try {
            const acceptedPaymentMethods = ['card', 'cash'].filter(method => 
                document.getElementById(`payment-${method}`).checked
            );

            if (acceptedPaymentMethods.length === 0) {
                throw new Error('At least one payment method must be selected');
            }

            const paymentSettings = {
                currency: document.getElementById('currency').value,
                baseRate: parseFloat(document.getElementById('baseRate').value),
                depositAmount: parseFloat(document.getElementById('depositAmount').value),
                acceptedPaymentMethods: acceptedPaymentMethods,
                stripeEnabled: document.getElementById('stripeEnabled').checked,
                stripePublicKey: document.getElementById('stripePublicKey').value,
                stripeSecretKey: document.getElementById('stripeSecretKey').value
            };

            // Validate Stripe settings
            if (paymentSettings.stripeEnabled && 
                (!paymentSettings.stripePublicKey || !paymentSettings.stripeSecretKey)) {
                throw new Error('Stripe API keys are required when Stripe is enabled');
            }

            await this.updateSettings('payment', paymentSettings);
            this.showSuccess('Payment settings saved successfully');

        } catch (error) {
            console.error('Error saving payment settings:', error);
            this.showError(error.message || 'Failed to save payment settings');
        }
    }

    async updateSettings(section, newSettings) {
        try {
            // Update local settings
            this.settings[section] = newSettings;

            // Update in Firestore
            await setDoc(doc(this.db, 'settings', 'global'), this.settings, { merge: true });

        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
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
