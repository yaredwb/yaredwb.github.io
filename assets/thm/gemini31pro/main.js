// Utility to resize canvases
function resizeCanvas(canvas) {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
}

// Porosity Simulation
function initPorositySimulation() {
    const canvas = document.getElementById('porosityCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('porositySlider');
    const valueDisplay = document.getElementById('porosityValue');
    
    resizeCanvas(canvas);
    
    // Generate static grid of grains
    const grains = [];
    const cols = 8;
    const rows = 6;
    const padding = 20;
    
    const w = canvas.width - padding*2;
    const h = canvas.height - padding*2;
    
    for(let i=0; i<cols; i++) {
        for(let j=0; j<rows; j++) {
            // Add some randomness to position
            grains.push({
                x: padding + (w / (cols - 1)) * i + (Math.random() * 10 - 5),
                y: padding + (h / (rows - 1)) * j + (Math.random() * 10 - 5),
                baseRadius: Math.min(w/cols, h/rows) * 0.5
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Target porosity from slider
        const targetPorosity = parseFloat(slider.value);
        valueDisplay.textContent = targetPorosity.toFixed(2);
        
        // In a 2D approximation, area fraction ~ porosity.
        // Solid fraction = 1 - porosity
        const solidFraction = 1 - targetPorosity;
        
        // Scale radius based on solid fraction (simplification)
        // Max solid fraction is around 0.9 for this visualization
        const radiusScale = Math.sqrt(solidFraction / 0.9);

        // Draw grains
        grains.forEach(g => {
            ctx.beginPath();
            ctx.arc(g.x, g.y, g.baseRadius * radiusScale, 0, Math.PI * 2);
            ctx.fillStyle = '#94a3b8'; // Rock color
            ctx.fill();
            
            // Add grain texture/highlight
            ctx.beginPath();
            ctx.arc(g.x - (g.baseRadius * radiusScale * 0.3), g.y - (g.baseRadius * radiusScale * 0.3), g.baseRadius * radiusScale * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();
        });

        // Add "water" in the background
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'rgba(0, 201, 255, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
    }

    slider.addEventListener('input', draw);
    draw();
    
    window.addEventListener('resize', () => {
        resizeCanvas(canvas);
        draw();
    });
}

// Darcy Flow Simulation
function initDarcySimulation() {
    const canvas = document.getElementById('darcyCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('darcySlider');
    
    resizeCanvas(canvas);
    
    const particles = [];
    const numParticles = 100;
    
    for(let i=0; i<numParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speedOffset: Math.random() * 0.5 + 0.5,
            size: Math.random() * 2 + 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const pressureGradient = parseFloat(slider.value);
        
        // Draw fluid particles
        ctx.fillStyle = '#00c9ff';
        
        particles.forEach(p => {
            p.x += pressureGradient * p.speedOffset;
            
            if (p.x > canvas.width) {
                p.x = 0;
                p.y = Math.random() * canvas.height;
            }
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw trail
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - (pressureGradient * p.speedOffset * 3), p.y);
            ctx.strokeStyle = 'rgba(0, 201, 255, 0.3)';
            ctx.stroke();
        });
        
        // Draw some static "grains" to show flow around them
        ctx.fillStyle = '#334155';
        for(let i=0; i<5; i++) {
            ctx.beginPath();
            ctx.arc(canvas.width * 0.2 * i + 50, canvas.height/2 + Math.sin(i)*20, 20, 0, Math.PI*2);
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        resizeCanvas(canvas);
    });
}

// Couplings Interactive Diagram
function initCouplingsDiagram() {
    const paths = {
        'path-th': 'info-th',
        'path-hm': 'info-hm',
        'path-mt': 'info-mt'
    };
    
    const allInfos = document.querySelectorAll('.coupling-info');
    const defaultInfo = document.getElementById('info-default');

    Object.keys(paths).forEach(pathId => {
        const path = document.getElementById(pathId);
        const infoId = paths[pathId];
        const infoElement = document.getElementById(infoId);
        
        if (path && infoElement) {
            path.addEventListener('mouseenter', () => {
                allInfos.forEach(el => el.classList.remove('active'));
                infoElement.classList.add('active');
            });
            
            path.addEventListener('mouseleave', () => {
                allInfos.forEach(el => el.classList.remove('active'));
                if(defaultInfo) defaultInfo.classList.add('active');
            });
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initPorositySimulation();
    initDarcySimulation();
    initCouplingsDiagram();
});
