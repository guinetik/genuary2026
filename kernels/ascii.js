/**
 * ASCII Wave Field Kernel
 * 
 * Generative ASCII art using only HTML spans and CSS.
 * Characters flow in waves, react to mouse, and pulse with life.
 * 
 * Features:
 * - Pure HTML/CSS rendering (no canvas!)
 * - Animated character waves
 * - Mouse interaction ripples
 * - Color gradients via CSS
 */

const CONFIG = {
  cols: 80,
  rows: 35,
  chars: ' .:-=+*#%@',
  speed: 2,
  waveFreqX: 0.08,
  waveFreqY: 0.1,
  mouseRadius: 8,
  mouseForce: 3,
  colorCycle: 0.5,
};

/**
 * ASCII Art Demo - No canvas, only HTML elements
 */
class AsciiArtDemo {
  /**
   * @param {HTMLCanvasElement} canvas - We'll hide this and use our own container
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.time = 0;
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.ripples = [];
  }

  /**
   * Initialize the ASCII art display
   */
  init() {
    // Hide the canvas - we're going pure HTML!
    this.canvas.style.display = 'none';
    
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'ascii-art';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: 'Courier New', monospace;
      font-size: clamp(8px, 1.5vw, 14px);
      line-height: 1.1;
      overflow: hidden;
      cursor: crosshair;
      user-select: none;
    `;
    
    // Insert after canvas
    this.canvas.parentNode.insertBefore(this.container, this.canvas.nextSibling);
    
    // Create grid of characters
    this.grid = [];
    this.spans = [];
    
    for (let y = 0; y < CONFIG.rows; y++) {
      const row = document.createElement('div');
      row.style.cssText = 'white-space: pre; letter-spacing: 0.1em;';
      this.grid[y] = [];
      this.spans[y] = [];
      
      for (let x = 0; x < CONFIG.cols; x++) {
        const span = document.createElement('span');
        span.textContent = ' ';
        span.style.cssText = 'transition: color 0.1s;';
        row.appendChild(span);
        this.grid[y][x] = 0;
        this.spans[y][x] = span;
      }
      
      this.container.appendChild(row);
    }
    
    // Mouse tracking
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) / rect.width;
      this.mouseY = (e.clientY - rect.top) / rect.height;
    });
    
    // Click to create ripple
    this.container.addEventListener('click', (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      this.ripples.push({ x, y, time: 0, strength: 1 });
    });
    
    // Touch support
    this.container.addEventListener('touchmove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouseX = (touch.clientX - rect.left) / rect.width;
      this.mouseY = (touch.clientY - rect.top) / rect.height;
    }, { passive: true });
    
    this.container.addEventListener('touchstart', (e) => {
      const rect = this.container.getBoundingClientRect();
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) / rect.width;
      const y = (touch.clientY - rect.top) / rect.height;
      this.ripples.push({ x, y, time: 0, strength: 1 });
    }, { passive: true });
  }

  /**
   * Start the animation loop
   */
  start() {
    this.init();
    this.running = true;
    this.lastTime = performance.now();
    this.animate();
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.running) return;
    
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    
    this.update(dt);
    this.render();
    
    requestAnimationFrame(() => this.animate());
  }

  /**
   * Update simulation state
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this.time += dt * CONFIG.speed;
    
    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      this.ripples[i].time += dt * 3;
      this.ripples[i].strength *= 0.97;
      if (this.ripples[i].strength < 0.01) {
        this.ripples.splice(i, 1);
      }
    }
    
    // Update grid values
    for (let y = 0; y < CONFIG.rows; y++) {
      for (let x = 0; x < CONFIG.cols; x++) {
        const nx = x / CONFIG.cols;
        const ny = y / CONFIG.rows;
        
        // Base wave pattern
        let value = 0;
        value += Math.sin(x * CONFIG.waveFreqX + this.time) * 0.5;
        value += Math.sin(y * CONFIG.waveFreqY + this.time * 0.7) * 0.5;
        value += Math.sin((x + y) * 0.05 + this.time * 1.3) * 0.3;
        value += Math.sin(Math.sqrt(x * x + y * y) * 0.08 - this.time) * 0.4;
        
        // Mouse influence
        const dx = nx - this.mouseX;
        const dy = (ny - this.mouseY) * (CONFIG.rows / CONFIG.cols);
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        const mouseInfluence = Math.max(0, 1 - mouseDist / 0.2);
        value += mouseInfluence * CONFIG.mouseForce * Math.sin(this.time * 5);
        
        // Ripple influence
        for (const ripple of this.ripples) {
          const rdx = nx - ripple.x;
          const rdy = (ny - ripple.y) * (CONFIG.rows / CONFIG.cols);
          const rippleDist = Math.sqrt(rdx * rdx + rdy * rdy);
          const rippleWave = Math.sin(rippleDist * 30 - ripple.time * 10);
          const rippleFade = Math.max(0, 1 - rippleDist / 0.5);
          value += rippleWave * rippleFade * ripple.strength * 2;
        }
        
        // Normalize to 0-1
        this.grid[y][x] = (value + 2) / 4;
      }
    }
  }

  /**
   * Render the ASCII art
   */
  render() {
    const chars = CONFIG.chars;
    const charCount = chars.length;
    
    for (let y = 0; y < CONFIG.rows; y++) {
      for (let x = 0; x < CONFIG.cols; x++) {
        const value = Math.max(0, Math.min(1, this.grid[y][x]));
        const charIndex = Math.floor(value * (charCount - 1));
        const char = chars[charIndex];
        
        const span = this.spans[y][x];
        
        // Only update if changed
        if (span.textContent !== char) {
          span.textContent = char;
        }
        
        // Color based on position and time
        const hue = (x / CONFIG.cols * 60 + y / CONFIG.rows * 60 + this.time * CONFIG.colorCycle * 50) % 360;
        const saturation = 70 + value * 30;
        const lightness = 30 + value * 50;
        
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        if (span.style.color !== color) {
          span.style.color = color;
        }
      }
    }
  }

  /**
   * Stop the animation and cleanup
   */
  stop() {
    this.running = false;
    if (this.container) {
      this.container.remove();
    }
    this.canvas.style.display = '';
  }
}

export default AsciiArtDemo;
