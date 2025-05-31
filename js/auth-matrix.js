// Matrix rain effect for auth overlay
class MatrixRain {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.initialize();
        this.startAnimation();
    }

    initialize() {
        // Set canvas size
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Initialize characters
        this.chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        
        // Set up drops
        this.drops = [];
        this.initDrops();

        // Configure style
        this.fontSize = 16;
        this.ctx.font = this.fontSize + 'px monospace';
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.initDrops();
    }

    initDrops() {
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.floor(Math.random() * -100);
        }
    }

    draw() {
        // Semi-transparent black background for trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set text color
        this.ctx.fillStyle = '#0fa';
        this.ctx.font = this.fontSize + 'px monospace';

        // Draw characters
        for (let i = 0; i < this.drops.length; i++) {
            // Random character
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            
            // Draw the character
            this.ctx.fillText(char, i * this.fontSize, this.drops[i] * this.fontSize);

            // Reset drop if it's at the bottom or randomly
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            // Move drop down
            this.drops[i]++;
        }
    }

    startAnimation() {
        const animate = () => {
            this.draw();
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// Initialize matrix effects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Main auth overlay matrix
    const authMatrix = document.getElementById('authMatrixCanvas');
    if (authMatrix) new MatrixRain(authMatrix);

    // Logo matrix
    const logoMatrix = document.getElementById('authLogoMatrix');
    if (logoMatrix) new MatrixRain(logoMatrix);
}); 