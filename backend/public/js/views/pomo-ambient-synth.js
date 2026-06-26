/**
 * PomoAmbientSynth - Sintetizador de Sonidos de Ambiente con Web Audio API
 * Genera Lluvia y Fogón de forma puramente matemática y offline.
 */
class PomoAmbientSynth {
    constructor() {
        this.ctx = null;
        this.rainNode = null;
        this.fireNode = null;
        this.rainGain = null;
        this.fireGain = null;
        
        // Estado del volumen de los canales (0 a 1)
        this.rainVol = parseFloat(localStorage.getItem('cursus_pomo_focus_vol_rain')) || 0.0;
        this.fireVol = parseFloat(localStorage.getItem('cursus_pomo_focus_vol_fire')) || 0.0;
    }

    init() {
        if (this.ctx) return;
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;
        this.ctx = new AudioCtor();
    }

    // --- GENERADORES DE RUIDO ---
    createWhiteNoiseBuffer() {
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return noiseBuffer;
    }

    createBrownNoiseBuffer() {
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // El ruido marrón se obtiene filtrando/integrando el ruido blanco
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // Compensar pérdida de volumen por filtrado
        }
        return noiseBuffer;
    }

    // --- SINTETIZADOR DE LLUVIA ---
    startRain() {
        this.init();
        if (!this.ctx) return;
        if (this.rainNode) return; // Ya está sonando

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.createWhiteNoiseBuffer();
        noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        filter.Q.value = 0.8;

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.12;

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 180;

        const rainGain = this.ctx.createGain();
        // Empezar en 0 para desvanecimiento inicial
        rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        noiseSource.connect(filter);
        filter.connect(rainGain);
        rainGain.connect(this.ctx.destination);

        lfo.start();
        noiseSource.start();

        // Desvanecimiento suave (fade-in) de 1.5 segundos
        rainGain.gain.linearRampToValueAtTime(this.rainVol, this.ctx.currentTime + 1.5);

        this.rainNode = { source: noiseSource, lfo: lfo, filter: filter };
        this.rainGain = rainGain;
    }

    stopRain() {
        if (!this.rainNode) return;
        const currentGain = this.rainGain;
        const currentSource = this.rainNode.source;
        const currentLfo = this.rainNode.lfo;

        this.rainNode = null;
        this.rainGain = null;

        if (this.ctx && this.ctx.state !== 'suspended') {
            try {
                // Desvanecimiento suave (fade-out) de 1.5 segundos
                currentGain.gain.setValueAtTime(currentGain.gain.value, this.ctx.currentTime);
                currentGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
                
                setTimeout(() => {
                    try {
                        currentSource.stop();
                        currentLfo.stop();
                    } catch(e){}
                }, 1600);
            } catch(e) {
                try {
                    currentSource.stop();
                    currentLfo.stop();
                } catch(err){}
            }
        } else {
            try {
                currentSource.stop();
                currentLfo.stop();
            } catch(e){}
        }
    }

    setRainVolume(volume) {
        this.rainVol = Math.max(0, Math.min(1, parseFloat(volume)));
        localStorage.setItem('cursus_pomo_focus_vol_rain', String(this.rainVol));
        if (this.rainGain && this.ctx) {
            // Rampa muy corta de 0.15s para evitar chasquidos
            this.rainGain.gain.linearRampToValueAtTime(this.rainVol, this.ctx.currentTime + 0.15);
        }
    }

    // --- SINTETIZADOR DE FOGÓN (FUEGO) ---
    startFire() {
        this.init();
        if (!this.ctx) return;
        if (this.fireNode) return;

        const rumbleSource = this.ctx.createBufferSource();
        rumbleSource.buffer = this.createBrownNoiseBuffer();
        rumbleSource.loop = true;

        const rumbleFilter = this.ctx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 220;

        const fireGain = this.ctx.createGain();
        // Empezar en 0 para desvanecimiento inicial
        fireGain.gain.setValueAtTime(0, this.ctx.currentTime);

        rumbleSource.connect(rumbleFilter);
        rumbleFilter.connect(fireGain);

        const crackleInterval = setInterval(() => {
            if (!this.fireNode || this.fireVol <= 0.05) return;
            if (Math.random() > 0.6) {
                this.triggerCrackle(fireGain);
            }
        }, 120);

        rumbleSource.start();
        fireGain.connect(this.ctx.destination);

        // Desvanecimiento suave (fade-in) de 1.5 segundos
        fireGain.gain.linearRampToValueAtTime(this.fireVol, this.ctx.currentTime + 1.5);

        this.fireNode = { source: rumbleSource, interval: crackleInterval };
        this.fireGain = fireGain;
    }

    triggerCrackle(destinationGain) {
        if (!this.ctx || this.ctx.state === 'suspended') return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000 + Math.random() * 4000, this.ctx.currentTime);

        const start = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.1, start + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.01 + Math.random() * 0.03);

        osc.connect(gain).connect(destinationGain);
        osc.start(start);
        osc.stop(start + 0.05);
    }

    stopFire() {
        if (!this.fireNode) return;
        const currentGain = this.fireGain;
        const currentSource = this.fireNode.source;
        const currentInterval = this.fireNode.interval;

        this.fireNode = null;
        this.fireGain = null;

        clearInterval(currentInterval);

        if (this.ctx && this.ctx.state !== 'suspended') {
            try {
                // Desvanecimiento suave (fade-out) de 1.5 segundos
                currentGain.gain.setValueAtTime(currentGain.gain.value, this.ctx.currentTime);
                currentGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
                
                setTimeout(() => {
                    try {
                        currentSource.stop();
                    } catch(e){}
                }, 1600);
            } catch(e) {
                try {
                    currentSource.stop();
                } catch(err){}
            }
        } else {
            try {
                currentSource.stop();
            } catch(e){}
        }
    }

    setFireVolume(volume) {
        this.fireVol = Math.max(0, Math.min(1, parseFloat(volume)));
        localStorage.setItem('cursus_pomo_focus_vol_fire', String(this.fireVol));
        if (this.fireGain && this.ctx) {
            // Rampa muy corta de 0.15s para evitar chasquidos
            this.fireGain.gain.linearRampToValueAtTime(this.fireVol, this.ctx.currentTime + 0.15);
        }
    }

    stopAll() {
        const tempRainGain = this.rainGain;
        const tempFireGain = this.fireGain;
        const tempRainNode = this.rainNode;
        const tempFireNode = this.fireNode;

        this.rainNode = null;
        this.rainGain = null;
        this.fireNode = null;
        this.fireGain = null;

        if (tempFireNode) clearInterval(tempFireNode.interval);

        if (this.ctx && this.ctx.state !== 'suspended') {
            try {
                // Desvanecer ambos canales simultáneamente
                const now = this.ctx.currentTime;
                if (tempRainGain) {
                    tempRainGain.gain.setValueAtTime(tempRainGain.gain.value, now);
                    tempRainGain.gain.linearRampToValueAtTime(0, now + 1.5);
                }
                if (tempFireGain) {
                    tempFireGain.gain.setValueAtTime(tempFireGain.gain.value, now);
                    tempFireGain.gain.linearRampToValueAtTime(0, now + 1.5);
                }

                // Cerrar AudioContext y parar nodos después del fade
                setTimeout(() => {
                    try {
                        if (tempRainNode) {
                            tempRainNode.source.stop();
                            tempRainNode.lfo.stop();
                        }
                        if (tempFireNode) {
                            tempFireNode.source.stop();
                        }
                    } catch(e){}
                    
                    if (this.ctx) {
                        this.ctx.close();
                        this.ctx = null;
                    }
                }, 1600);
            } catch(e) {
                if (this.ctx) {
                    this.ctx.close();
                    this.ctx = null;
                }
            }
        } else {
            if (this.ctx) {
                this.ctx.close();
                this.ctx = null;
            }
        }
    }
}

// Exportar globalmente
window.pomoAmbientSynth = new PomoAmbientSynth();
