// Loading screen handler
class LoadingScreen {
    constructor(loadingScreen) {
        this.loadingScreen = loadingScreen;
        this.loadingBar = loadingScreen.querySelector('.loading-bar');
        this.matrixCanvas = loadingScreen.querySelector('.matrix-logo-bg');
        this.initialize();
    }

    initialize() {
        // Start the loading bar animation
        if (this.loadingBar) {
            this.loadingBar.style.width = '100%';
        }

        // Hide loading screen after exactly 3 seconds
        setTimeout(() => {
            this.hide();
        }, 1000); // 1 second delay
    }

    hide() {
        this.loadingScreen.classList.add('hidden');
        // Remove from DOM after transition
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
        }, 500);
    }

    show() {
        this.loadingScreen.style.display = 'flex';
        this.loadingScreen.classList.remove('hidden');
        if (this.loadingBar) {
            this.loadingBar.style.width = '100%';
        }
    }
}

// Initialize all loading screens when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loadingScreens = document.querySelectorAll('.loading-screen');
    loadingScreens.forEach(screen => {
        new LoadingScreen(screen);
    });
});

// Export for use in other modules
window.LoadingScreen = LoadingScreen;
