/**
 * PomoFocusCanvas - Animación de Partículas 2D para el Modo Concentración
 * Soporta lluvia cayendo y chispas/brasas de fogón subiendo.
 */
class PomoFocusCanvas {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.particles = [];
        this.splashes = [];
        this.currentTheme = 'none'; // 'aurora', 'rain', 'fire', 'none'
        
        // Atar métodos al scope de la clase
        this.loop = this.loop.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    start(canvasId, theme) {
        this.stop();
        
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.currentTheme = theme;
        
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
        
        this.particles = [];
        this.splashes = [];
        
        // Pre-poblar partículas
        const count = theme === 'rain' ? 80 : (theme === 'fire' ? 40 : (theme === 'forest' ? 50 : (theme === 'ocean' ? 60 : 0)));
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(true));
        }
        
        // Arrancar el bucle de animación
        this.animationId = requestAnimationFrame(this.loop);
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.canvas) {
            window.removeEventListener('resize', this.handleResize);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvas = null;
            this.ctx = null;
        }
        this.particles = [];
        this.splashes = [];
        this.currentTheme = 'none';
    }

    handleResize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // --- FÁBRICA DE PARTÍCULAS ---
    createParticle(randomY = false) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        if (this.currentTheme === 'rain') {
            return {
                x: Math.random() * w,
                y: randomY ? Math.random() * h : -20,
                length: 10 + Math.random() * 15,
                speed: 12 + Math.random() * 8,
                opacity: 0.15 + Math.random() * 0.25,
                weight: 1 + Math.random() * 1.5
            };
        } else if (this.currentTheme === 'fire') {
            return {
                x: Math.random() * w,
                y: randomY ? h * 0.4 + Math.random() * (h * 0.6) : h + 10,
                size: 1 + Math.random() * 3,
                speedY: -(0.8 + Math.random() * 1.5),
                speedX: 0,
                wiggleSpeed: 0.01 + Math.random() * 0.02,
                wiggleRange: 0.5 + Math.random() * 1.2,
                angle: Math.random() * Math.PI * 2,
                opacity: 0.4 + Math.random() * 0.6,
                decay: 0.001 + Math.random() * 0.0025,
                color: Math.random() > 0.45 ? 'rgba(249, 115, 22, ' : (Math.random() > 0.4 ? 'rgba(239, 68, 68, ' : 'rgba(253, 224, 71, ') // Naranja, Rojo, Amarillo
            };
        } else if (this.currentTheme === 'forest') {
            return {
                x: Math.random() * w,
                y: randomY ? Math.random() * h : -20,
                size: 6 + Math.random() * 8,
                speedY: 1 + Math.random() * 1.5,
                speedX: 0.5 + Math.random() * 1,
                angle: Math.random() * Math.PI * 2,
                wiggleSpeed: 0.02 + Math.random() * 0.03,
                opacity: 0.2 + Math.random() * 0.4,
                color: Math.random() > 0.5 ? 'rgba(34, 197, 94, ' : (Math.random() > 0.4 ? 'rgba(234, 179, 8, ' : 'rgba(101, 163, 13, ')
            };
        } else if (this.currentTheme === 'ocean') {
            return {
                x: Math.random() * w,
                y: randomY ? Math.random() * h : h + 20,
                size: 2 + Math.random() * 6,
                speedY: -(0.5 + Math.random() * 1.2),
                wiggleSpeed: 0.01 + Math.random() * 0.02,
                wiggleRange: 0.5 + Math.random() * 1,
                angle: Math.random() * Math.PI * 2,
                opacity: 0.15 + Math.random() * 0.3
            };
        }
        return {};
    }

    // --- BUCLE PRINCIPAL ---
    loop() {
        if (!this.canvas || !this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const w = this.canvas.width;
        const h = this.canvas.height;

        if (this.currentTheme === 'rain') {
            this.ctx.strokeStyle = 'rgba(156, 163, 175, 0.4)';
            this.ctx.lineWidth = 1;
            
            // Actualizar y dibujar gotas
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                // Dibujar una línea vertical simulando velocidad
                this.ctx.lineTo(p.x + (p.speed * 0.05), p.y + p.length);
                this.ctx.strokeStyle = `rgba(165, 180, 252, ${p.opacity})`;
                this.ctx.stroke();

                p.y += p.speed;
                p.x += p.speed * 0.05; // Desplazamiento leve hacia el costado

                // Colisión con la base
                if (p.y >= h - p.length) {
                    // Generar un pequeño splash
                    if (Math.random() > 0.7) {
                        this.splashes.push({
                            x: p.x,
                            y: h - 5,
                            radius: 1,
                            maxRadius: 4 + Math.random() * 6,
                            opacity: p.opacity * 0.7,
                            speed: 0.3 + Math.random() * 0.3
                        });
                    }
                    // Resetear gota al cielo
                    this.particles[i] = this.createParticle(false);
                }
            }

            // Dibujar splashes (círculos expansivos en el suelo)
            for (let i = this.splashes.length - 1; i >= 0; i--) {
                const s = this.splashes[i];
                this.ctx.beginPath();
                this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI, true); // Semicírculo hacia arriba
                this.ctx.strokeStyle = `rgba(165, 180, 252, ${s.opacity})`;
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke();

                s.radius += s.speed;
                s.opacity -= 0.03;

                if (s.opacity <= 0 || s.radius >= s.maxRadius) {
                    this.splashes.splice(i, 1);
                }
            }

        } else if (this.currentTheme === 'fire') {
            this.ctx.shadowBlur = 4;
            
            // Actualizar y dibujar chispas del fogón
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color + p.opacity + ')';
                this.ctx.shadowColor = p.color + '0.8)';
                this.ctx.fill();

                // Físicas: subir y balancearse a los lados
                p.y += p.speedY;
                p.angle += p.wiggleSpeed;
                p.x += Math.sin(p.angle) * p.wiggleRange;
                
                // Reducir tamaño y opacidad
                p.opacity -= p.decay;
                p.size -= 0.005;

                // Si se apaga o sale de pantalla, la reemplazamos
                if (p.opacity <= 0 || p.y < -10 || p.size <= 0.1) {
                    this.particles[i] = this.createParticle(false);
                }
            }
            
            this.ctx.shadowBlur = 0; // Desactivar sombras de glow para no ralentizar
        } else if (this.currentTheme === 'forest') {
            // Dibujar hojas flotantes cayendo
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                this.ctx.beginPath();
                if (this.ctx.ellipse) {
                    this.ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.angle, 0, Math.PI * 2);
                } else {
                    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                }
                this.ctx.fillStyle = p.color + p.opacity + ')';
                this.ctx.fill();

                p.y += p.speedY;
                p.x += p.speedX + Math.sin(p.angle) * 0.5;
                p.angle += p.wiggleSpeed;

                if (p.y > h + 20 || p.x > w + 20) {
                    this.particles[i] = this.createParticle(false);
                }
            }
        } else if (this.currentTheme === 'ocean') {
            // Dibujar burbujas transparentes subiendo
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(186, 230, 253, ${p.opacity * 0.3})`;
                this.ctx.fill();
                
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
                this.ctx.lineWidth = 0.75;
                this.ctx.stroke();

                p.y += p.speedY;
                p.angle += p.wiggleSpeed;
                p.x += Math.sin(p.angle) * p.wiggleRange;

                if (p.y < -20) {
                    this.particles[i] = this.createParticle(false);
                }
            }
        }

        this.animationId = requestAnimationFrame(this.loop);
    }
}

// Exportar globalmente
window.pomoFocusCanvas = new PomoFocusCanvas();
