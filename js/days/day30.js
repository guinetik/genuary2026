/**
 * Genuary 2026 - Day 30
 * Prompt: "It's not a bug, it's a feature"
 * Credit: Piter Pasma
 *
 * QUIET ANALYZER - The Inverted Visualizer
 * The quieter the audio, the CRAZIER the visualization.
 * Loud sounds = calm flat line. Silence = absolute chaos.
 *
 * "It's not a bug, it's a feature!"
 *
 * Features:
 * - Inverted audio response (quiet = wild, loud = calm)
 * - Chaos, glitches, and color shifts during silence
 * - Drop an audio file to experience the madness
 */

import { Game, Painter } from '@guinetik/gcanvas';

const CONFIG = {
  // Audio
  fftSize: 2048,
  smoothing: 0.8,

  // Visualization
  lineWidth: 3,
  glowAmount: 15,

  // Chaos parameters
  chaos: {
    noiseScale: 0.02,
    maxAmplitude: 0.6,      // Max chaos amplitude (reduced)
    glitchChance: 0.2,      // Chance of glitch per frame when quiet
    colorSpeed: 1.5,        // How fast colors shift during chaos (slower)
  },

  // Colors
  calmHue: 135,             // Green when loud (normal)
  chaosHueStart: 0,         // Red when quiet (chaos)
  chaosHueRange: 120,       // Color cycling range during chaos
};

class Day30Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    this.time = 0;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.audioBuffer = null;
    this.waveformData = null;
    this.frequencyData = null;
    this.isPlaying = false;
    this.hasAudio = false;

    // Chaos state
    this.chaosLevel = 0;        // 0 = calm, 1 = maximum chaos
    this.targetChaosLevel = 0;
    this.glitchOffset = 0;
    this.colorPhase = 0;
    this.peakLoudness = 1;      // Will be set by pre-analysis

    // Create hidden file input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'audio/*';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.loadAudioFile(e.target.files[0]);
      }
    });

    // Click to open file dialog or play/pause
    this.canvas.addEventListener('click', () => {
      if (!this.hasAudio) {
        this.fileInput.click();
      } else {
        this.togglePlayback();
      }
    });

    // Drag and drop
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dragOver = true;
    });

    this.canvas.addEventListener('dragleave', () => {
      this.dragOver = false;
    });

    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dragOver = false;
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) {
        this.loadAudioFile(file);
      }
    });

    // Idle animation
    this.idlePhase = 0;
  }

  async loadAudioFile(file) {
    try {
      // Create audio context if needed
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Stop current playback
      if (this.source) {
        this.source.stop();
        this.source.disconnect();
      }

      // Load and decode audio
      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // PRE-ANALYZE: Find the peak loudness of the entire track
      this.peakLoudness = this.analyzeTrackPeak(this.audioBuffer);
      console.log(`[Day30] Track peak loudness: ${this.peakLoudness.toFixed(4)}`);

      // Setup analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = CONFIG.fftSize;
      this.analyser.smoothingTimeConstant = CONFIG.smoothing;
      this.waveformData = new Uint8Array(this.analyser.fftSize);
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

      this.hasAudio = true;
      this.fileName = file.name;

      // Auto-play
      this.startPlayback();

    } catch (err) {
      console.error('Error loading audio:', err);
    }
  }

  /**
   * Pre-analyze audio buffer to find peak loudness
   * Scans the entire track in chunks to find the maximum RMS
   * @param {AudioBuffer} buffer
   * @returns {number} Peak RMS value
   */
  analyzeTrackPeak(buffer) {
    const channelData = buffer.getChannelData(0);  // Use first channel
    const chunkSize = 2048;  // Same as FFT size
    let maxRms = 0;

    for (let i = 0; i < channelData.length; i += chunkSize) {
      let sum = 0;
      let peak = 0;
      const end = Math.min(i + chunkSize, channelData.length);

      for (let j = i; j < end; j++) {
        const v = Math.abs(channelData[j]);
        sum += v * v;
        if (v > peak) peak = v;
      }

      const rms = Math.sqrt(sum / (end - i));
      const combined = rms * 0.7 + peak * 0.3;  // Same formula as runtime

      if (combined > maxRms) {
        maxRms = combined;
      }
    }

    // Return with small buffer to avoid edge cases
    return Math.max(0.01, maxRms);
  }

  startPlayback() {
    if (!this.audioBuffer || !this.audioContext) return;

    // Create new source
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.source.onended = () => {
      this.isPlaying = false;
    };

    this.source.start(0);
    this.isPlaying = true;
  }

  togglePlayback() {
    if (this.isPlaying) {
      if (this.source) {
        this.source.stop();
        this.source.disconnect();
      }
      this.isPlaying = false;
    } else {
      this.startPlayback();
    }
  }

  /**
   * Calculate audio loudness normalized against track's peak
   * @returns {number} Loudness from 0 to 1 (relative to track's loudest moment)
   */
  calculateLoudness() {
    if (!this.analyser || !this.waveformData) return 0;

    this.analyser.getByteTimeDomainData(this.waveformData);

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < this.waveformData.length; i++) {
      const v = Math.abs(this.waveformData[i] - 128) / 128;
      sum += v * v;
      if (v > peak) peak = v;
    }
    const rms = Math.sqrt(sum / this.waveformData.length);

    // Combine RMS and peak (same formula as pre-analysis)
    const combined = rms * 0.7 + peak * 0.3;

    // Normalize against the track's pre-analyzed peak
    // This makes loudness relative to this specific track
    const normalized = combined / this.peakLoudness;

    return Math.min(1, normalized);
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    this.idlePhase += dt * 0.5;

    // Calculate chaos level (INVERTED from loudness)
    if (this.isPlaying) {
      const loudness = this.calculateLoudness();
      // INVERT: quiet = chaos, loud = calm
      this.targetChaosLevel = 1 - loudness;
    } else {
      // When not playing, show moderate chaos
      this.targetChaosLevel = 0.5 + Math.sin(this.time) * 0.3;
    }

    // Smooth chaos level transitions (slow and gradual)
    this.chaosLevel += (this.targetChaosLevel - this.chaosLevel) * dt * 2;

    // Update chaos effects
    this.colorPhase += dt * CONFIG.chaos.colorSpeed * this.chaosLevel;

    // Random glitch offset during high chaos
    if (this.chaosLevel > 0.5 && Math.random() < CONFIG.chaos.glitchChance * this.chaosLevel) {
      this.glitchOffset = (Math.random() - 0.5) * 100 * this.chaosLevel;
    } else {
      this.glitchOffset *= 0.9; // Decay glitch
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cy = h / 2;

    // Clear - faster fade during chaos for more trail effect
    const fadeSpeed = 0.1 + this.chaosLevel * 0.2;
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeSpeed})`;
    ctx.fillRect(0, 0, w, h);

    // Generate visualization points
    const points = this.generatePoints(w, h, cy);

    if (points.length < 2) return;

    // Draw the chaotic waveform
    this.drawChaosLine(ctx, points, w, h, cy);

    // Glitch effects only during high chaos (very quiet moments)
    if (this.chaosLevel > 0.7) {
      this.drawGlitchEffects(ctx, w, h);
    }

    // Draw UI
    this.drawUI(ctx, w, h);
  }

  /**
   * Generate waveform points with chaos applied
   */
  generatePoints(w, h, cy) {
    const points = [];
    const numPoints = 200;
    const chaos = this.chaosLevel;

    if (this.isPlaying && this.analyser && this.waveformData) {
      this.analyser.getByteTimeDomainData(this.waveformData);

      const step = Math.max(1, Math.floor(this.waveformData.length / numPoints));

      for (let i = 0; i < numPoints; i++) {
        const dataIndex = Math.min(i * step, this.waveformData.length - 1);
        const x = (i / numPoints) * w;

        // Original waveform value
        const originalV = (this.waveformData[dataIndex] - 128) / 128;

        // CHAOS: Add noise that scales with chaos level (slow, dreamy movement)
        const noiseFreq = CONFIG.chaos.noiseScale;
        const noise1 = Math.sin(i * noiseFreq * 50 + this.time * 2) * chaos;
        const noise2 = Math.sin(i * noiseFreq * 120 + this.time * 1.5) * chaos * 0.5;
        const noise3 = Math.sin(i * noiseFreq * 200 - this.time * 3) * chaos * 0.3;

        // Random spikes during high chaos
        let spike = 0;
        if (chaos > 0.7 && Math.random() < 0.02 * chaos) {
          spike = (Math.random() - 0.5) * 2 * chaos;
        }

        // KEY INVERSION:
        // When LOUD (chaos low): flatten the waveform → calm flat line
        // When QUIET (chaos high): show chaos noise → crazy line
        // Original signal is DAMPENED when loud, chaos noise takes over when quiet
        const dampening = chaos;  // 0 when loud, 1 when quiet
        const v = originalV * dampening * 0.3 + (noise1 + noise2 + noise3 + spike) * CONFIG.chaos.maxAmplitude;

        const y = cy + v * h * 0.4 + this.glitchOffset * chaos;
        points.push({ x, y, v, chaos });
      }
    } else {
      // Idle: slow dreamy animation
      for (let i = 0; i < numPoints; i++) {
        const x = (i / numPoints) * w;
        const t = this.idlePhase;

        const v = Math.sin(i * 0.05 + t * 0.8) * chaos * 0.3 +
                  Math.sin(i * 0.12 - t * 1.2) * chaos * 0.2 +
                  Math.sin(i * 0.03 + t * 0.3) * 0.05 +
                  (Math.random() - 0.5) * chaos * 0.1;

        const y = cy + v * h;
        points.push({ x, y, v, chaos });
      }
    }

    return points;
  }

  /**
   * Draw the main waveform line with chaos-based styling
   */
  drawChaosLine(ctx, points, w, h, cy) {
    ctx.save();

    const chaos = this.chaosLevel;

    // Color: stay GREEN when loud, only shift to red/chaos colors when actually quiet
    let hue;
    if (chaos < 0.5) {
      // Loud = calm green
      hue = CONFIG.calmHue;
    } else {
      // Quiet = shift toward chaos colors
      const chaosBlend = (chaos - 0.5) * 2;  // 0 to 1 for chaos 0.5 to 1
      const chaosHue = CONFIG.chaosHueStart + Math.sin(this.colorPhase) * CONFIG.chaosHueRange;
      hue = CONFIG.calmHue + (chaosHue - CONFIG.calmHue) * chaosBlend;
    }

    const saturation = 70 + chaos * 30;
    const lightness = 50 + chaos * 15;

    // Glow only during chaos (quiet moments)
    ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.shadowBlur = chaos > 0.5 ? CONFIG.glowAmount + (chaos - 0.5) * 60 : 5;

    // Line gets thicker during chaos
    ctx.lineWidth = CONFIG.lineWidth + (chaos > 0.5 ? (chaos - 0.5) * 6 : 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    // Draw the main line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      // Smoother curves during calm, jagged during chaos
      if (chaos < 0.4) {
        const cpX = p1.x + (p2.x - p1.x) * 0.5;
        const cpY = p1.y + (p2.y - p1.y) * 0.5;
        ctx.quadraticCurveTo(p1.x, p1.y, cpX, cpY);
      } else {
        // More direct lines for jagged chaos look
        ctx.lineTo(p1.x, p1.y);
      }
    }

    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();

    // Extra bright core during chaos
    if (chaos > 0.5) {
      ctx.globalAlpha = chaos * 0.8;
      ctx.lineWidth = CONFIG.lineWidth * 0.5;
      ctx.strokeStyle = `hsl(${hue}, 100%, 90%)`;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw glitch effects during high chaos
   */
  drawGlitchEffects(ctx, w, h) {
    const chaos = this.chaosLevel;

    // Horizontal scan lines
    ctx.fillStyle = `rgba(255, 0, 100, ${chaos * 0.1})`;
    const numLines = Math.floor(chaos * 10);
    for (let i = 0; i < numLines; i++) {
      const y = Math.random() * h;
      const lineH = 1 + Math.random() * 3;
      ctx.fillRect(0, y, w, lineH);
    }

    // Random color blocks
    if (Math.random() < chaos * 0.3) {
      const blockX = Math.random() * w;
      const blockY = Math.random() * h;
      const blockW = 20 + Math.random() * 100;
      const blockH = 5 + Math.random() * 20;
      ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 50%, ${chaos * 0.2})`;
      ctx.fillRect(blockX, blockY, blockW, blockH);
    }

    // Screen tear effect
    if (Math.random() < chaos * 0.1) {
      const tearY = Math.random() * h;
      const tearOffset = (Math.random() - 0.5) * 20;
      ctx.drawImage(this.canvas, 0, tearY, w, 10, tearOffset, tearY, w, 10);
    }
  }

  drawUI(ctx, w, h) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';

    if (!this.hasAudio) {
      // Title with chaos-aware styling
      const titleHue = this.chaosLevel > 0.5 ? Math.sin(this.colorPhase) * 60 : 0;
      ctx.fillStyle = `hsl(${titleHue}, 80%, 70%)`;
      ctx.fillText('"IT\'S NOT A BUG, IT\'S A FEATURE"', w / 2, h / 2 - 60);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '16px monospace';
      ctx.fillText('QUIET ANALYZER', w / 2, h / 2 - 30);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '12px monospace';
      ctx.fillText('The quieter the sound, the crazier the line', w / 2, h / 2 + 10);
      ctx.fillText('Click or drag & drop an audio file', w / 2, h / 2 + 30);

      // Drag over indicator
      if (this.dragOver) {
        ctx.strokeStyle = `hsl(0, 100%, 50%)`;
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(20, 20, w - 40, h - 40);
        ctx.setLineDash([]);
      }
    } else {
      // Now playing info
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px monospace';

      const status = this.isPlaying ? '▶ PLAYING' : '❚❚ PAUSED';
      ctx.fillText(status, 20, 30);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      const displayName = this.fileName.length > 40
        ? this.fileName.substring(0, 37) + '...'
        : this.fileName;
      ctx.fillText(displayName, 20, 50);

      // Chaos meter
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText('CHAOS:', 20, h - 40);

      // Chaos bar
      const barW = 100;
      const barH = 8;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(80, h - 47, barW, barH);

      const chaosHue = this.chaosLevel * 120; // Green to red
      ctx.fillStyle = `hsl(${120 - chaosHue}, 100%, 50%)`;
      ctx.fillRect(80, h - 47, barW * this.chaosLevel, barH);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText('Click to play/pause', 20, h - 20);
    }
  }

  stop() {
    if (this.source) {
      try {
        this.source.stop();
        this.source.disconnect();
      } catch (e) {}
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.fileInput && this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput);
    }
    super.stop();
  }
}

/**
 * Create Day 30 visualization
 */
export default function day30(canvas) {
  const game = new Day30Demo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game,
  };
}
