// Matrix rain effect
class MatrixEffect {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.characters = 'ｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890';
        this.fontSize = 16;
        this.drops = [];
        this.isActive = true;

        // Initialize
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        const container = this.canvas.closest('.logo-container');
        if (container) {
            this.canvas.width = container.offsetWidth;
            this.canvas.height = container.offsetHeight;
            this.initDrops();
        }
    }

    initDrops() {
        const columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = [];
        for (let i = 0; i < columns; i++) {
            this.drops[i] = Math.random() * -100;
        }
    }

    draw() {
        if (!this.isActive) return;

        // Semi-transparent black background to create fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set text properties
        this.ctx.font = this.fontSize + 'px monospace';

        // Draw characters
        for (let i = 0; i < this.drops.length; i++) {
            // Random character
            const char = this.characters[Math.floor(Math.random() * this.characters.length)];
            
            // Main character with bright green
            this.ctx.fillStyle = '#0fa';
            this.ctx.fillText(char, i * this.fontSize, this.drops[i] * this.fontSize);

            // Glowing effect
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#0fa';
            
            // Leading character with bright white for emphasis
            if (Math.random() > 0.975) {
                this.ctx.fillStyle = '#fff';
                this.ctx.fillText(char, i * this.fontSize, this.drops[i] * this.fontSize);
            }

            // Reset position if drop reaches bottom
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            // Move drop
            this.drops[i]++;
        }

        // Remove shadow effect for next frame
        this.ctx.shadowBlur = 0;
    }

    animate() {
        if (this.isActive) {
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }

    stop() {
        this.isActive = false;
    }

    start() {
        if (!this.isActive) {
            this.isActive = true;
            this.animate();
        }
    }
}

// Initialize matrix effects for all loading screens
function initializeMatrixEffects() {
    const matrixCanvases = document.querySelectorAll('.matrix-logo-bg');
    matrixCanvases.forEach(canvas => {
        new MatrixEffect(canvas);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeMatrixEffects);

// Re-initialize when new content is loaded (for dynamic content)
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.matches('.loading-screen')) {
                    const canvas = node.querySelector('.matrix-logo-bg');
                    if (canvas) {
                        new MatrixEffect(canvas);
                    }
                }
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
