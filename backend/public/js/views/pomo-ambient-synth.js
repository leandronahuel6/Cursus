/**
 * PomoAmbientSynth - Sintetizador de Sonidos de Ambiente con Web Audio API
 * Genera Lluvia y Fogón de forma puramente matemática y offline.
 */
class PomoAmbientSynth {
    constructor() {
        this.ctx = null;
        this.rainNode = null;
        this.fireNode = null;
        this.forestNode = null;
        this.oceanNode = null;
        this.rainGain = null;
        this.fireGain = null;
        this.forestGain = null;
        this.oceanGain = null;
        
        // Estado del volumen de los canales (0 a 1)
        this.rainVol = parseFloat(localStorage.getItem('cursus_pomo_focus_vol_rain')) || 0.0;
        this.fireVol = parseFloat(localStorage.getItem('cursus_pomo_focus_vol_fire')) || 0.0;
        this.forestVol = parseFloat(localStorage.getItem('cursus_pomo_focus_vol_forest')) || 0.0;
        this.oceanVol = parseFloat(localStorage.getItem('cursus_pomo_focus_vol_ocean')) || 0.0;
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
        if (this.rainNode) return;

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.createWhiteNoiseBuffer();
        noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 500;
        filter.Q.value = 0.6;

        const rainGain = this.ctx.createGain();
        rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

        noiseSource.connect(filter);
        
        const backgroundGain = this.ctx.createGain();
        backgroundGain.gain.value = 0.18;
        filter.connect(backgroundGain);
        backgroundGain.connect(rainGain);

        noiseSource.start();

        const rainInterval = setInterval(() => {
            if (!this.rainNode || this.rainVol <= 0.05) return;
            const density = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < density; i++) {
                setTimeout(() => this.triggerRaindrop(rainGain), Math.random() * 180);
            }
        }, 200);

        rainGain.connect(this.ctx.destination);
        rainGain.gain.linearRampToValueAtTime(this.rainVol, this.ctx.currentTime + 1.5);

        this.rainNode = { source: noiseSource, interval: rainInterval };
        this.rainGain = rainGain;
    }

    triggerRaindrop(destinationGain) {
        if (!this.ctx || this.ctx.state === 'suspended') return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const startFreq = 1800 + Math.random() * 2200;
        const duration = 0.01 + Math.random() * 0.015;

        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.005 + Math.random() * 0.015, this.ctx.currentTime + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain).connect(destinationGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration + 0.01);
    }

    stopRain() {
        if (!this.rainNode) return;
        const currentGain = this.rainGain;
        const currentSource = this.rainNode.source;
        const currentInterval = this.rainNode.interval;

        this.rainNode = null;
        this.rainGain = null;

        clearInterval(currentInterval);

        if (this.ctx && this.ctx.state !== 'suspended') {
            try {
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

    setRainVolume(volume) {
        this.rainVol = Math.max(0, Math.min(1, parseFloat(volume)));
        if (this.rainVol > 0) {
            localStorage.setItem('cursus_pomo_focus_vol_rain', String(this.rainVol));
        }
        if (this.rainGain && this.ctx) {
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
        if (this.fireVol > 0) {
            localStorage.setItem('cursus_pomo_focus_vol_fire', String(this.fireVol));
        }
        if (this.fireGain && this.ctx) {
            this.fireGain.gain.linearRampToValueAtTime(this.fireVol, this.ctx.currentTime + 0.15);
        }
    }

    // --- SINTETIZADOR DE BOSQUE (VIENTO Y AVES - AUDIO REAL EN RUTA CDN) ---
    startForest() {
        this.init();
        if (this.forestNode) return;

        const audio = new Audio("https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/forest.mp3");
        audio.loop = true;
        audio.volume = 0; // Iniciar en 0 para fade-in

        audio.play().catch(e => console.log("Audio play error", e));

        // Rampa de volumen manual en JS para evitar CORS en Web Audio API
        let currentVol = 0;
        const targetVol = this.forestVol;
        const fadeInterval = setInterval(() => {
            if (!this.forestNode || currentVol >= targetVol) {
                clearInterval(fadeInterval);
                return;
            }
            currentVol = Math.min(targetVol, currentVol + 0.05);
            audio.volume = currentVol;
        }, 80);

        this.forestNode = { audio: audio, fadeInterval: fadeInterval };
    }

    stopForest() {
        if (!this.forestNode) return;
        const currentAudio = this.forestNode.audio;
        const currentFadeInterval = this.forestNode.fadeInterval;

        this.forestNode = null;

        clearInterval(currentFadeInterval);

        let currentVol = currentAudio.volume;
        const fadeOutInterval = setInterval(() => {
            if (currentVol <= 0.02) {
                clearInterval(fadeOutInterval);
                try {
                    currentAudio.pause();
                    currentAudio.src = "";
                } catch(e){}
                return;
            }
            currentVol = Math.max(0, currentVol - 0.05);
            try {
                currentAudio.volume = currentVol;
            } catch(e){}
        }, 80);
    }

    setForestVolume(volume) {
        this.forestVol = Math.max(0, Math.min(1, parseFloat(volume)));
        if (this.forestVol > 0) {
            localStorage.setItem('cursus_pomo_focus_vol_forest', String(this.forestVol));
        }
        if (this.forestNode) {
            try {
                this.forestNode.audio.volume = this.forestVol;
            } catch(e){}
        }
    }

    // --- SINTETIZADOR DE OCÉANO (OLAS DE MAR - AUDIO REAL EN RUTA CDN) ---
    startOcean() {
        this.init();
        if (this.oceanNode) return;

        const audio = new Audio("https://raw.githubusercontent.com/brarcher/baby-sleep-sounds/master/app/src/main/res/raw/ocean.mp3");
        audio.loop = true;
        audio.volume = 0; // Iniciar en 0 para fade-in

        audio.play().catch(e => console.log("Audio play error", e));

        // Rampa de volumen manual en JS para evitar CORS en Web Audio API
        let currentVol = 0;
        const targetVol = this.oceanVol;
        const fadeInterval = setInterval(() => {
            if (!this.oceanNode || currentVol >= targetVol) {
                clearInterval(fadeInterval);
                return;
            }
            currentVol = Math.min(targetVol, currentVol + 0.05);
            audio.volume = currentVol;
        }, 80);

        this.oceanNode = { audio: audio, fadeInterval: fadeInterval };
    }

    stopOcean() {
        if (!this.oceanNode) return;
        const currentAudio = this.oceanNode.audio;
        const currentFadeInterval = this.oceanNode.fadeInterval;

        this.oceanNode = null;

        clearInterval(currentFadeInterval);

        let currentVol = currentAudio.volume;
        const fadeOutInterval = setInterval(() => {
            if (currentVol <= 0.02) {
                clearInterval(fadeOutInterval);
                try {
                    currentAudio.pause();
                    currentAudio.src = "";
                } catch(e){}
                return;
            }
            currentVol = Math.max(0, currentVol - 0.05);
            try {
                currentAudio.volume = currentVol;
            } catch(e){}
        }, 80);
    }

    setOceanVolume(volume) {
        this.oceanVol = Math.max(0, Math.min(1, parseFloat(volume)));
        if (this.oceanVol > 0) {
            localStorage.setItem('cursus_pomo_focus_vol_ocean', String(this.oceanVol));
        }
        if (this.oceanNode) {
            try {
                this.oceanNode.audio.volume = this.oceanVol;
            } catch(e){}
        }
    }

    stopAll() {
        const tempRainGain = this.rainGain;
        const tempFireGain = this.fireGain;
        const tempRainNode = this.rainNode;
        const tempFireNode = this.fireNode;
        const tempForestNode = this.forestNode;
        const tempOceanNode = this.oceanNode;

        this.rainNode = null;
        this.rainGain = null;
        this.fireNode = null;
        this.fireGain = null;
        this.forestNode = null;
        this.oceanNode = null;

        if (tempFireNode) clearInterval(tempFireNode.interval);
        if (tempRainNode) clearInterval(tempRainNode.interval);

        if (tempForestNode) {
            clearInterval(tempForestNode.fadeInterval);
            try {
                tempForestNode.audio.pause();
                tempForestNode.audio.src = "";
            } catch(e){}
        }
        if (tempOceanNode) {
            clearInterval(tempOceanNode.fadeInterval);
            try {
                tempOceanNode.audio.pause();
                tempOceanNode.audio.src = "";
            } catch(e){}
        }

        if (this.ctx && this.ctx.state !== 'suspended') {
            try {
                const now = this.ctx.currentTime;
                if (tempRainGain) {
                    tempRainGain.gain.setValueAtTime(tempRainGain.gain.value, now);
                    tempRainGain.gain.linearRampToValueAtTime(0, now + 1.5);
                }
                if (tempFireGain) {
                    tempFireGain.gain.setValueAtTime(tempFireGain.gain.value, now);
                    tempFireGain.gain.linearRampToValueAtTime(0, now + 1.5);
                }

                setTimeout(() => {
                    try {
                        if (tempRainNode) {
                            tempRainNode.source.stop();
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
