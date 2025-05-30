class SoundEffects {
    constructor() {
        this.enabled = true;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Initialize
        this.init();
        this.createMuteButton();
    }

    createHoverSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1500, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.03, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    createClickSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1500, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    init() {
        // Add hover sound to buttons and links
        document.querySelectorAll('a, button, .game-card, .cta-button').forEach(element => {
            element.addEventListener('mouseenter', () => this.playHover());
            element.addEventListener('click', () => this.playClick());
        });
    }

    playHover() {
        if (this.enabled) {
            this.createHoverSound();
        }
    }

    playClick() {
        if (this.enabled) {
            this.createClickSound();
        }
    }

    createMuteButton() {
        const button = document.createElement('button');
        button.className = 'sound-toggle';
        button.innerHTML = '<i class="fas fa-volume-up"></i>';
        document.body.appendChild(button);

        button.addEventListener('click', () => {
            this.enabled = !this.enabled;
            button.innerHTML = this.enabled ? 
                '<i class="fas fa-volume-up"></i>' : 
                '<i class="fas fa-volume-mute"></i>';
        });
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SoundEffects();
});
