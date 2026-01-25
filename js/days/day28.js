/**
 * Genuary 2026 - Day 28
 * Prompt: "No libraries, only HTML"
 * 
 * @fileoverview GENUARY 2006 - VAPORWAVE EDITION
 * 
 * What if Genuary existed in 2006 and was designed by someone
 * who traveled back from the vaporwave future?
 * 
 * Features:
 * - Synthwave sunset gradient
 * - Neon grid floor
 * - Retro navigation
 * - VHS scanlines
 * - Floating geometric shapes
 * - Over-the-top everything
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

/**
 * Genuary 2006 Vaporwave Demo
 * 
 * Main demo class for Day 28, creating a vaporwave aesthetic using
 * only HTML elements (no canvas, no libraries).
 * 
 * @class Genuary2006Demo
 */
class Genuary2006Demo {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.visitors = Math.floor(Math.random() * 9000) + 1000;
  }

  generateStyles() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=VT323&family=Orbitron:wght@400;700;900&display=swap');
      
      @keyframes vhs-flicker {
        0%, 100% { opacity: 1; }
        92% { opacity: 1; }
        93% { opacity: 0.8; transform: translateX(2px); }
        94% { opacity: 1; transform: translateX(-1px); }
        95% { opacity: 0.9; }
      }
      @keyframes neon-pulse {
        0%, 100% { 
          text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 80px #ff00ff;
          filter: brightness(1);
        }
        50% { 
          text-shadow: 0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff;
          filter: brightness(0.9);
        }
      }
      @keyframes cyan-pulse {
        0%, 100% { text-shadow: 0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff; }
        50% { text-shadow: 0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff; }
      }
      @keyframes grid-scroll {
        from { transform: perspective(500px) rotateX(60deg) translateY(0); }
        to { transform: perspective(500px) rotateX(60deg) translateY(50px); }
      }
      @keyframes float-shape {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-30px) rotate(180deg); }
      }
      @keyframes sun-pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.05); }
      }
      @keyframes scanline {
        0% { top: 0; }
        100% { top: 100%; }
      }
      @keyframes marquee-scroll {
        from { transform: translateX(100%); }
        to { transform: translateX(-100%); }
      }
      @keyframes rainbow-border {
        0% { border-color: #ff0080; box-shadow: 0 0 20px #ff0080; }
        25% { border-color: #00ffff; box-shadow: 0 0 20px #00ffff; }
        50% { border-color: #ff00ff; box-shadow: 0 0 20px #ff00ff; }
        75% { border-color: #ffff00; box-shadow: 0 0 20px #ffff00; }
        100% { border-color: #ff0080; box-shadow: 0 0 20px #ff0080; }
      }
      @keyframes chrome-shine {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes blink-cursor {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      @keyframes glitch {
        0%, 90%, 100% { transform: translate(0); filter: none; }
        91% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
        92% { transform: translate(2px, -1px); filter: hue-rotate(-90deg); }
        93% { transform: translate(-1px, 2px); }
        94% { transform: translate(1px, -2px); filter: hue-rotate(180deg); }
      }
    `;
  }

  createFloatingShape(type, index) {
    const shape = document.createElement('div');
    const size = 30 + Math.random() * 50;
    const x = Math.random() * 100;
    const y = Math.random() * 60;
    const duration = 4 + Math.random() * 4;
    const delay = Math.random() * 4;
    
    let shapeStyle = '';
    const colors = ['#ff0080', '#00ffff', '#ff00ff', '#ffff00', '#00ff80'];
    const color = colors[index % colors.length];
    
    if (type === 'triangle') {
      shapeStyle = `
        width: 0; height: 0;
        border-left: ${size/2}px solid transparent;
        border-right: ${size/2}px solid transparent;
        border-bottom: ${size}px solid transparent;
        border-bottom-color: ${color};
        filter: drop-shadow(0 0 10px ${color});
      `;
    } else if (type === 'circle') {
      shapeStyle = `
        width: ${size}px; height: ${size}px;
        border: 3px solid ${color};
        border-radius: 50%;
        box-shadow: 0 0 20px ${color}, inset 0 0 20px ${color}40;
      `;
    } else {
      shapeStyle = `
        width: ${size}px; height: ${size}px;
        border: 3px solid ${color};
        box-shadow: 0 0 20px ${color};
        transform: rotate(45deg);
      `;
    }
    
    shape.style.cssText = `
      position: absolute;
      left: ${x}%;
      top: ${y}%;
      ${shapeStyle}
      animation: float-shape ${duration}s ease-in-out ${delay}s infinite;
      opacity: 0.6;
      z-index: 5;
    `;
    
    return shape;
  }

  init() {
    this.canvas.style.display = 'none';
    
    this.styleEl = document.createElement('style');
    this.styleEl.textContent = this.generateStyles();
    document.head.appendChild(this.styleEl);
    
    this.container = document.createElement('div');
    this.container.id = 'genuary2006';
    this.container.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: linear-gradient(
        180deg,
        #0a0a20 0%,
        #1a0a30 20%,
        #2d1b4e 35%,
        #4a1942 45%,
        #7b2d5b 55%,
        #d4458b 70%,
        #ff6b9d 80%,
        #ffb366 90%,
        #fff066 100%
      );
      overflow: hidden;
      font-family: 'Orbitron', 'Arial Black', sans-serif;
    `;

    // Perspective grid floor
    const gridContainer = document.createElement('div');
    gridContainer.style.cssText = `
      position: absolute;
      bottom: 0; left: -50%;
      width: 200%; height: 60%;
      overflow: hidden;
      z-index: 2;
    `;
    
    const grid = document.createElement('div');
    grid.style.cssText = `
      position: absolute;
      bottom: 0; left: 0;
      width: 100%; height: 200%;
      background-image: 
        linear-gradient(#ff00ff55 1px, transparent 1px),
        linear-gradient(90deg, #ff00ff55 1px, transparent 1px);
      background-size: 50px 50px;
      transform: perspective(500px) rotateX(60deg);
      transform-origin: bottom center;
      animation: grid-scroll 2s linear infinite;
    `;
    gridContainer.appendChild(grid);
    this.container.appendChild(gridContainer);

    // Sun
    const sun = document.createElement('div');
    sun.style.cssText = `
      position: absolute;
      left: 50%; top: 45%;
      transform: translate(-50%, -50%);
      width: 200px; height: 200px;
      background: linear-gradient(180deg, #ff6b9d 0%, #ff00ff 30%, #ff0080 50%, #220022 50%, transparent 50%);
      border-radius: 50%;
      box-shadow: 0 0 60px #ff0080, 0 0 100px #ff008080;
      animation: sun-pulse 4s ease-in-out infinite;
      z-index: 3;
    `;
    // Sun stripes
    for (let i = 0; i < 5; i++) {
      const stripe = document.createElement('div');
      stripe.style.cssText = `
        position: absolute;
        left: 0; right: 0;
        height: ${8 - i}px;
        background: #0a0a20;
        top: ${52 + i * 10}%;
      `;
      sun.appendChild(stripe);
    }
    this.container.appendChild(sun);

    // Floating shapes
    const shapes = ['triangle', 'circle', 'square'];
    for (let i = 0; i < 12; i++) {
      this.container.appendChild(this.createFloatingShape(shapes[i % 3], i));
    }

    // VHS Scanlines
    const scanlines = document.createElement('div');
    scanlines.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.1) 2px,
        rgba(0, 0, 0, 0.1) 4px
      );
      pointer-events: none;
      z-index: 1000;
    `;
    this.container.appendChild(scanlines);

    // Moving scanline
    const movingScan = document.createElement('div');
    movingScan.style.cssText = `
      position: absolute;
      left: 0; width: 100%;
      height: 5px;
      background: rgba(255, 255, 255, 0.1);
      animation: scanline 8s linear infinite;
      pointer-events: none;
      z-index: 1001;
    `;
    this.container.appendChild(movingScan);

    // Main content
    const content = document.createElement('div');
    content.style.cssText = `
      position: relative;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 10px 80px;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    `;

    // Top marquee
    const marqueeBar = document.createElement('div');
    marqueeBar.style.cssText = `
      width: 100%;
      background: linear-gradient(90deg, #000 0%, #1a0030 50%, #000 100%);
      border-top: 2px solid #ff00ff;
      border-bottom: 2px solid #00ffff;
      padding: 8px 0;
      overflow: hidden;
      box-shadow: 0 0 20px #ff00ff;
    `;
    const marquee = document.createElement('div');
    marquee.innerHTML = '★ WELCOME TO GENUARY 2006 ★ THE FUTURE OF GENERATIVE ART ★ 31 DAYS OF CREATIVE CODING ★ JOIN THE REVOLUTION ★ BEST VIEWED IN 1024x768 ★ ';
    marquee.style.cssText = `
      white-space: nowrap;
      animation: marquee-scroll 20s linear infinite;
      color: #0ff;
      font-size: 14px;
      font-family: 'VT323', monospace;
      letter-spacing: 2px;
    `;
    marqueeBar.appendChild(marquee);
    content.appendChild(marqueeBar);

    // Logo
    const logo = document.createElement('div');
    logo.style.cssText = `
      margin: 15px 0 10px;
      text-align: center;
      animation: vhs-flicker 5s infinite;
    `;
    
    const logoText = document.createElement('div');
    logoText.innerHTML = 'GENUARY';
    logoText.style.cssText = `
      font-size: clamp(48px, 12vw, 120px);
      font-weight: 900;
      background: linear-gradient(
        90deg,
        #ff0080 0%,
        #ff00ff 25%,
        #00ffff 50%,
        #ff00ff 75%,
        #ff0080 100%
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: chrome-shine 3s linear infinite, neon-pulse 2s ease-in-out infinite;
      text-shadow: none;
      filter: drop-shadow(0 0 30px #ff00ff);
      letter-spacing: 8px;
    `;
    
    const yearText = document.createElement('div');
    yearText.innerHTML = '2 0 0 6';
    yearText.style.cssText = `
      font-size: clamp(24px, 6vw, 60px);
      font-weight: 700;
      color: #0ff;
      letter-spacing: 20px;
      animation: cyan-pulse 2s ease-in-out infinite;
      margin-top: -10px;
    `;
    
    logo.appendChild(logoText);
    logo.appendChild(yearText);
    content.appendChild(logo);

    // Tagline
    const tagline = document.createElement('div');
    tagline.innerHTML = '「 31 DAYS OF CREATIVE CODING 」';
    tagline.style.cssText = `
      font-size: clamp(10px, 2vw, 16px);
      color: #ffffff;
      letter-spacing: 3px;
      margin-bottom: 15px;
      text-shadow: 0 0 10px #ff0080, 0 0 20px #ff0080;
    `;
    content.appendChild(tagline);

    // Navigation
    const nav = document.createElement('div');
    nav.style.cssText = `
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 15px;
    `;
    
    const navItems = ['HOME', 'PROMPTS', 'GALLERY', 'FAQ', 'THANKS', 'GUESTBOOK'];
    navItems.forEach((item, i) => {
      const btn = document.createElement('div');
      btn.innerHTML = item;
      btn.style.cssText = `
        padding: 8px 16px;
        background: linear-gradient(180deg, #2a0a40 0%, #1a0030 100%);
        border: 2px solid #ff00ff;
        color: #fff;
        font-size: clamp(10px, 2vw, 14px);
        font-weight: 700;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.3s;
        animation: rainbow-border 4s linear ${i * 0.5}s infinite;
        text-shadow: 0 0 10px #fff;
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'linear-gradient(180deg, #ff0080 0%, #ff00ff 100%)';
        btn.style.transform = 'scale(1.1) translateY(-5px)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'linear-gradient(180deg, #2a0a40 0%, #1a0030 100%)';
        btn.style.transform = 'scale(1)';
      });
      nav.appendChild(btn);
    });
    content.appendChild(nav);

    // Prompt preview
    const promptBox = document.createElement('div');
    promptBox.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #0ff;
      padding: 15px 30px;
      margin: 8px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 0 20px #0ff, inset 0 0 20px rgba(0, 255, 255, 0.1);
    `;
    
    const promptTitle = document.createElement('div');
    promptTitle.innerHTML = 'TODAY\'S PROMPT';
    promptTitle.style.cssText = `
      font-size: 12px;
      color: #0ff;
      letter-spacing: 4px;
      margin-bottom: 10px;
    `;
    
    const promptDay = document.createElement('div');
    promptDay.innerHTML = 'JAN 28';
    promptDay.style.cssText = `
      font-size: 24px;
      color: #ff0080;
      font-weight: 900;
      text-shadow: 0 0 20px #ff0080;
    `;
    
    const promptText = document.createElement('div');
    promptText.innerHTML = '"No libraries, no canvas, only HTML elements"';
    promptText.style.cssText = `
      font-size: 16px;
      color: #fff;
      font-style: italic;
      margin-top: 10px;
      font-family: 'VT323', monospace;
      animation: glitch 10s infinite;
    `;
    
    promptBox.appendChild(promptTitle);
    promptBox.appendChild(promptDay);
    promptBox.appendChild(promptText);
    content.appendChild(promptBox);

    // Visitor counter
    const counter = document.createElement('div');
    counter.style.cssText = `
      margin-top: 10px;
      text-align: center;
    `;
    
    const counterLabel = document.createElement('div');
    counterLabel.innerHTML = '► VISITORS ◄';
    counterLabel.style.cssText = `
      font-size: 10px;
      color: #ff0080;
      letter-spacing: 2px;
    `;
    
    const counterNum = document.createElement('div');
    counterNum.innerHTML = this.visitors.toString().padStart(6, '0');
    counterNum.id = 'visitor-count';
    counterNum.style.cssText = `
      font-family: 'VT323', monospace;
      font-size: 32px;
      color: #0f0;
      background: #000;
      padding: 5px 15px;
      border: 2px solid #0f0;
      box-shadow: 0 0 10px #0f0, inset 0 0 10px rgba(0, 255, 0, 0.2);
      letter-spacing: 5px;
    `;
    
    counter.appendChild(counterLabel);
    counter.appendChild(counterNum);
    content.appendChild(counter);
    this.counterEl = counterNum;

    // Footer badges
    const badges = document.createElement('div');
    badges.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 10px;
      flex-wrap: wrap;
      justify-content: center;
    `;
    
    const badgeTexts = ['NETSCAPE NOW!', 'MADE WITH ♥', 'Y2K READY', 'WEBRING'];
    badgeTexts.forEach(text => {
      const badge = document.createElement('div');
      badge.innerHTML = text;
      badge.style.cssText = `
        padding: 5px 12px;
        background: linear-gradient(180deg, #333 0%, #111 100%);
        border: 1px solid #666;
        color: #aaa;
        font-size: 10px;
        font-family: 'VT323', monospace;
      `;
      badges.appendChild(badge);
    });
    content.appendChild(badges);

    // Blinking cursor
    const cursor = document.createElement('div');
    cursor.innerHTML = '_';
    cursor.style.cssText = `
      position: absolute;
      bottom: 20px;
      font-size: 24px;
      color: #0f0;
      animation: blink-cursor 1s step-end infinite;
      font-family: 'VT323', monospace;
    `;
    content.appendChild(cursor);

    this.container.appendChild(content);
    this.canvas.parentNode.insertBefore(this.container, this.canvas.nextSibling);

    // Click to increment counter
    this.container.addEventListener('click', () => {
      this.visitors++;
      this.counterEl.innerHTML = this.visitors.toString().padStart(6, '0');
    });
  }

  start() {
    this.init();
    this.running = true;
  }

  stop() {
    this.running = false;
    if (this.container) this.container.remove();
    if (this.styleEl) this.styleEl.remove();
    this.canvas.style.display = '';
  }
}

/**
 * Create Day 28 visualization
 * 
 * Factory function that creates and starts the Genuary 2006 demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element (unused, HTML-only demo)
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {Genuary2006Demo} returns.game - The game instance
 */
export default function day28(canvas) {
  const game = new Genuary2006Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
