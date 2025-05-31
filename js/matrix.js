// Matrix rain effect
const loadingCanvas = document.getElementById('matrixCanvas');
const loadingCtx = loadingCanvas.getContext('2d');

// Get all background canvases
const bgCanvases = [
    document.getElementById('bgMatrixCanvas1'),
    document.getElementById('bgMatrixCanvas2'),
    document.getElementById('bgMatrixCanvas3'),
    document.getElementById('bgMatrixCanvas4'),
    document.getElementById('bgMatrixCanvas5')
];

const bgContexts = bgCanvases.map(canvas => canvas.getContext('2d'));

// Set canvas size to match logo container
function resizeCanvas() {
    const containers = document.querySelectorAll('.logo-container');
    containers.forEach(container => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        }
    });
}

// Characters to use (mix of katakana and matrix-style characters)
const characters = 'ｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890';
const fontSize = 16;

// Initialize drops for a canvas
function initDrops(canvas) {
    const columns = Math.floor(canvas.width / fontSize);
    const drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
    }
    return drops;
}

// Initialize drops for all canvases
let loadingDrops = initDrops(loadingCanvas);
let bgDropsArray = bgCanvases.map(canvas => initDrops(canvas));

// Drawing function for a specific canvas
function drawMatrix(ctx, canvas, drops) {
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
function animate() {
    if (loadingCanvas) {
        drawMatrix(loadingCtx, loadingCanvas, loadingDrops);
    }
    
    // Draw matrix effect for all background canvases
    bgCanvases.forEach((canvas, index) => {
        if (canvas) {
            drawMatrix(bgContexts[index], canvas, bgDropsArray[index]);
        }
    });
    
    requestAnimationFrame(animate);
}

// Initialize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animate();
