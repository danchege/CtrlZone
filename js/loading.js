document.addEventListener('DOMContentLoaded', () => {
    // Get the loading screen element
    const loadingScreen = document.querySelector('.loading-screen');
    
    // Hide loading screen after 5 seconds
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        // Remove from DOM after transition
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 5000); // 5 seconds delay
});
