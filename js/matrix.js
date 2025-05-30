// Matrix rain effect
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match logo container
function resizeCanvas() {
    const container = document.querySelector('.logo-container');
    if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
    }
}

// Initial resize
resizeCanvas();

// Resize on window change
window.addEventListener('resize', resizeCanvas);

// Characters to use (mix of katakana and matrix-style characters)
const characters = 'ｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890';
const fontSize = 16;
const columns = Math.floor(canvas.width / fontSize);
const drops = [];

// Initialize drops
for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -100;
}

// Drawing function
function draw() {
    // Semi-transparent black background to create fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.fillStyle = '#0fa';
    ctx.font = fontSize + 'px monospace';

    // Draw characters
    for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = characters[Math.floor(Math.random() * characters.length)];
        
        // Main character with full brightness
        ctx.fillStyle = '#0fa';
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        // Glowing effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0fa';
        
        // Leading character with bright white
        if (Math.random() > 0.975) {
            ctx.fillStyle = '#fff';
            ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        }

        // Reset position if drop reaches bottom
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        // Move drop
        drops[i]++;
    }

    // Remove shadow effect for next frame
    ctx.shadowBlur = 0;
}

// Animation loop
let matrixInterval;

// Start matrix animation
function startMatrix() {
    matrixInterval = setInterval(draw, 35);
}

// Stop matrix animation
function stopMatrix() {
    clearInterval(matrixInterval);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Start the matrix effect
startMatrix();

// Stop matrix when loading is complete
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                stopMatrix();
                canvas.style.display = 'none';
            }, 500);
        }
    }, 2000);
});

// Add subtle mouse interaction
canvas.addEventListener('mousemove', (e) => {
    const x = Math.floor(e.clientX / fontSize);
    if (x >= 0 && x < drops.length) {
        // Create ripple effect
        drops[x] = 0;
        if (x > 0) drops[x-1] = 5;
        if (x < drops.length - 1) drops[x+1] = 5;
    }
});
