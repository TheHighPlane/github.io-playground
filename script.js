// for any questions about how the code works, please message me on Discord #TheHighPlane
// I know its not perfect, I will try to work on it later on.
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


const balls = [];
const terrains = [];
let timeOfDay = 0; 
const timeSpeed = 0.0002;
let backgroundColor = '#87CEEB';
let ambientLight = 1.0;
let stars = [];


function createStars() {
    stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.6,
            size: Math.random() * 1.5,
            opacity: Math.random() * 0.8 + 0.2
        });
    }
}


class Ball {
    constructor(x, y, radius) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height * 0.5;
        this.radius = radius || Math.random() * 20 + 10;
        this.dx = (Math.random() - 0.5) * 8;
        this.dy = (Math.random() - 0.5) * 8;
        this.color = getRandomColor();
        this.mass = this.radius * this.radius;
        this.glow = Math.random() > 0.8;
        this.glowColor = this.glow ? getRandomColor() : null;
        this.glowIntensity = this.glow ? Math.random() * 0.5 + 0.5 : 0;
    }

    update() {
        
        this.dy += 0.2;

     
        this.x += this.dx;
        this.y += this.dy;

        
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx = -this.dx * 0.9;
        } else if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.dx = -this.dx * 0.9;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.dy = -this.dy * 0.9;
        } else if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.dy = -this.dy * 0.9;
            this.dx *= 0.99; // Friction
        }

      
        for (const terrain of terrains) {
            this.checkTerrainCollision(terrain);
        }
    }

    checkTerrainCollision(terrain) {
        if (terrain.type === 'hill') {
            const centerX = terrain.x + terrain.width / 2;
            const distX = this.x - centerX;
            const normalizedDist = distX / (terrain.width / 2);
            
            if (Math.abs(normalizedDist) <= 1) {
                const hillHeight = Math.cos(normalizedDist * Math.PI) * terrain.height;
                const terrainSurfaceY = terrain.y - hillHeight;
                
                if (this.y + this.radius > terrainSurfaceY && 
                    this.x > terrain.x && this.x < terrain.x + terrain.width) {
                    
                    this.y = terrainSurfaceY - this.radius;
                    
                   
                    const slope = -Math.sin(normalizedDist * Math.PI) * (Math.PI / (terrain.width / 2)) * terrain.height;
                    const normalAngle = Math.atan(slope);
                    const nx = Math.sin(normalAngle);
                    const ny = Math.cos(normalAngle);
                    
                  
                    const dotProduct = this.dx * nx + this.dy * ny;
                    this.dx = this.dx - 2 * dotProduct * nx;
                    this.dy = this.dy - 2 * dotProduct * ny;
                    
                    
                    this.dx *= 0.95;
                    this.dy *= 0.95;
                }
            }
        } else if (terrain.type === 'platform') {
            if (this.x + this.radius > terrain.x && 
                this.x - this.radius < terrain.x + terrain.width && 
                this.y + this.radius > terrain.y && 
                this.y - this.radius < terrain.y + terrain.height) {
                
               
                const overlapLeft = this.x + this.radius - terrain.x;
                const overlapRight = terrain.x + terrain.width - (this.x - this.radius);
                const overlapTop = this.y + this.radius - terrain.y;
                const overlapBottom = terrain.y + terrain.height - (this.y - this.radius);
                
                
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                if (minOverlap === overlapLeft) {
                   
                    this.x = terrain.x - this.radius;
                    this.dx = -this.dx * 0.9;
                } else if (minOverlap === overlapRight) {
                   
                    this.x = terrain.x + terrain.width + this.radius;
                    this.dx = -this.dx * 0.9;
                } else if (minOverlap === overlapTop) {
                    
                    this.y = terrain.y - this.radius;
                    this.dy = -this.dy * 0.9;
                    this.dx *= 0.95; 
                } else if (minOverlap === overlapBottom) {
                   
                    this.y = terrain.y + terrain.height + this.radius;
                    this.dy = -this.dy * 0.9;
                }
            }
        }
    }

    draw() {
        /
        const litColor = applyLighting(this.color, ambientLight);
        
       
        if (this.glow && this.glowColor) {
            const glowLitColor = applyLighting(this.glowColor, ambientLight);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * (1.5 + Math.sin(Date.now() * 0.005) * 0.2), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${hexToRgb(glowLitColor).join(',')},${this.glowIntensity * 0.3})`;
            ctx.fill();
        }
        
      l
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = litColor;
        ctx.fill();
        
        const lightAngle = timeOfDay * Math.PI * 2;
        const highlightX = this.x + Math.cos(lightAngle) * this.radius * 0.6;
        const highlightY = this.y + Math.sin(lightAngle) * this.radius * 0.6;
        
        const highlightGradient = ctx.createRadialGradient(
            highlightX, highlightY, 0,
            highlightX, highlightY, this.radius * 0.8
        );
        
        highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 * ambientLight})`);
        highlightGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = highlightGradient;
        ctx.fill();
    }
}


class Terrain {
    constructor(type, x, y, width, height) {
        this.type = type || (Math.random() > 0.5 ? 'hill' : 'platform');
        this.x = x || Math.random() * canvas.width * 0.8;
        this.y = y || canvas.height * 0.5 + Math.random() * canvas.height * 0.4;
        this.width = width || Math.random() * 200 + 100;
        this.height = height || (this.type === 'hill' ? Math.random() * 100 + 50 : Math.random() * 30 + 20);
        this.color = getRandomEarthTone();
    }

    draw() {
        const litColor = applyLighting(this.color, ambientLight);
        
        if (this.type === 'hill') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            
            const centerX = this.x + this.width / 2;
            const steps = 20;
            
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const x = this.x + t * this.width;
                const distFromCenter = (x - centerX) / (this.width / 2);
                const hillHeight = Math.cos(distFromCenter * Math.PI) * this.height;
                ctx.lineTo(x, this.y - hillHeight);
            }
            
            ctx.lineTo(this.x + this.width, this.y);
            ctx.fillStyle = litColor;
            ctx.fill();
            
            
            ctx.strokeStyle = applyLighting(darkenColor(this.color, 0.2), ambientLight * 0.8);
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
      
            ctx.fillStyle = litColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
       
            ctx.strokeStyle = applyLighting(darkenColor(this.color, 0.2), ambientLight * 0.8);
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            
            const detailColor = applyLighting(darkenColor(this.color, 0.1), ambientLight * 0.9);
            ctx.fillStyle = detailColor;
            for (let i = 0; i < 5; i++) {
                const rx = this.x + Math.random() * this.width;
                const ry = this.y + Math.random() * this.height;
                const rsize = Math.random() * 5 + 2;
                ctx.beginPath();
                ctx.arc(rx, ry, rsize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}


function getRandomColor() {
    const colors = [
        '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', 
        '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', 
        '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', 
        '#FF6E40', '#FF3D00'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomEarthTone() {
    const colors = [
        '#8B4513', '#A0522D', '#CD853F', '#D2B48C', '#BC8F8F',
        '#F4A460', '#DAA520', '#B8860B', '#C0C0C0', '#A9A9A9',
        '#696969', '#2F4F4F', '#556B2F', '#6B8E23', '#808000'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

function applyLighting(color, intensity) {
    const [r, g, b] = hexToRgb(color);
    const litR = Math.floor(r * intensity);
    const litG = Math.floor(g * intensity);
    const litB = Math.floor(b * intensity);
    return `rgb(${litR}, ${litG}, ${litB})`;
}

function darkenColor(color, amount) {
    const [r, g, b] = hexToRgb(color);
    const darkR = Math.floor(r * (1 - amount));
    const darkG = Math.floor(g * (1 - amount));
    const darkB = Math.floor(b * (1 - amount));
    return `rgb(${darkR}, ${darkG}, ${darkB})`;
}

function checkBallCollisions() {
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const ball1 = balls[i];
            const ball2 = balls[j];
            
            const dx = ball2.x - ball1.x;
            const dy = ball2.y - ball1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < ball1.radius + ball2.radius) {
               
                const angle = Math.atan2(dy, dx);
                const sin = Math.sin(angle);
                const cos = Math.cos(angle);
                
               
                const vx1 = ball1.dx * cos + ball1.dy * sin;
                const vy1 = ball1.dy * cos - ball1.dx * sin;
                const vx2 = ball2.dx * cos + ball2.dy * sin;
                const vy2 = ball2.dy * cos - ball2.dx * sin;
                
             
                const vx1Final = ((ball1.mass - ball2.mass) * vx1 + 2 * ball2.mass * vx2) / (ball1.mass + ball2.mass);
                const vx2Final = ((ball2.mass - ball1.mass) * vx2 + 2 * ball1.mass * vx1) / (ball1.mass + ball2.mass);
                
                
                ball1.dx = vx1Final * cos - vy1 * sin;
                ball1.dy = vy1 * cos + vx1Final * sin;
                ball2.dx = vx2Final * cos - vy2 * sin;
                ball2.dy = vy2 * cos + vx2Final * sin;
                
        
                const overlap = (ball1.radius + ball2.radius - distance) / 2;
                ball1.x -= overlap * cos;
                ball1.y -= overlap * sin;
                ball2.x += overlap * cos;
                ball2.y += overlap * sin;
            }
        }
    }
}

function updateTime() {
    timeOfDay = (timeOfDay + timeSpeed) % 1;
  
    if (timeOfDay < 0.25 || timeOfDay > 0.75) {
        const nightProgress = timeOfDay < 0.25 ? 
            (0.25 - timeOfDay) / 0.25 : 
            (timeOfDay - 0.75) / 0.25;
        
        ambientLight = 0.2 + nightProgress * 0.1;
        backgroundColor = `rgba(10, 10, 30, ${1 - nightProgress * 0.3})`;
    } else {
        const dayProgress = Math.abs(timeOfDay - 0.5) / 0.25;
        ambientLight = 1.0 - dayProgress * 0.2;
        const blue = Math.floor(135 - dayProgress * 50);
        backgroundColor = `rgb(135, 206, ${blue})`;
    }
    
    const hours = Math.floor(timeOfDay * 24);
    const minutes = Math.floor((timeOfDay * 24 - hours) * 60);
    const ampm = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours % 12 || 12;
    document.getElementById('timeDisplay').textContent = 
        `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function drawMoonOrSun() {
    const angle = timeOfDay * Math.PI * 2;
    const orbitRadius = Math.min(canvas.width, canvas.height) * 0.45;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const x = centerX + Math.cos(angle) * orbitRadius;
    const y = centerY + Math.sin(angle) * orbitRadius * 0.5;
    
    if (timeOfDay < 0.25 || timeOfDay > 0.75) {
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fillStyle = applyLighting('#F5F5F5', ambientLight * 1.5);
        ctx.fill();
      
        ctx.fillStyle = applyLighting('#CCCCCC', ambientLight * 1.3);
        for (let i = 0; i < 5; i++) {
            const angle = Math.PI * 2 * i / 5;
            const dist = Math.random() * 15 + 5;
            const size = Math.random() * 5 + 2;
            ctx.beginPath();
            ctx.arc(
                x + Math.cos(angle) * dist,
                y + Math.sin(angle) * dist,
                size, 0, Math.PI * 2
            );
            ctx.fill();
        }
    } else {
        // Draw sun
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
        gradient.addColorStop(0, applyLighting('#FFFF00', ambientLight * 2));
        gradient.addColorStop(1, applyLighting('#FFA500', ambientLight * 1.5));
        
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Sun rays
        ctx.strokeStyle = applyLighting('#FFD700', ambientLight * 1.8);
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
            const rayAngle = (Math.PI * 2 * i) / 12;
            ctx.beginPath();
            ctx.moveTo(
                x + Math.cos(rayAngle) * 40,
                y + Math.sin(rayAngle) * 40
            );
            ctx.lineTo(
                x + Math.cos(rayAngle) * 60,
                y + Math.sin(rayAngle) * 60
            );
            ctx.stroke();
        }
    }
}

function drawStars() {
    if (timeOfDay < 0.25 || timeOfDay > 0.75) {
        const nightProgress = timeOfDay < 0.25 ? 
            (0.25 - timeOfDay) / 0.25 : 
            (timeOfDay - 0.75) / 0.25;
        
        for (const star of stars) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * nightProgress})`;
            ctx.fill();
            
            if (Math.random() < 0.01) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * nightProgress * 0.5})`;
                ctx.fill();
            }
        }
    }
}

function drawBackground() {
    // Draw sky
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    const horizonGradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
    horizonGradient.addColorStop(0, backgroundColor);
    horizonGradient.addColorStop(1, applyLighting('#2E8B57', ambientLight * 0.8));
    
    ctx.fillStyle = horizonGradient;
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
    
    for (let i = 0; i < 3; i++) {
        const mountainHeight = canvas.height * (0.1 + i * 0.05);
        const mountainColor = applyLighting(
            darkenColor('#2E8B57', i * 0.3), 
            ambientLight * (0.7 - i * 0.2)
        );
        
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.6);
        
        const peaks = 5 + i * 2;
        for (let j = 0; j <= peaks; j++) {
            const x = (j / peaks) * canvas.width;
            const noise = Math.sin(j * 2) * 0.2 + Math.cos(j * 0.5) * 0.3;
            const y = canvas.height * 0.6 - mountainHeight * (1 + noise * 0.3);
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height * 0.6);
        ctx.fillStyle = mountainColor;
        ctx.fill();
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateTime();
    
    drawBackground();
    drawStars();
    drawMoonOrSun();
    
    for (const ball of balls) {
        ball.update();
    }
    
    checkBallCollisions();
    
    // Draw terrains
    for (const terrain of terrains) {
        terrain.draw();
    }
    
    for (const ball of balls) {
        ball.draw();
    }
    
    // Update ball count display
    document.getElementById('ballCount').textContent = balls.length;
    
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createStars();
});

canvas.addEventListener('click', (e) => {
    balls.push(new Ball(e.clientX, e.clientY));
});

document.getElementById('addBall').addEventListener('click', () => {
    balls.push(new Ball());
});

document.getElementById('addTerrain').addEventListener('click', () => {
    terrains.push(new Terrain());
});

function init() {

    for (let i = 0; i < 10; i++) {
        balls.push(new Ball());
    }
    
    // Create initial terrains
    terrains.push(new Terrain('platform', 100, canvas.height * 0.7, 200, 30));
    terrains.push(new Terrain('hill', canvas.width * 0.6, canvas.height * 0.6, 300, 80));
    
    createStars();
    animate();
}

init();
