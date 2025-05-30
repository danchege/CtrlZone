class MouseTrail {
    constructor() {
        this.points = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.mousePos = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.spreading = false;
        this.init();
    }

    init() {
        // Setup canvas
        this.canvas.classList.add('mouse-trail');
        document.body.appendChild(this.canvas);
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Mouse event listeners
        document.addEventListener('mousemove', (e) => {
            this.lastMousePos = { ...this.mousePos };
            this.mousePos = { x: e.clientX, y: e.clientY };
            if (!this.spreading) {
                this.spreading = true;
                this.spreadPoints();
            }
        });

        // Start animation
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    spreadPoints() {
        if (!this.spreading) return;

        const dx = this.mousePos.x - this.lastMousePos.x;
        const dy = this.mousePos.y - this.lastMousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {  // Only add points if mouse moved significantly
            // Calculate intermediate points for smooth trail
            const steps = Math.floor(distance / 5);
            for (let i = 0; i < steps; i++) {
                const x = this.lastMousePos.x + (dx * i) / steps;
                const y = this.lastMousePos.y + (dy * i) / steps;
                this.points.push({
                    x,
                    y,
                    age: 0,
                    color: Math.random() > 0.5 ? '#00f3ff' : '#bc13fe' // Randomly use either neon color
                });
            }
        }

        this.points.push({
            x: this.mousePos.x,
            y: this.mousePos.y,
            age: 0,
            color: Math.random() > 0.5 ? '#00f3ff' : '#bc13fe'
        });

        // Limit number of points
        if (this.points.length > 100) {
            this.points = this.points.slice(-100);
        }

        this.spreading = false;
    }

    animate() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw points
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            point.age += 0.05;

            // Remove old points
            if (point.age > 1) {
                this.points.splice(i, 1);
                i--;
                continue;
            }

            // Calculate opacity based on age
            const opacity = 1 - point.age;
            
            // Draw glow effect
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = point.color;
            this.ctx.globalAlpha = opacity * 0.5;
            this.ctx.fill();

            // Draw connecting lines between points
            if (i > 0) {
                const prevPoint = this.points[i - 1];
                this.ctx.beginPath();
                this.ctx.moveTo(prevPoint.x, prevPoint.y);
                this.ctx.lineTo(point.x, point.y);
                this.ctx.strokeStyle = point.color;
                this.ctx.globalAlpha = opacity * 0.3;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize mouse trail when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MouseTrail();
});
