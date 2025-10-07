// Drum Machine Application
class DrumMachine {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.currentStep = 0;
        this.tempo = 120;
        this.masterVolume = 0.7;
        this.currentKit = 'electronic';
        this.stepInterval = null;
        this.pattern = {};
        this.sounds = {};
        this.trackVolumes = {};
        
        // Initialize the application
        this.init();
    }

    async init() {
        await this.initAudio();
        this.createSequencerGrid();
        this.bindEvents();
        this.loadSounds();
        this.updateStatus('Ready to play');
    }

    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Web Audio API not supported:', error);
            this.updateStatus('Audio not supported in this browser');
        }
    }

    createSequencerGrid() {
        const grid = document.getElementById('sequencerGrid');
        grid.innerHTML = '';

        const drumTracks = [
            { name: 'Kick', icon: '🥁', color: '#e74c3c' },
            { name: 'Snare', icon: '🥁', color: '#3498db' },
            { name: 'Hi-Hat', icon: '🎩', color: '#f39c12' },
            { name: 'Open Hat', icon: '🎩', color: '#9b59b6' },
            { name: 'Clap', icon: '👏', color: '#e67e22' },
            { name: 'Crash', icon: '💥', color: '#1abc9c' },
            { name: 'Ride', icon: '🔔', color: '#34495e' },
            { name: 'Perc', icon: '🎵', color: '#e91e63' }
        ];

        drumTracks.forEach((track, trackIndex) => {
            const row = document.createElement('tr');
            row.className = 'drum-track';
            
            // Initialize pattern for this track
            this.pattern[track.name] = new Array(16).fill(false);
            this.trackVolumes[track.name] = 0.8;

            // Track name cell
            const nameCell = document.createElement('td');
            nameCell.className = 'track-name';
            nameCell.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 1.2em; margin-right: 8px;">${track.icon}</span>
                    <span>${track.name}</span>
                </div>
            `;
            row.appendChild(nameCell);

            // Volume control cell
            const volumeCell = document.createElement('td');
            volumeCell.className = 'volume-control';
            const volumeSlider = document.createElement('input');
            volumeSlider.type = 'range';
            volumeSlider.className = 'track-volume';
            volumeSlider.min = '0';
            volumeSlider.max = '100';
            volumeSlider.value = '80';
            volumeSlider.addEventListener('input', (e) => {
                this.trackVolumes[track.name] = e.target.value / 100;
            });
            volumeCell.appendChild(volumeSlider);
            row.appendChild(volumeCell);

            // Step buttons
            for (let step = 0; step < 16; step++) {
                const stepCell = document.createElement('td');
                const stepBtn = document.createElement('button');
                stepBtn.className = 'step-btn';
                stepBtn.textContent = step + 1;
                stepBtn.dataset.track = track.name;
                stepBtn.dataset.step = step;
                
                stepBtn.addEventListener('click', () => {
                    this.toggleStep(track.name, step);
                });

                stepCell.appendChild(stepBtn);
                row.appendChild(stepCell);
            }

            grid.appendChild(row);
        });
    }

    bindEvents() {
        // Play/Stop buttons
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());

        // Tempo controls
        document.getElementById('tempo').addEventListener('input', (e) => {
            this.tempo = parseInt(e.target.value);
            this.updateStatus(`Tempo set to ${this.tempo} BPM`);
        });

        document.getElementById('tempoUp').addEventListener('click', () => {
            this.tempo = Math.min(200, this.tempo + 5);
            document.getElementById('tempo').value = this.tempo;
            this.updateStatus(`Tempo increased to ${this.tempo} BPM`);
        });

        document.getElementById('tempoDown').addEventListener('click', () => {
            this.tempo = Math.max(60, this.tempo - 5);
            document.getElementById('tempo').value = this.tempo;
            this.updateStatus(`Tempo decreased to ${this.tempo} BPM`);
        });

        // Kit selection
        document.getElementById('kitSelect').addEventListener('change', (e) => {
            this.currentKit = e.target.value;
            this.loadSounds();
            this.updateStatus(`Switched to ${this.currentKit} kit`);
        });

        // Master volume
        document.getElementById('masterVolume').addEventListener('input', (e) => {
            this.masterVolume = e.target.value / 100;
            this.updateStatus(`Master volume: ${Math.round(e.target.value)}%`);
        });

        // Pattern controls
        document.getElementById('clearPattern').addEventListener('click', () => this.clearPattern());
        document.getElementById('randomPattern').addEventListener('click', () => this.randomPattern());
        document.getElementById('savePattern').addEventListener('click', () => this.savePattern());
        document.getElementById('loadPattern').addEventListener('click', () => this.loadPattern());
    }

    async loadSounds() {
        // Generate synthetic drum sounds using Web Audio API
        this.sounds = {};
        const tracks = ['Kick', 'Snare', 'Hi-Hat', 'Open Hat', 'Clap', 'Crash', 'Ride', 'Perc'];
        
        tracks.forEach(track => {
            this.sounds[track] = this.generateDrumSound(track);
        });
    }

    generateDrumSound(type) {
        if (!this.audioContext) return null;

        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        switch (type) {
            case 'Kick':
                return this.createKickSound(data, buffer);
            case 'Snare':
                return this.createSnareSound(data, buffer);
            case 'Hi-Hat':
                return this.createHiHatSound(data, buffer);
            case 'Open Hat':
                return this.createOpenHatSound(data, buffer);
            case 'Clap':
                return this.createClapSound(data, buffer);
            case 'Crash':
                return this.createCrashSound(data, buffer);
            case 'Ride':
                return this.createRideSound(data, buffer);
            case 'Perc':
                return this.createPercSound(data, buffer);
            default:
                return buffer;
        }
    }

    createKickSound(data, buffer) {
        const sampleRate = buffer.sampleRate;
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 60 * Math.exp(-t * 30);
            const envelope = Math.exp(-t * 15);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.5;
        }
        return buffer;
    }

    createSnareSound(data, buffer) {
        const sampleRate = buffer.sampleRate;
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * 0.3;
            const envelope = Math.exp(-t * 25);
            const tone = Math.sin(2 * Math.PI * 200 * t) * 0.2;
            data[i] = (noise + tone) * envelope;
        }
        return buffer;
    }

    createHiHatSound(data, buffer) {
        const sampleRate = buffer.sampleRate;
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * 0.4;
            const envelope = Math.exp(-t * 50);
            data[i] = noise * envelope;
        }
        return buffer;
    }

    createOpenHatSound(data, buffer) {
        const sampleRate = buffer.sampleRate;
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * 0.3;
            const envelope = Math.exp(-t * 20);
            data[i] = noise * envelope;
        }
        return buffer;
    }

    createClapSound(data, buffer) {
        const sampleRate = buffer.sampleRate;
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * 0.3;
            const envelope = Math.exp(-t * 30);
            data[i] = noise * envelope;
        }
        return buffer;
    }

    createCrashSound(data, buffer) {
        const sampleRate = buffer.sampleRate;
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * 0.4;
            const envelope = Math.exp(-t * 10);
            data[i] = noise * envelope;
        }
        return buffer;
    }

    createRideSound(data, buffer) {
        const sampleRate = buffer.sampleRate;
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 250 + Math.sin(t * 50) * 10;
            const envelope = Math.exp(-t * 8);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
        }
        return buffer;
    }

    createPercSound(data, buffer) {
        const sampleRate = buffer.sampleRate;
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 800 * Math.exp(-t * 20);
            const envelope = Math.exp(-t * 35);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
        }
        return buffer;
    }

    toggleStep(trackName, stepIndex) {
        this.pattern[trackName][stepIndex] = !this.pattern[trackName][stepIndex];
        const stepBtn = document.querySelector(`[data-track="${trackName}"][data-step="${stepIndex}"]`);
        stepBtn.classList.toggle('active', this.pattern[trackName][stepIndex]);
    }

    play() {
        if (this.isPlaying) return;

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.currentStep = 0;
        
        document.getElementById('playBtn').innerHTML = '<i class="fas fa-pause"></i> Playing';
        document.getElementById('playBtn').classList.add('btn-warning');
        document.getElementById('playBtn').classList.remove('btn-success');
        
        this.updateStatus('Playing...');
        this.startStepLoop();
    }

    stop() {
        this.isPlaying = false;
        clearInterval(this.stepInterval);
        
        document.getElementById('playBtn').innerHTML = '<i class="fas fa-play"></i> Play';
        document.getElementById('playBtn').classList.add('btn-success');
        document.getElementById('playBtn').classList.remove('btn-warning');
        
        // Clear all playing indicators
        document.querySelectorAll('.step-btn.playing').forEach(btn => {
            btn.classList.remove('playing');
        });
        
        this.currentStep = 0;
        this.updateStatus('Stopped');
        this.updateCurrentStepDisplay();
    }

    startStepLoop() {
        const stepDuration = (60 / this.tempo) * 1000 / 4; // 16th notes
        
        this.stepInterval = setInterval(() => {
            if (!this.isPlaying) return;
            
            this.playCurrentStep();
            this.highlightCurrentStep();
            this.updateCurrentStepDisplay();
            
            this.currentStep = (this.currentStep + 1) % 16;
        }, stepDuration);
    }

    playCurrentStep() {
        Object.keys(this.pattern).forEach(trackName => {
            if (this.pattern[trackName][this.currentStep]) {
                this.playSound(trackName);
            }
        });
    }

    playSound(trackName) {
        if (!this.audioContext || !this.sounds[trackName]) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.sounds[trackName];
        
        // Apply track volume and master volume
        const volume = this.trackVolumes[trackName] * this.masterVolume;
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
    }

    highlightCurrentStep() {
        // Remove previous playing indicators
        document.querySelectorAll('.step-btn.playing').forEach(btn => {
            btn.classList.remove('playing');
        });
        
        // Add playing indicator to current step
        document.querySelectorAll(`[data-step="${this.currentStep}"]`).forEach(btn => {
            btn.classList.add('playing');
        });
    }

    updateCurrentStepDisplay() {
        document.getElementById('currentStep').textContent = `Step: ${this.currentStep + 1}`;
        document.getElementById('currentBpm').textContent = `BPM: ${this.tempo}`;
    }

    clearPattern() {
        Object.keys(this.pattern).forEach(trackName => {
            this.pattern[trackName] = new Array(16).fill(false);
        });
        
        document.querySelectorAll('.step-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.updateStatus('Pattern cleared');
    }

    randomPattern() {
        Object.keys(this.pattern).forEach(trackName => {
            for (let step = 0; step < 16; step++) {
                this.pattern[trackName][step] = Math.random() < 0.3; // 30% chance
            }
        });
        
        this.updatePatternDisplay();
        this.updateStatus('Random pattern generated');
    }

    updatePatternDisplay() {
        Object.keys(this.pattern).forEach(trackName => {
            for (let step = 0; step < 16; step++) {
                const stepBtn = document.querySelector(`[data-track="${trackName}"][data-step="${step}"]`);
                stepBtn.classList.toggle('active', this.pattern[trackName][step]);
            }
        });
    }

    savePattern() {
        const patternName = prompt('Enter pattern name:');
        if (!patternName) return;
        
        const patternData = {
            name: patternName,
            pattern: this.pattern,
            tempo: this.tempo,
            kit: this.currentKit,
            timestamp: new Date().toISOString()
        };
        
        const savedPatterns = JSON.parse(localStorage.getItem('drumPatterns') || '[]');
        savedPatterns.push(patternData);
        localStorage.setItem('drumPatterns', JSON.stringify(savedPatterns));
        
        this.updatePatternSelect();
        this.updateStatus(`Pattern "${patternName}" saved`);
    }

    loadPattern() {
        const patternSelect = document.getElementById('patternSelect');
        const selectedPattern = patternSelect.value;
        if (!selectedPattern) return;
        
        const savedPatterns = JSON.parse(localStorage.getItem('drumPatterns') || '[]');
        const pattern = savedPatterns.find(p => p.name === selectedPattern);
        
        if (pattern) {
            this.pattern = pattern.pattern;
            this.tempo = pattern.tempo || 120;
            this.currentKit = pattern.kit || 'electronic';
            
            document.getElementById('tempo').value = this.tempo;
            document.getElementById('kitSelect').value = this.currentKit;
            
            this.updatePatternDisplay();
            this.loadSounds();
            this.updateStatus(`Pattern "${pattern.name}" loaded`);
        }
    }

    updatePatternSelect() {
        const patternSelect = document.getElementById('patternSelect');
        const savedPatterns = JSON.parse(localStorage.getItem('drumPatterns') || '[]');
        
        // Clear existing options except the first one
        patternSelect.innerHTML = '<option value="">Select Pattern...</option>';
        
        savedPatterns.forEach(pattern => {
            const option = document.createElement('option');
            option.value = pattern.name;
            option.textContent = `${pattern.name} (${pattern.tempo}BPM)`;
            patternSelect.appendChild(option);
        });
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }
}

// Initialize the drum machine when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.drumMachine = new DrumMachine();
});

// Handle page visibility changes to pause/resume audio
document.addEventListener('visibilitychange', () => {
    if (window.drumMachine && window.drumMachine.isPlaying) {
        if (document.hidden) {
            // Optionally pause when tab is not visible
            // window.drumMachine.stop();
        }
    }
});
