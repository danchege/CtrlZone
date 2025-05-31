// Import Firebase services
import { auth, db, storage } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeForms();
    initializeAnimations();
    initializeMap();
});

// Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close navigation on link click (mobile)
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Initialize all forms
function initializeForms() {
    initializeTournamentForm();
    initializeBookingForm();
    initializeContactForm();
}

// Tournament Registration Modal
const modal = document.getElementById('tournamentModal');
const registerBtns = document.querySelectorAll('.register-btn');
const closeBtn = document.querySelector('.close');
const tournamentForm = document.getElementById('tournamentForm');

registerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tournament = btn.dataset.tournament;
        const gameSelect = tournamentForm.querySelector('select[name="game"]');
        gameSelect.value = tournament;
        modal.style.display = 'block';
    });
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Form handler functions
async function handleFormSubmission(formData, type) {
    try {
        let data = Object.fromEntries(formData);
        let collectionRef;
        
        switch(type) {
            case 'tournament':
                collectionRef = collection(db, 'tournaments');
                break;
            case 'Booking':
                collectionRef = collection(db, 'bookings');
                break;
            case 'Contact':
                collectionRef = collection(db, 'contacts');
                break;
            default:
                throw new Error('Invalid form type');
        }

        // Add timestamp
        data.timestamp = new Date().toISOString();
        
        // Add to Firestore
        const docRef = await addDoc(collectionRef, data);
        console.log(`${type} document written with ID: ${docRef.id}`);
        
        return docRef.id;
    } catch (error) {
        console.error('Error submitting form:', error);
        throw error;
    }
}

// Initialize form submissions (to be integrated with Firebase later)
function initializeTournamentForm() {
    const tournamentForm = document.getElementById('tournamentForm');
    const availableSlotsElement = document.getElementById('availableSlots');
    let currentSlot = 1;
    const maxSlots = 16;

    if (!tournamentForm) return;

    // Update slot counter display
    function updateSlotDisplay() {
        if (availableSlotsElement) {
            const remainingSlots = maxSlots - (currentSlot - 1);
            availableSlotsElement.textContent = remainingSlots;
            
            // Visual feedback for remaining slots
            if (remainingSlots <= 3) {
                availableSlotsElement.style.color = '#ff6b6b';
            }
        }
    }

    // Initialize slot display
    updateSlotDisplay();

    tournamentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = tournamentForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        try {
            // Check if slots are available
            if (currentSlot > maxSlots) {
                alert('Sorry, all tournament slots are filled!');
                return;
            }

            // Get form data
            const formData = new FormData(this);
            formData.append('slotNumber', currentSlot.toString());

            // Submit registration
            await handleFormSubmission(formData, 'tournament');

            // Show success message with slot number
            alert(`Registration successful! Your slot number is: ${currentSlot}`);

            // Update slot counter
            currentSlot++;
            updateSlotDisplay();

            // Reset form
            this.reset();

            // Disable form if all slots are filled
            if (currentSlot > maxSlots) {
                this.innerHTML = '<p class="slots-full">Tournament registration is now closed.</p>';
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Error submitting registration. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register Now';
        }
    });
}

function initializeBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    if (!bookingForm) return;

    const gameType = document.getElementById('gameType');
    const durationSelect = document.getElementById('durationSelect');
    const matchSelect = document.getElementById('matchSelect');
    const gamesSelect = document.getElementById('gamesSelect');
    const specificGame = document.getElementById('specificGame');

    // Game options by type
    const gameOptions = {
        sports: [{ value: 'fc25', text: 'FC 25' }],
        fighting: [
            { value: 'mk', text: 'Mortal Kombat' },
            { value: 'tekken', text: 'Tekken' }
        ],
        mission: [
            { value: 'gta5', text: 'Grand Theft Auto 5' },
            { value: 'lastofus', text: 'The Last of Us' },
            { value: 'daysgone', text: 'Days Gone' },
            { value: 'uncharted4', text: 'Uncharted 4' },
            { value: 'codbo', text: 'Call of Duty Black Ops' },
            { value: 'codww2', text: 'Call of Duty WW2' },
            { value: 'codmw', text: 'Call of Duty: Modern Warfare' },
            { value: 're4', text: 'Resident Evil 4' },
            { value: 'farcry', text: 'Far Cry' },
            { value: 'rdr', text: 'Red Dead Redemption' },
            { value: 'watchdogs', text: 'Watch Dogs' },
            { value: 'tombraider', text: 'Shadow of Tomb Raider' },
            { value: 'ghostrecon', text: 'Ghost Recon' },
            { value: 'battlefield', text: 'Battlefield' },
            { value: 'spiderman', text: 'Spider-Man: Miles Morales' },
            { value: 'gow', text: 'God of War' },
            { value: 'madmax', text: 'Mad Max' },
            { value: 'untildawn', text: 'Until Dawn' }
        ]
    };

    // Set minimum date-time to now
    const dateTimeInput = bookingForm.querySelector('input[type="datetime-local"]');
    if (dateTimeInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        dateTimeInput.min = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Handle game type selection
    gameType.addEventListener('change', () => {
        const selectedType = gameType.value;
        
        // Reset all selects
        [durationSelect, matchSelect, gamesSelect].forEach(select => {
            select.classList.remove('visible');
            select.style.display = 'none';
            // Reset the select value
            const selectElement = select.querySelector('select');
            if (selectElement) selectElement.value = '';
        });

        // Show relevant select based on game type
        switch(selectedType) {
            case 'sports':
                gamesSelect.style.display = 'block';
                setTimeout(() => gamesSelect.classList.add('visible'), 0);
                break;
            case 'fighting':
                matchSelect.style.display = 'block';
                setTimeout(() => matchSelect.classList.add('visible'), 0);
                break;
            case 'mission':
                durationSelect.style.display = 'block';
                setTimeout(() => durationSelect.classList.add('visible'), 0);
                break;
        }

        // Update specific game options
        specificGame.innerHTML = '<option value="">Select Game</option>';
        if (gameOptions[selectedType]) {
            gameOptions[selectedType].forEach(game => {
                const option = document.createElement('option');
                option.value = game.value;
                option.textContent = game.text;
                specificGame.appendChild(option);
            });
        }
    });

    // Form submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        try {
            const formData = new FormData(bookingForm);
            const gameType = formData.get('game_type');
            let pricing = '';

            // Calculate pricing based on game type and duration/matches
            switch(gameType) {
                case 'sports':
                    const games = formData.get('games');
                    pricing = `KSH ${40 * games}`;
                    break;
                case 'fighting':
                    const matches = formData.get('matches');
                    pricing = `KSH ${20 * matches}`;
                    break;
                case 'mission':
                    const duration = formData.get('duration');
                    pricing = `KSH ${(duration / 30) * 50}`;
                    break;
            }

            formData.append('pricing', pricing);
            await handleFormSubmission(formData, 'Booking');
            alert(`Booking submitted successfully!\nEstimated Cost: ${pricing}\nWe will confirm your slot soon.`);
            bookingForm.reset();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('There was an error processing your booking. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Book Now';
        }
    });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const formData = new FormData(contactForm);
            await handleFormSubmission(formData, 'Contact');
            alert('Message sent successfully! We will get back to you soon.');
            contactForm.reset();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('There was an error sending your message. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
}

function initializeNavigation() {
    // Mobile navigation toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close navigation on link click (mobile)
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
}

function initializeAnimations() {
    // Add glowing effect to cards on hover
    const cards = document.querySelectorAll('.game-card, .service-card, .tournament-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.animation = 'glow 1.5s infinite';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.animation = 'none';
        });
    });
}

// Get current location and update map
function initializeMap() {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;

    // Create loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'map-loading';
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
    mapContainer.appendChild(loadingDiv);

    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            function(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                // Update the map iframe with current location
                const iframe = mapContainer.querySelector('iframe');
                if (iframe) {
                    const zoom = 15; // Higher zoom level for better location precision
                    const newSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.817028920325!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f${zoom}!3m3!1m2!1s0x0%3A0x0!2zM8KwMTcnMjIuMCJTIDM2wrAwMSc0OC44IkU!5e0!3m2!1sen!2sus!4v1635000000000!5m2!1sen!2sus`;
                    iframe.src = newSrc;
                }
                
                // Remove loading indicator
                loadingDiv.remove();
            },
            function(error) {
                console.log("Error getting location:", error);
                let errorMessage = "Unable to get your location. ";
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Please enable location access to see nearby gaming centers.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Location request timed out.";
                        break;
                    default:
                        errorMessage += "An unknown error occurred.";
                }
                
                // Show error message
                loadingDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorMessage}`;
                loadingDiv.className = 'map-error';
                
                // Fallback to default Nakuru location after 5 seconds
                setTimeout(() => {
                    loadingDiv.remove();
                }, 5000);
            },
            options
        );
    } else {
        loadingDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Geolocation is not supported by your browser.';
        loadingDiv.className = 'map-error';
        setTimeout(() => {
            loadingDiv.remove();
        }, 5000);
    }
}
