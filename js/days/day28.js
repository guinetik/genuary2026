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
// All 31 prompts for the prompts section
const PROMPTS_2006 = [
  "One color, one shape",
  "Twelve principles of animation",
  "Fibonacci forever",
  "Lowres",
  "Write 'Genuary'",
  "Lights on/off",
  "Boolean algebra",
  "A City",
  "Crazy automaton",
  "Polar coordinates",
  "Quine",
  "Boxes only",
  "Self portrait",
  "Everything fits perfectly",
  "Invisible object",
  "Order and disorder",
  "Wallpaper group",
  "Unexpected path",
  "16x16",
  "One line",
  "Bauhaus Poster",
  "Pen plotter ready",
  "Transparency",
  "Perfectionist's nightmare",
  "Organic Geometry",
  "Recursive Grids",
  "Lifeform",
  "No libraries, only HTML",
  "Genetic evolution",
  "It's not a bug, it's a feature",
  "GLSL day"
];

// Fake guestbook entries
const GUESTBOOK_ENTRIES = [
  { name: "xX_CyberPunk_Xx", date: "01/15/06", msg: "OMG this site is SO rad!! Added to my geocities links page! 🌟" },
  { name: "~*StarGazer*~", date: "01/18/06", msg: "Love the vaporwave aesthetic!! A E S T H E T I C" },
  { name: "NetNinja2006", date: "01/20/06", msg: "Best viewed in 1024x768 with Winamp playing in the background 🎵" },
  { name: "PixelQueen", date: "01/22/06", msg: "This reminds me of my Angelfire page! Nostalgia overload!!" },
  { name: "CodeWarrior", date: "01/25/06", msg: "Finally a site that understands the true meaning of WEB DESIGN" },
  { name: "NeonDreamer", date: "01/27/06", msg: "The grid... the sun... I am ONE with the V A P O R" },
  { name: "FlashMaster99", date: "01/28/06", msg: "No Flash?? Still looks amazing! Pure HTML power! 💪" },
  { name: "RetroGamer2K", date: "01/28/06", msg: "This is what the internet was MEANT to be. Take me back!" },
  { name: "CSSWizard", date: "01/28/06", msg: "The gradients... the animations... *chef's kiss* 👨‍🍳" },
  { name: "WebmasterJoe", date: "01/28/06", msg: "Added to my webring! Check out my site too: joes-cool-page.tripod.com" },
  { name: "DigitalNomad", date: "01/28/06", msg: "Surfing the information superhighway has never looked better! 🏄" },
  { name: "Y2KSurvivor", date: "01/28/06", msg: "We survived Y2K for THIS. Worth it. 10/10 would visit again." },
];

class Genuary2006Demo {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.visitors = Math.floor(Math.random() * 9000) + 1000;
    this.currentSection = 'home';
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
      @keyframes construction-blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0.3; }
      }
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes bounce-in {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes typing {
        from { width: 0; }
        to { width: 100%; }
      }
      @keyframes wave {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-5px); }
        75% { transform: translateY(5px); }
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
    this.navButtons = {};
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
        if (this.currentSection !== item.toLowerCase()) {
          btn.style.background = 'linear-gradient(180deg, #2a0a40 0%, #1a0030 100%)';
        }
        btn.style.transform = 'scale(1)';
      });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showSection(item.toLowerCase());
      });
      this.navButtons[item.toLowerCase()] = btn;
      nav.appendChild(btn);
    });
    content.appendChild(nav);

    // Dynamic content area - fills available space
    this.contentArea = document.createElement('div');
    this.contentArea.style.cssText = `
      width: 100%;
      max-width: 900px;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 20px;
    `;
    content.appendChild(this.contentArea);

    // Blinking cursor (always visible)
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

    // Show home section by default
    this.showSection('home');

    this.container.appendChild(content);
    this.canvas.parentNode.insertBefore(this.container, this.canvas.nextSibling);

    // Click to increment counter (only on home)
    this.container.addEventListener('click', (e) => {
      if (this.currentSection === 'home' && this.counterEl) {
        this.visitors++;
        this.counterEl.innerHTML = this.visitors.toString().padStart(6, '0');
      }
    });
  }

  showSection(section) {
    this.currentSection = section;
    this.contentArea.innerHTML = '';

    // Update nav button styles
    Object.entries(this.navButtons).forEach(([key, btn]) => {
      if (key === section) {
        btn.style.background = 'linear-gradient(180deg, #ff0080 0%, #ff00ff 100%)';
      } else {
        btn.style.background = 'linear-gradient(180deg, #2a0a40 0%, #1a0030 100%)';
      }
    });

    switch(section) {
      case 'home': this.renderHome(); break;
      case 'prompts': this.renderPrompts(); break;
      case 'gallery': this.renderGallery(); break;
      case 'faq': this.renderFAQ(); break;
      case 'thanks': this.renderThanks(); break;
      case 'guestbook': this.renderGuestbook(); break;
    }
  }

  renderHome() {
    // Two-column layout for home
    const homeGrid = document.createElement('div');
    homeGrid.style.cssText = `
      display: flex;
      gap: 20px;
      width: 100%;
      flex: 1;
      flex-wrap: wrap;
      justify-content: center;
      align-items: flex-start;
    `;

    // Left column - prompt box
    const promptBox = document.createElement('div');
    promptBox.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #0ff;
      padding: 20px 40px;
      flex: 1;
      min-width: 280px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 0 20px #0ff, inset 0 0 20px rgba(0, 255, 255, 0.1);
      animation: bounce-in 0.5s ease-out;
    `;

    const promptTitle = document.createElement('div');
    promptTitle.innerHTML = 'TODAY\'S PROMPT';
    promptTitle.style.cssText = `font-size: 12px; color: #0ff; letter-spacing: 4px; margin-bottom: 10px;`;

    const promptDay = document.createElement('div');
    promptDay.innerHTML = 'JAN 28';
    promptDay.style.cssText = `font-size: 24px; color: #ff0080; font-weight: 900; text-shadow: 0 0 20px #ff0080;`;

    const promptText = document.createElement('div');
    promptText.innerHTML = '"No libraries, no canvas, only HTML elements"';
    promptText.style.cssText = `font-size: 16px; color: #fff; font-style: italic; margin-top: 10px; font-family: 'VT323', monospace; animation: glitch 10s infinite;`;

    promptBox.appendChild(promptTitle);
    promptBox.appendChild(promptDay);
    promptBox.appendChild(promptText);
    homeGrid.appendChild(promptBox);

    // Right column - stats and info
    const statsBox = document.createElement('div');
    statsBox.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #ff0080;
      padding: 20px;
      flex: 1;
      min-width: 280px;
      max-width: 400px;
      box-shadow: 0 0 20px #ff0080;
      animation: bounce-in 0.5s ease-out 0.1s both;
    `;

    // Visitor counter
    const counter = document.createElement('div');
    counter.style.cssText = `text-align: center; margin-bottom: 20px;`;

    const counterLabel = document.createElement('div');
    counterLabel.innerHTML = '► VISITORS ◄';
    counterLabel.style.cssText = `font-size: 12px; color: #ff0080; letter-spacing: 2px; margin-bottom: 5px;`;

    const counterNum = document.createElement('div');
    counterNum.innerHTML = this.visitors.toString().padStart(6, '0');
    counterNum.style.cssText = `font-family: 'VT323', monospace; font-size: 36px; color: #0f0; background: #000; padding: 8px 20px; border: 2px solid #0f0; box-shadow: 0 0 10px #0f0, inset 0 0 10px rgba(0, 255, 0, 0.2); letter-spacing: 5px; display: inline-block;`;

    counter.appendChild(counterLabel);
    counter.appendChild(counterNum);
    statsBox.appendChild(counter);
    this.counterEl = counterNum;

    // Site stats
    const stats = document.createElement('div');
    stats.style.cssText = `font-family: 'VT323', monospace; color: #0ff; font-size: 14px; line-height: 1.8;`;
    stats.innerHTML = `
      <div>📅 DAYS COMPLETED: <span style="color: #ff0080">27 / 31</span></div>
      <div>🎨 ARTWORKS CREATED: <span style="color: #ffff00">${Math.floor(this.visitors * 2.7)}</span></div>
      <div>🌐 COUNTRIES REACHED: <span style="color: #00ff80">42</span></div>
      <div>💾 DISK SPACE USED: <span style="color: #ff00ff">4.2 MB</span></div>
      <div>☕ COFFEES CONSUMED: <span style="color: #ff6600">∞</span></div>
    `;
    statsBox.appendChild(stats);

    // Webring navigation
    const webring = document.createElement('div');
    webring.style.cssText = `margin-top: 15px; padding-top: 15px; border-top: 1px solid #ff008040; text-align: center;`;
    webring.innerHTML = `
      <div style="color: #ff0080; font-size: 12px; margin-bottom: 8px;">◄◄ CREATIVE CODING WEBRING ►►</div>
      <div style="display: flex; justify-content: center; gap: 10px;">
        <span style="color: #0ff; cursor: pointer;">[ ◄ PREV ]</span>
        <span style="color: #ffff00; cursor: pointer;">[ RANDOM ]</span>
        <span style="color: #0ff; cursor: pointer;">[ NEXT ► ]</span>
      </div>
    `;
    statsBox.appendChild(webring);

    homeGrid.appendChild(statsBox);
    this.contentArea.appendChild(homeGrid);

    // Footer badges
    const badges = document.createElement('div');
    badges.style.cssText = `display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap; justify-content: center;`;

    ['NETSCAPE NOW!', 'MADE WITH ♥', 'Y2K READY', 'BEST VIEWED 1024x768', 'NO FLASH REQUIRED', 'WEBRING MEMBER'].forEach(text => {
      const badge = document.createElement('div');
      badge.innerHTML = text;
      badge.style.cssText = `padding: 5px 12px; background: linear-gradient(180deg, #333 0%, #111 100%); border: 1px solid #666; color: #aaa; font-size: 10px; font-family: 'VT323', monospace; cursor: pointer; transition: all 0.2s;`;
      badge.addEventListener('mouseenter', () => {
        badge.style.borderColor = '#ff00ff';
        badge.style.color = '#fff';
        badge.style.boxShadow = '0 0 10px #ff00ff';
      });
      badge.addEventListener('mouseleave', () => {
        badge.style.borderColor = '#666';
        badge.style.color = '#aaa';
        badge.style.boxShadow = 'none';
      });
      badges.appendChild(badge);
    });
    this.contentArea.appendChild(badges);
  }

  renderPrompts() {
    const container = document.createElement('div');
    container.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #ff00ff;
      padding: 20px;
      width: 100%;
      flex: 1;
      overflow-y: auto;
      box-shadow: 0 0 30px #ff00ff;
      animation: bounce-in 0.5s ease-out;
      display: flex;
      flex-direction: column;
    `;

    const title = document.createElement('div');
    title.innerHTML = '★ ALL 31 PROMPTS ★';
    title.style.cssText = `font-size: 18px; color: #ff00ff; text-align: center; margin-bottom: 15px; text-shadow: 0 0 10px #ff00ff;`;
    container.appendChild(title);

    PROMPTS_2006.forEach((prompt, i) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        padding: 8px;
        border-bottom: 1px solid #ff00ff40;
        transition: all 0.2s;
        cursor: pointer;
      `;
      row.addEventListener('mouseenter', () => {
        row.style.background = '#ff00ff30';
        row.style.transform = 'translateX(10px)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = 'transparent';
        row.style.transform = 'translateX(0)';
      });

      const day = document.createElement('span');
      day.innerHTML = `DAY ${(i + 1).toString().padStart(2, '0')}`;
      day.style.cssText = `color: #0ff; font-family: 'VT323', monospace; width: 70px; flex-shrink: 0;`;

      const text = document.createElement('span');
      text.innerHTML = prompt;
      text.style.cssText = `color: #fff; font-family: 'VT323', monospace;`;

      row.appendChild(day);
      row.appendChild(text);
      container.appendChild(row);
    });

    this.contentArea.appendChild(container);
  }

  renderGallery() {
    const container = document.createElement('div');
    container.style.cssText = `
      text-align: center;
      animation: bounce-in 0.5s ease-out;
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
    `;

    const title = document.createElement('div');
    title.innerHTML = '🎨 GALLERY 🎨';
    title.style.cssText = `
      font-size: 24px;
      color: #ff00ff;
      margin-bottom: 15px;
      text-shadow: 0 0 20px #ff00ff;
    `;
    container.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.innerHTML = 'Click any thumbnail to view that day!';
    subtitle.style.cssText = `
      color: #0ff;
      font-family: 'VT323', monospace;
      margin-bottom: 15px;
    `;
    container.appendChild(subtitle);

    // Grid of images - responsive columns
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
      padding: 15px;
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid #ff00ff;
      box-shadow: 0 0 20px #ff00ff;
      flex: 1;
      overflow-y: auto;
      align-content: start;
    `;

    // Create thumbnails for days 1-30
    for (let i = 1; i <= 30; i++) {
      const thumb = document.createElement('div');
      thumb.style.cssText = `
        position: relative;
        aspect-ratio: 1;
        cursor: pointer;
        transition: all 0.3s;
        border: 2px solid #333;
        overflow: hidden;
      `;

      const img = document.createElement('img');
      img.src = `/${i.toString().padStart(3, '0')}.jpg`;
      img.alt = `Day ${i}`;
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: saturate(1.2) contrast(1.1);
      `;

      const label = document.createElement('div');
      label.innerHTML = i.toString().padStart(2, '0');
      label.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.8);
        color: #0ff;
        font-size: 10px;
        font-family: 'VT323', monospace;
        padding: 2px;
        text-align: center;
      `;

      thumb.appendChild(img);
      thumb.appendChild(label);

      thumb.addEventListener('mouseenter', () => {
        thumb.style.transform = 'scale(1.1)';
        thumb.style.zIndex = '10';
        thumb.style.border = '2px solid #ff00ff';
        thumb.style.boxShadow = '0 0 15px #ff00ff';
      });
      thumb.addEventListener('mouseleave', () => {
        thumb.style.transform = 'scale(1)';
        thumb.style.zIndex = '1';
        thumb.style.border = '2px solid #333';
        thumb.style.boxShadow = 'none';
      });
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        // Scroll to that day in the main page
        const section = document.querySelector(`#day-${i}`);
        if (section) {
          this.stop();
          section.scrollIntoView({ behavior: 'smooth' });
        } else {
          alert(`DAY ${i}: ${PROMPTS_2006[i-1]}\n\n[Loading from floppy disk... 💾]`);
        }
      });

      grid.appendChild(thumb);
    }

    container.appendChild(grid);

    // Day 31 coming soon
    const day31 = document.createElement('div');
    day31.innerHTML = '🚧 DAY 31 COMING SOON! 🚧';
    day31.style.cssText = `
      margin-top: 15px;
      color: #ffff00;
      font-family: 'VT323', monospace;
      animation: construction-blink 0.5s infinite;
    `;
    container.appendChild(day31);

    this.contentArea.appendChild(container);
  }

  renderFAQ() {
    const container = document.createElement('div');
    container.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #0ff;
      padding: 20px 30px;
      width: 100%;
      flex: 1;
      overflow-y: auto;
      box-shadow: 0 0 30px #0ff;
      animation: bounce-in 0.5s ease-out;
    `;

    const title = document.createElement('div');
    title.innerHTML = '❓ F.A.Q. ❓';
    title.style.cssText = `font-size: 24px; color: #0ff; text-align: center; margin-bottom: 20px; text-shadow: 0 0 10px #0ff;`;
    container.appendChild(title);

    const faqs = [
      { q: "What is Genuary?", a: "31 days of creative coding prompts to start the year! Make something every day based on the daily prompt. Share it online with #genuary and #genuary2006!" },
      { q: "Do I need to be an expert?", a: "NO! Everyone is welcome. Beginners, pros, anyone who wants to create! The point is to practice and have fun, not to be perfect." },
      { q: "What tools can I use?", a: "Anything! Processing, Flash, HTML, DHTML, Java applets, Director, Visual Basic... whatever makes you happy! The web is your canvas!" },
      { q: "Is it a competition?", a: "Not at all! It's about creativity and community. No prizes, no judges, just good vibes and creative energy ✨" },
      { q: "Can I use libraries?", a: "Yes! Use whatever helps you create... except for Day 28 where we go pure HTML 😉" },
      { q: "What if I miss a day?", a: "No worries! Do what you can. Even one piece is a win. You can always catch up or skip prompts that don't inspire you." },
      { q: "How do I share my work?", a: "Post on your Geocities page, LiveJournal, DeviantArt, or email us at genuary@geocities.com! Use hashtag #genuary2006!" },
      { q: "Can I do it in teams?", a: "Absolutely! Collaborate with friends, do it solo, remix others' work (with credit). Creativity has no rules!" },
    ];

    faqs.forEach(({ q, a }) => {
      const qEl = document.createElement('div');
      qEl.innerHTML = `▶ ${q}`;
      qEl.style.cssText = `color: #ff0080; font-weight: bold; margin-top: 15px; cursor: pointer;`;

      const aEl = document.createElement('div');
      aEl.innerHTML = a;
      aEl.style.cssText = `color: #fff; font-family: 'VT323', monospace; margin-left: 20px; margin-top: 5px;`;

      container.appendChild(qEl);
      container.appendChild(aEl);
    });

    this.contentArea.appendChild(container);
  }

  renderThanks() {
    const container = document.createElement('div');
    container.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #ffff00;
      padding: 30px;
      width: 100%;
      flex: 1;
      text-align: center;
      box-shadow: 0 0 30px #ffff00;
      animation: bounce-in 0.5s ease-out;
      display: flex;
      flex-direction: column;
      justify-content: center;
    `;

    const title = document.createElement('div');
    title.innerHTML = '💖 SPECIAL THANKS 💖';
    title.style.cssText = `font-size: 24px; color: #ffff00; margin-bottom: 20px; text-shadow: 0 0 10px #ffff00;`;
    container.appendChild(title);

    const thanks = [
      "The creative coding community",
      "Processing & p5.js creators",
      "Everyone who participates",
      "Coffee & energy drinks ☕",
      "Synthwave playlists 🎵",
      "The spirit of Web 1.0",
      "Geocities & Angelfire memories",
      "Winamp (it really whips the llama's ass)",
      "All the webring friends",
      "YOU for visiting! 💖",
    ];

    const colors = ['#ff0080', '#00ffff', '#ff00ff', '#ffff00', '#00ff80', '#fff', '#ff6600', '#00ff00', '#ff0080', '#00ffff'];
    thanks.forEach((text, i) => {
      const line = document.createElement('div');
      line.innerHTML = `★ ${text} ★`;
      line.style.cssText = `
        color: ${colors[i % colors.length]};
        margin: 8px 0;
        font-family: 'VT323', monospace;
        font-size: 18px;
        animation: wave 2s ease-in-out ${i * 0.15}s infinite;
        text-shadow: 0 0 10px ${colors[i % colors.length]};
      `;
      container.appendChild(line);
    });

    // Hearts animation
    const hearts = document.createElement('div');
    hearts.innerHTML = '💜💖💜💖💜';
    hearts.style.cssText = `font-size: 24px; margin-top: 20px;`;
    container.appendChild(hearts);

    this.contentArea.appendChild(container);
  }

  renderGuestbook() {
    const container = document.createElement('div');
    container.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #00ff80;
      padding: 20px;
      width: 100%;
      flex: 1;
      box-shadow: 0 0 30px #00ff80;
      animation: bounce-in 0.5s ease-out;
      display: flex;
      flex-direction: column;
    `;

    const title = document.createElement('div');
    title.innerHTML = '📖 GUESTBOOK 📖';
    title.style.cssText = `font-size: 24px; color: #00ff80; text-align: center; margin-bottom: 15px; text-shadow: 0 0 10px #00ff80;`;
    container.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.innerHTML = 'Sign our guestbook! Leave a message!';
    subtitle.style.cssText = `color: #aaa; text-align: center; margin-bottom: 15px; font-family: 'VT323', monospace;`;
    container.appendChild(subtitle);

    // Entries
    const entriesDiv = document.createElement('div');
    entriesDiv.style.cssText = `flex: 1; overflow-y: auto; margin-bottom: 15px;`;

    GUESTBOOK_ENTRIES.forEach(entry => {
      const entryEl = document.createElement('div');
      entryEl.style.cssText = `
        background: #111;
        border: 1px solid #00ff8080;
        padding: 10px;
        margin-bottom: 10px;
      `;

      const header = document.createElement('div');
      header.innerHTML = `<span style="color: #ff0080">${entry.name}</span> <span style="color: #666">wrote on ${entry.date}:</span>`;
      header.style.cssText = `font-size: 12px; margin-bottom: 5px;`;

      const msg = document.createElement('div');
      msg.innerHTML = entry.msg;
      msg.style.cssText = `color: #0ff; font-family: 'VT323', monospace;`;

      entryEl.appendChild(header);
      entryEl.appendChild(msg);
      entriesDiv.appendChild(entryEl);
    });
    container.appendChild(entriesDiv);

    // Sign form
    const form = document.createElement('div');
    form.style.cssText = `border-top: 1px solid #00ff80; padding-top: 15px;`;

    const input = document.createElement('input');
    input.placeholder = 'Your message here...';
    input.style.cssText = `
      width: 100%;
      padding: 10px;
      background: #000;
      border: 2px solid #00ff80;
      color: #0ff;
      font-family: 'VT323', monospace;
      font-size: 16px;
      box-sizing: border-box;
    `;

    const signBtn = document.createElement('div');
    signBtn.innerHTML = '✍️ SIGN GUESTBOOK';
    signBtn.style.cssText = `
      margin-top: 10px;
      padding: 10px;
      background: linear-gradient(180deg, #00ff80 0%, #008040 100%);
      color: #000;
      font-weight: bold;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    `;
    signBtn.addEventListener('mouseenter', () => {
      signBtn.style.transform = 'scale(1.05)';
      signBtn.style.boxShadow = '0 0 20px #00ff80';
    });
    signBtn.addEventListener('mouseleave', () => {
      signBtn.style.transform = 'scale(1)';
      signBtn.style.boxShadow = 'none';
    });
    signBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (input.value.trim()) {
        alert(`Thanks for signing! Your message "${input.value}" has been saved to our Geocities database! 💾`);
        input.value = '';
      } else {
        alert('Please enter a message!');
      }
    });

    form.appendChild(input);
    form.appendChild(signBtn);
    container.appendChild(form);

    this.contentArea.appendChild(container);
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
