// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeForms();
    initializeAnimations();
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
function handleFormSubmission(formData, type) {
    // TODO: Integrate with Firebase
    console.log(`${type} Form Data:`, Object.fromEntries(formData));
    return new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
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
