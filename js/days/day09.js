/**
 * Day 9: Crazy Automaton
 *
 * COMPETING MYCELIUM SIMULATION
 * Multiple slime mold colonies compete for territory.
 * Each colony has its own color and agents that follow their own trails
 * while avoiding other species. Creates beautiful organic boundary patterns.
 *
 * Click to spawn a new colony at that location.
 */
import { Game, Painter } from "@guinetik/gcanvas";

const CONFIG = {
  // Colony settings
  colonyCount: 6,
  agentsPerColony: 15000,      // Many more agents for fine detail
  maxAgentsPerColony: 20000,
  
  // Agent settings
  moveSpeed: 1.0,
  turnSpeed: 0.3,              // Slower turns = smoother paths
  randomSteer: 0.05,           // Very low random = defined networks
  
  // Sensor settings
  sensorAngle: Math.PI / 4,    // 45 degrees
  sensorDistance: 9,
  
  // Trail settings
  trailWeight: 3,              // Light deposit
  decayRate: 0.96,             // Faster decay = thinner lines
  diffuseRate: 0,              // NO diffusion - keep lines sharp
  
  // Competition settings
  ownTrailAttraction: 1.5,     // Strong attraction to own trails
  enemyTrailRepulsion: 3.0,    // Very strong repulsion
  
  // Colony colors (hues for HSL)
  colonyHues: [0, 35, 120, 180, 240, 300],
  saturation: 100,
  lightness: 60,
};

/**
 * Single Physarum agent belonging to a colony
 */
class Agent {
  constructor(x, y, angle, colonyId) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.colonyId = colonyId;
  }
}

/**
 * A colony of competing mycelium
 */
class Colony {
  constructor(id, hue, startX, startY) {
    this.id = id;
    this.hue = hue;
    this.startX = startX;
    this.startY = startY;
    this.agents = [];
  }
}

/**
 * Main competing mycelium simulation
 */
class Day09Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = null;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    this.container = this.canvas.parentElement;
    if (this.container) {
      this.enableFluidSize(this.container);
    }

    this.trailWidth = Math.floor(this.width);
    this.trailHeight = Math.floor(this.height);
    
    // Separate trail map for EACH colony
    this.colonies = [];
    this.trailMaps = [];
    this.trailMapsNext = [];
    
    // Create colonies at different positions
    const positions = this._getColonyStartPositions(CONFIG.colonyCount);
    
    // Calculate spawn radius based on canvas size (smaller = tighter starting clusters)
    const spawnRadius = Math.min(this.width, this.height) * 0.08;
    
    for (let i = 0; i < CONFIG.colonyCount; i++) {
      const hue = CONFIG.colonyHues[i % CONFIG.colonyHues.length];
      const pos = positions[i];
      const colony = new Colony(i, hue, pos.x, pos.y);
      
      // Spawn agents in a disc around start position
      for (let j = 0; j < CONFIG.agentsPerColony; j++) {
        const angle = Math.random() * Math.PI * 2;
        // Square root distribution for uniform disc
        const dist = Math.sqrt(Math.random()) * spawnRadius;
        const x = pos.x + Math.cos(angle) * dist;
        const y = pos.y + Math.sin(angle) * dist;
        // Random facing direction
        const facing = Math.random() * Math.PI * 2;
        colony.agents.push(new Agent(x, y, facing, i));
      }
      
      this.colonies.push(colony);
      this.trailMaps.push(new Float32Array(this.trailWidth * this.trailHeight));
      this.trailMapsNext.push(new Float32Array(this.trailWidth * this.trailHeight));
    }
    
    // Combined image for rendering
    this.trailImageData = this.ctx.createImageData(this.trailWidth, this.trailHeight);
    
    // Track next colony color for click spawns
    this.nextColonyHue = 0;
    
    // Click to spawn new colony
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.width / rect.width);
      const y = (e.clientY - rect.top) * (this.height / rect.height);
      this._spawnColony(x, y);
    });

    this.elapsedTime = 0;
    
    // Performance monitoring
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.fps = 60;
    this.updateTime = 0;
    this.renderTime = 0;
  }
  
  /**
   * Get evenly distributed start positions for colonies
   */
  _getColonyStartPositions(count) {
    const positions = [];
    const margin = 100;
    const w = this.width - margin * 2;
    const h = this.height - margin * 2;
    
    if (count <= 4) {
      // Corners
      const corners = [
        { x: margin, y: margin },
        { x: this.width - margin, y: margin },
        { x: margin, y: this.height - margin },
        { x: this.width - margin, y: this.height - margin },
      ];
      for (let i = 0; i < count; i++) {
        positions.push(corners[i]);
      }
    } else {
      // Distribute around edges and center
      positions.push({ x: margin, y: margin });
      positions.push({ x: this.width - margin, y: margin });
      positions.push({ x: margin, y: this.height - margin });
      positions.push({ x: this.width - margin, y: this.height - margin });
      positions.push({ x: this.width / 2, y: margin });
      positions.push({ x: this.width / 2, y: this.height - margin });
    }
    
    return positions;
  }
  
  /**
   * Spawn a new colony at click position
   */
  _spawnColony(x, y) {
    const id = this.colonies.length;
    const hue = (this.nextColonyHue * 60) % 360;
    this.nextColonyHue++;
    
    const colony = new Colony(id, hue, x, y);
    
    // Spawn agents
    for (let j = 0; j < CONFIG.agentsPerColony / 2; j++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 50;
      const ax = x + Math.cos(angle) * dist;
      const ay = y + Math.sin(angle) * dist;
      colony.agents.push(new Agent(ax, ay, Math.random() * Math.PI * 2, id));
    }
    
    this.colonies.push(colony);
    this.trailMaps.push(new Float32Array(this.trailWidth * this.trailHeight));
    this.trailMapsNext.push(new Float32Array(this.trailWidth * this.trailHeight));
  }

  /**
   * Sample a colony's trail map at a position
   */
  sampleTrail(colonyId, x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.trailWidth || iy < 0 || iy >= this.trailHeight) {
      return 0;
    }
    return this.trailMaps[colonyId][iy * this.trailWidth + ix];
  }
  
  /**
   * Sample total enemy trail strength at a position
   */
  sampleEnemyTrails(myColonyId, x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.trailWidth || iy < 0 || iy >= this.trailHeight) {
      return 0;
    }
    const idx = iy * this.trailWidth + ix;
    let total = 0;
    for (let i = 0; i < this.trailMaps.length; i++) {
      if (i !== myColonyId) {
        total += this.trailMaps[i][idx];
      }
    }
    return total;
  }

  /**
   * Deposit trail for a colony at a position (single pixel for sharp lines)
   */
  depositTrail(colonyId, x, y, amount) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.trailWidth || iy < 0 || iy >= this.trailHeight) {
      return;
    }
    const idx = iy * this.trailWidth + ix;
    this.trailMaps[colonyId][idx] = Math.min(255, this.trailMaps[colonyId][idx] + amount);
  }

  /**
   * Diffuse and decay all trail maps
   */
  processTrailMaps() {
    const w = this.trailWidth;
    const h = this.trailHeight;
    const decay = CONFIG.decayRate;
    const diffuse = CONFIG.diffuseRate;
    
    for (let c = 0; c < this.trailMaps.length; c++) {
      const trailMap = this.trailMaps[c];
      const trailMapNext = this.trailMapsNext[c];
      
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          
          if (diffuse > 0) {
            // Minimal diffusion - mostly just decay
            const sum = 
              trailMap[(y - 1) * w + x] * 0.1 +
              trailMap[y * w + (x - 1)] * 0.1 +
              trailMap[y * w + x] * 0.6 +
              trailMap[y * w + (x + 1)] * 0.1 +
              trailMap[(y + 1) * w + x] * 0.1;
            trailMapNext[idx] = sum * decay;
          } else {
            // No diffusion - just decay (sharp lines)
            trailMapNext[idx] = trailMap[idx] * decay;
          }
        }
      }
      
      // Swap buffers
      this.trailMaps[c] = trailMapNext;
      this.trailMapsNext[c] = trailMap;
    }
  }

  update(dt) {
    super.update(dt);
    this.elapsedTime += dt;
    
    const updateStart = performance.now();

    const w = this.trailWidth;
    const h = this.trailHeight;
    const sensorDist = CONFIG.sensorDistance;
    const sensorAngle = CONFIG.sensorAngle;
    const turnSpeed = CONFIG.turnSpeed;
    const ownAttract = CONFIG.ownTrailAttraction;
    const enemyRepel = CONFIG.enemyTrailRepulsion;

    // Update each colony's agents
    for (const colony of this.colonies) {
      for (const agent of colony.agents) {
        const cid = agent.colonyId;
        
        // Sense own trail at 3 positions
        const leftX = agent.x + Math.cos(agent.angle - sensorAngle) * sensorDist;
        const leftY = agent.y + Math.sin(agent.angle - sensorAngle) * sensorDist;
        const leftOwn = this.sampleTrail(cid, leftX, leftY) * ownAttract;
        const leftEnemy = this.sampleEnemyTrails(cid, leftX, leftY) * enemyRepel;
        const leftSense = leftOwn - leftEnemy;
        
        const centerX = agent.x + Math.cos(agent.angle) * sensorDist;
        const centerY = agent.y + Math.sin(agent.angle) * sensorDist;
        const centerOwn = this.sampleTrail(cid, centerX, centerY) * ownAttract;
        const centerEnemy = this.sampleEnemyTrails(cid, centerX, centerY) * enemyRepel;
        const centerSense = centerOwn - centerEnemy;
        
        const rightX = agent.x + Math.cos(agent.angle + sensorAngle) * sensorDist;
        const rightY = agent.y + Math.sin(agent.angle + sensorAngle) * sensorDist;
        const rightOwn = this.sampleTrail(cid, rightX, rightY) * ownAttract;
        const rightEnemy = this.sampleEnemyTrails(cid, rightX, rightY) * enemyRepel;
        const rightSense = rightOwn - rightEnemy;
        
        // Decide which way to turn
        const randomSteer = (Math.random() - 0.5) * CONFIG.randomSteer;
        
        if (centerSense > leftSense && centerSense > rightSense) {
          agent.angle += randomSteer;
        } else if (centerSense < leftSense && centerSense < rightSense) {
          agent.angle += (Math.random() < 0.5 ? -1 : 1) * turnSpeed + randomSteer;
        } else if (leftSense > rightSense) {
          agent.angle -= turnSpeed;
        } else if (rightSense > leftSense) {
          agent.angle += turnSpeed;
        } else {
          agent.angle += randomSteer * 2;
        }
        
        // Move forward
        const speed = CONFIG.moveSpeed;
        const newX = agent.x + Math.cos(agent.angle) * speed;
        const newY = agent.y + Math.sin(agent.angle) * speed;
        
        // Bounce off edges
        if (newX < 1 || newX >= w - 1 || newY < 1 || newY >= h - 1) {
          agent.angle = Math.random() * Math.PI * 2;
        } else {
          agent.x = newX;
          agent.y = newY;
          this.depositTrail(cid, agent.x, agent.y, CONFIG.trailWeight);
        }
      }
    }

    // Process all trail maps
    this.processTrailMaps();
    
    this.updateTime = performance.now() - updateStart;
  }

  /**
   * Convert HSL to RGB
   */
  hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return {
      r: Math.floor((r + m) * 255),
      g: Math.floor((g + m) * 255),
      b: Math.floor((b + m) * 255),
    };
  }

  render() {
    const renderStart = performance.now();
    const ctx = this.ctx;
    const w = this.trailWidth;
    const h = this.trailHeight;
    const data = this.trailImageData.data;
    const sat = CONFIG.saturation;
    const light = CONFIG.lightness;

    // Clear to black
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }

    // Combine all colony trails with their colors
    for (let c = 0; c < this.colonies.length; c++) {
      const colony = this.colonies[c];
      const trailMap = this.trailMaps[c];
      const rgb = this.hslToRgb(colony.hue, sat, light);
      
      for (let i = 0; i < trailMap.length; i++) {
        const value = trailMap[i];
        if (value > 0.1) {
          const idx = i * 4;
          // Sharp brightness - show fine detail
          const brightness = Math.min(1, value / 15);
          
          // Additive blending
          data[idx] = Math.min(255, data[idx] + rgb.r * brightness);
          data[idx + 1] = Math.min(255, data[idx + 1] + rgb.g * brightness);
          data[idx + 2] = Math.min(255, data[idx + 2] + rgb.b * brightness);
        }
      }
    }
    
    // Draw trail map
    ctx.putImageData(this.trailImageData, 0, 0);
    
    // Subtle glow - very light blur
    ctx.globalCompositeOperation = "lighter";
    ctx.filter = "blur(1px)";
    ctx.globalAlpha = 0.2;
    ctx.drawImage(this.canvas, 0, 0);
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    
    // Track render time and FPS
    this.renderTime = performance.now() - renderStart;
    this.frameCount++;
    
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
    
    // Performance HUD with background
    const totalAgents = this.colonies.reduce((sum, c) => sum + c.agents.length, 0);
    const trailMemMB = (this.colonies.length * this.trailWidth * this.trailHeight * 4 * 2) / (1024 * 1024);
    
    ctx.font = '10px "Fira Code", monospace';
    
    // Left side background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(10, this.height - 70, 130, 65);
    
    // Right side background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(this.width - 250, this.height - 40, 240, 35);
    
    // Left side text
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText(`FPS: ${this.fps}`, 15, this.height - 55);
    ctx.fillText(`UPDATE: ${this.updateTime.toFixed(1)}ms`, 15, this.height - 40);
    ctx.fillText(`RENDER: ${this.renderTime.toFixed(1)}ms`, 15, this.height - 25);
    ctx.fillText(`TRAIL MEM: ${trailMemMB.toFixed(1)}MB`, 15, this.height - 10);
    
    // Right side text
    ctx.textAlign = "right";
    ctx.fillText(`${this.colonies.length} COLONIES · ${totalAgents} AGENTS`, this.width - 15, this.height - 25);
    ctx.fillText("CLICK TO SPAWN COLONY", this.width - 15, this.height - 10);
  }
}

/**
 * Mount Day 09 into the provided canvas.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ stop: () => void, game: Day09Demo }}
 */
export default function day09(canvas) {
  const game = new Day09Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
