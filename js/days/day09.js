/**
 * Genuary 2026 - Day 9
 * Prompt: "Crazy automaton"
 * 
 * @fileoverview COMPETING MYCELIUM SIMULATION
 * 
 * Multiple slime mold colonies compete for territory.
 * Each colony has its own color and agents that follow their own trails
 * while avoiding other species. Creates beautiful organic boundary patterns.
 * 
 * Click to spawn a new colony at that location.
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */
import { Game, Painter, ToggleButton } from "@guinetik/gcanvas";

const CONFIG = {
  // Colony settings
  colonyCount: 6,
  // Agents scale with screen size
  baseAgentsPerColony: 5000,   // Base count @ 1080p
  baseArea: 1920 * 1080,       // Reference resolution
  minAgentsPerColony: 3000,    // Minimum on small screens
  maxAgentsPerColony: 15000,   // Maximum on 4K+
  
  // Agent settings
  moveSpeed: 1.0,
  turnSpeed: 0.3,
  randomSteer: 0.05,
  
  // Sensor settings
  sensorAngle: Math.PI / 4,
  sensorDistance: 9,
  
  // Trail settings
  trailWeight: 5,              // Slightly stronger to compensate for lower res
  decayRate: 0.96,
  diffuseRate: 0,
  trailScale: 0.55,            // Trail map resolution scale (0.25 = quarter res)
  
  // Competition settings
  ownTrailAttraction: 1.5,
  enemyTrailRepulsion: 3.0,
  
  // Death settings
  starvationThreshold: 0.5,    // Die if own trail below this
  enemyDeathThreshold: 10,     // Die if enemy trail above this (lowered)
  deathCheckInterval: 0.2,     // Check more frequently
  deathChance: 0.1,            // 10% chance for starvation
  enemyDeathChance: 1.0,       // 100% instant death in enemy territory
  foodPerAgent: 2,             // Need 2 food to create 1 new agent
  foodLifetime: 10,             // Food decays after 10 seconds
  
  // Colony colors (base hues for HSL - will be randomized slightly)
  colonyBaseHues: [0, 35, 120, 180, 240, 300],  // Red, Orange, Green, Cyan, Blue, Magenta
  hueVariation: 20,            // +/- random variation
  saturation: 100,
  lightness: 60,
  
  // Rendering
  brightnessScale: 15,         // Trail brightness divisor
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
    this.foodBank = 0; // Collected food, converts to agent at threshold
  }
}

/**
 * Main competing mycelium simulation
 */
/**
 * Day 9 Demo
 * 
 * Main game class for Day 9, creating a competing mycelium simulation
 * with multiple slime mold colonies. Features agent-based pathfinding
 * and territory competition.
 * 
 * @class Day09Demo
 * @extends {Game}
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

    // Calculate agents per colony based on screen size
    const areaScale = (this.width * this.height) / CONFIG.baseArea;
    this.agentsPerColony = Math.floor(
      Math.min(CONFIG.maxAgentsPerColony,
        Math.max(CONFIG.minAgentsPerColony, CONFIG.baseAgentsPerColony * areaScale))
    );
    console.log(`[Day09] Canvas: ${this.width}x${this.height}, agents/colony: ${this.agentsPerColony}`);
    
    // Use scaled trail maps for performance (half res on 4K = 4x less pixels)
    const scale = CONFIG.trailScale;
    this.trailWidth = Math.floor(this.width * scale);
    this.trailHeight = Math.floor(this.height * scale);
    this.trailScale = scale;
    
    // Separate trail map for EACH colony
    this.colonies = [];
    this.trailMaps = [];
    this.trailMapsNext = [];
    
    // Create colonies at different positions (shuffled for variety)
    const positions = this._getColonyStartPositions(CONFIG.colonyCount);
    this._shuffle(positions);
    
    // Randomize hues slightly for variety
    const hues = CONFIG.colonyBaseHues.map(baseHue => {
      const variation = (Math.random() - 0.5) * 2 * CONFIG.hueVariation;
      return (baseHue + variation + 360) % 360;
    });
    this._shuffle(hues);
    
    // Calculate spawn radius based on canvas size (smaller = tighter starting clusters)
    const spawnRadius = Math.min(this.width, this.height) * 0.08;
    
    for (let i = 0; i < CONFIG.colonyCount; i++) {
      const hue = hues[i % hues.length];
      const pos = positions[i];
      const colony = new Colony(i, hue, pos.x, pos.y);
      
      // Spawn agents in a disc around start position
      for (let j = 0; j < this.agentsPerColony; j++) {
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
    
    // Click to reinforce nearest colony (but not if clicking the button)
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.width / rect.width);
      const y = (e.clientY - rect.top) * (this.height / rect.height);
      
      // Check if click is on the stats button area
      if (this.statsButton) {
        const btnX = this.statsButton.x;
        const btnY = this.statsButton.y;
        const btnW = this.statsButton.width;
        const btnH = this.statsButton.height;
        if (x >= btnX - btnW/2 && x <= btnX + btnW/2 &&
            y >= btnY - btnH/2 && y <= btnY + btnH/2) {
          return; // Don't reinforce, button handles it
        }
      }
      
      // If overlay is showing, click closes it
      if (this.showDataOverlay) {
        this.showDataOverlay = false;
        if (this.statsButton) this.statsButton.toggle(false);
        return;
      }
      
      this._reinforceNearestColony(x, y);
    });
    
    // Keyboard controls
    this._keyHandler = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this._restart();
      } else if (e.key === 'i' || e.key === 'I') {
        // 'I' toggles left side performance stats only
        this.showPerformance = !this.showPerformance;
      }
    };
    window.addEventListener("keydown", this._keyHandler);

    this.elapsedTime = 0;
    
    // Performance monitoring
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.fps = 60;
    this.updateTime = 0;
    this.renderTime = 0;
    
    // Death tracking
    this.lastDeathCheck = 0;
    
    // Food particles (dead agents that can be claimed)
    this.food = [];
    
    // Offscreen canvas for trail rendering (avoid creating in render loop)
    this._trailCanvas = document.createElement('canvas');
    this._trailCanvas.width = this.trailWidth;
    this._trailCanvas.height = this.trailHeight;
    this._trailCtx = this._trailCanvas.getContext('2d');
    
    // Data overlay (chart - button toggle)
    this.showDataOverlay = false;
    this.history = [];
    this.lastHistoryTime = 0;
    this.historyInterval = 0.5; // Record every 0.5 seconds
    this.maxHistoryLength = 120; // 60 seconds of data
    
    // Performance stats (left side - 'I' key toggle)
    this.showPerformance = false;
    
    // Stats button (top-right for mobile support)
    this.statsButton = new ToggleButton(this, {
      text: "[i]",
      x: this.width - 22,
      y: 22,
      width: 36,
      height: 36,
      font: '14px "Fira Code", monospace',
      startToggled: false,
      onToggle: (toggled) => {
        this.showDataOverlay = toggled;
      },
    });
    this.pipeline.add(this.statsButton);
  }
  
  /**
   * Fisher-Yates shuffle
   */
  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
   * Restart the simulation
   */
  _restart() {
    // Clear trail maps
    for (let c = 0; c < this.trailMaps.length; c++) {
      this.trailMaps[c].fill(0);
    }
    
    // Clear food
    this.food = [];
    
    // Respawn agents for each colony
    const spawnRadius = Math.min(this.width, this.height) * 0.08;
    const positions = this._getColonyStartPositions(CONFIG.colonyCount);
    
    for (let i = 0; i < this.colonies.length; i++) {
      const colony = this.colonies[i];
      const pos = positions[i];
      colony.agents = [];
      colony.foodBank = 0;
      
      for (let j = 0; j < this.agentsPerColony; j++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * spawnRadius;
        const x = pos.x + Math.cos(angle) * dist;
        const y = pos.y + Math.sin(angle) * dist;
        const facing = Math.random() * Math.PI * 2;
        colony.agents.push(new Agent(x, y, facing, i));
      }
    }
    
    this.elapsedTime = 0;
    this.history = [];
    this.lastHistoryTime = 0;
  }
  
  /**
   * Reinforce the nearest colony at click position
   */
  _reinforceNearestColony(x, y) {
    if (this.colonies.length === 0) return;
    
    // Find nearest colony by checking average position of its agents
    let nearestColony = null;
    let nearestDist = Infinity;
    
    for (const colony of this.colonies) {
      if (colony.agents.length === 0) continue;
      
      // Calculate colony center (average agent position)
      let cx = 0, cy = 0;
      for (const agent of colony.agents) {
        cx += agent.x;
        cy += agent.y;
      }
      cx /= colony.agents.length;
      cy /= colony.agents.length;
      
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestColony = colony;
      }
    }
    
    if (!nearestColony) return;
    if (nearestColony.agents.length >= CONFIG.maxAgentsPerColony) return;
    
    // Spawn reinforcement agents at click location
    const spawnCount = Math.min(500, CONFIG.maxAgentsPerColony - nearestColony.agents.length);
    for (let j = 0; j < spawnCount; j++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 30;
      const ax = x + Math.cos(angle) * dist;
      const ay = y + Math.sin(angle) * dist;
      nearestColony.agents.push(new Agent(ax, ay, Math.random() * Math.PI * 2, nearestColony.id));
    }
  }

  /**
   * Sample a colony's trail map at a position (scaled coordinates) - INLINED in update for perf
   */
  sampleTrail(colonyId, x, y) {
    const ix = Math.floor(x * this.trailScale);
    const iy = Math.floor(y * this.trailScale);
    if (ix < 0 || ix >= this.trailWidth || iy < 0 || iy >= this.trailHeight) {
      return 0;
    }
    return this.trailMaps[colonyId][iy * this.trailWidth + ix];
  }
  
  /**
   * Sample max enemy trail at a position (only check strongest enemy, not sum)
   */
  sampleEnemyTrails(myColonyId, x, y) {
    const ix = Math.floor(x * this.trailScale);
    const iy = Math.floor(y * this.trailScale);
    if (ix < 0 || ix >= this.trailWidth || iy < 0 || iy >= this.trailHeight) {
      return 0;
    }
    const idx = iy * this.trailWidth + ix;
    let maxEnemy = 0;
    const maps = this.trailMaps;
    const len = maps.length;
    for (let i = 0; i < len; i++) {
      if (i !== myColonyId) {
        const val = maps[i][idx];
        if (val > maxEnemy) maxEnemy = val;
      }
    }
    return maxEnemy;
  }

  /**
   * Deposit trail for a colony at a position (scaled coordinates)
   */
  depositTrail(colonyId, x, y, amount) {
    const ix = Math.floor(x * this.trailScale);
    const iy = Math.floor(y * this.trailScale);
    if (ix < 0 || ix >= this.trailWidth || iy < 0 || iy >= this.trailHeight) {
      return;
    }
    const idx = iy * this.trailWidth + ix;
    this.trailMaps[colonyId][idx] = Math.min(255, this.trailMaps[colonyId][idx] + amount);
  }

  /**
   * Decay all trail maps (optimized - no diffusion since diffuseRate=0)
   */
  processTrailMaps() {
    const w = this.trailWidth;
    const h = this.trailHeight;
    const decay = CONFIG.decayRate;
    const len = w * h;
    
    for (let c = 0; c < this.trailMaps.length; c++) {
      const trailMap = this.trailMaps[c];
      // In-place decay (no buffer swap needed for simple decay)
      for (let i = 0; i < len; i++) {
        trailMap[i] *= decay;
      }
    }
  }

  update(dt) {
    super.update(dt);
    this.elapsedTime += dt;
    
    const updateStart = performance.now();
    let agentTime = 0, trailTime = 0, deathTime = 0, foodTime = 0;

    const w = this.trailWidth;
    const h = this.trailHeight;
    const sensorDist = CONFIG.sensorDistance;
    const sensorAngle = CONFIG.sensorAngle;
    const turnSpeed = CONFIG.turnSpeed;
    const ownAttract = CONFIG.ownTrailAttraction;
    const enemyRepel = CONFIG.enemyTrailRepulsion;

    const t0 = performance.now();
    // Cache frequently accessed values
    const trailMaps = this.trailMaps;
    const trailScale = this.trailScale;
    const trailWidth = this.trailWidth;
    const trailHeight = this.trailHeight;
    const numColonies = trailMaps.length;
    const canvasW = this.width;
    const canvasH = this.height;
    const moveSpeed = CONFIG.moveSpeed;
    const trailWeight = CONFIG.trailWeight;
    const randomSteerBase = CONFIG.randomSteer;

    // Update each colony's agents
    for (const colony of this.colonies) {
      const cid = colony.id;
      const ownMap = trailMaps[cid];
      const agents = colony.agents;
      const agentCount = agents.length;
      
      for (let ai = 0; ai < agentCount; ai++) {
        const agent = agents[ai];
        const ax = agent.x;
        const ay = agent.y;
        const angle = agent.angle;
        
        // Precompute trig for sensor positions
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const cosLeft = Math.cos(angle - sensorAngle);
        const sinLeft = Math.sin(angle - sensorAngle);
        const cosRight = Math.cos(angle + sensorAngle);
        const sinRight = Math.sin(angle + sensorAngle);
        
        // Left sensor - inline sampling
        const leftX = Math.floor((ax + cosLeft * sensorDist) * trailScale);
        const leftY = Math.floor((ay + sinLeft * sensorDist) * trailScale);
        let leftOwn = 0, leftEnemy = 0;
        if (leftX >= 0 && leftX < trailWidth && leftY >= 0 && leftY < trailHeight) {
          const idx = leftY * trailWidth + leftX;
          leftOwn = ownMap[idx] * ownAttract;
          for (let i = 0; i < numColonies; i++) {
            if (i !== cid) {
              const val = trailMaps[i][idx];
              if (val > leftEnemy) leftEnemy = val;
            }
          }
          leftEnemy *= enemyRepel;
        }
        const leftSense = leftOwn - leftEnemy;
        
        // Center sensor
        const centerX = Math.floor((ax + cosAngle * sensorDist) * trailScale);
        const centerY = Math.floor((ay + sinAngle * sensorDist) * trailScale);
        let centerOwn = 0, centerEnemy = 0;
        if (centerX >= 0 && centerX < trailWidth && centerY >= 0 && centerY < trailHeight) {
          const idx = centerY * trailWidth + centerX;
          centerOwn = ownMap[idx] * ownAttract;
          for (let i = 0; i < numColonies; i++) {
            if (i !== cid) {
              const val = trailMaps[i][idx];
              if (val > centerEnemy) centerEnemy = val;
            }
          }
          centerEnemy *= enemyRepel;
        }
        const centerSense = centerOwn - centerEnemy;
        
        // Right sensor
        const rightX = Math.floor((ax + cosRight * sensorDist) * trailScale);
        const rightY = Math.floor((ay + sinRight * sensorDist) * trailScale);
        let rightOwn = 0, rightEnemy = 0;
        if (rightX >= 0 && rightX < trailWidth && rightY >= 0 && rightY < trailHeight) {
          const idx = rightY * trailWidth + rightX;
          rightOwn = ownMap[idx] * ownAttract;
          for (let i = 0; i < numColonies; i++) {
            if (i !== cid) {
              const val = trailMaps[i][idx];
              if (val > rightEnemy) rightEnemy = val;
            }
          }
          rightEnemy *= enemyRepel;
        }
        const rightSense = rightOwn - rightEnemy;
        
        // Decide which way to turn
        const randomSteer = (Math.random() - 0.5) * randomSteerBase;
        let newAngle = angle;
        
        if (centerSense > leftSense && centerSense > rightSense) {
          newAngle += randomSteer;
        } else if (centerSense < leftSense && centerSense < rightSense) {
          newAngle += (Math.random() < 0.5 ? -1 : 1) * turnSpeed + randomSteer;
        } else if (leftSense > rightSense) {
          newAngle -= turnSpeed;
        } else if (rightSense > leftSense) {
          newAngle += turnSpeed;
        } else {
          newAngle += randomSteer * 2;
        }
        
        // Move forward
        const newX = ax + Math.cos(newAngle) * moveSpeed;
        const newY = ay + Math.sin(newAngle) * moveSpeed;
        
        // Bounce off edges
        if (newX < 1 || newX >= canvasW - 1 || newY < 1 || newY >= canvasH - 1) {
          agent.angle = Math.random() * Math.PI * 2;
        } else {
          agent.x = newX;
          agent.y = newY;
          agent.angle = newAngle;
          // Inline deposit
          const dx = Math.floor(newX * trailScale);
          const dy = Math.floor(newY * trailScale);
          if (dx >= 0 && dx < trailWidth && dy >= 0 && dy < trailHeight) {
            const idx = dy * trailWidth + dx;
            ownMap[idx] = Math.min(255, ownMap[idx] + trailWeight);
          }
        }
      }
    }

    agentTime = performance.now() - t0;
    
    // Process all trail maps
    const t1 = performance.now();
    this.processTrailMaps();
    trailTime = performance.now() - t1;
    
    // Death check (not every frame for performance)
    const t2 = performance.now();
    this.lastDeathCheck += dt;
    if (this.lastDeathCheck >= CONFIG.deathCheckInterval) {
      this.lastDeathCheck = 0;
      this._processDeaths();
    }
    deathTime = performance.now() - t2;
    
    // Food claiming and decay
    const t3 = performance.now();
    this._processFood();
    this._decayFood();
    foodTime = performance.now() - t3;
    
    this.updateTime = performance.now() - updateStart;
    
    // Record history for charts (keep all data, no scrolling)
    if (this.elapsedTime - this.lastHistoryTime >= this.historyInterval) {
      this.lastHistoryTime = this.elapsedTime;
      const counts = {};
      for (const colony of this.colonies) {
        counts[colony.id] = colony.agents.length;
      }
      this.history.push({ time: this.elapsedTime, counts });
    }
  }
  
  /**
   * Process agent deaths from starvation and enemy territory
   */
  _processDeaths() {
    const starvationThreshold = CONFIG.starvationThreshold;
    const enemyThreshold = CONFIG.enemyDeathThreshold;
    const starvationChance = CONFIG.deathChance;
    const enemyChance = CONFIG.enemyDeathChance;
    
    for (const colony of this.colonies) {
      // Filter out dead agents, collect dead ones as food
      colony.agents = colony.agents.filter(agent => {
        const cid = agent.colonyId;
        
        // Sample trails at agent position
        const ownTrail = this.sampleTrail(cid, agent.x, agent.y);
        const enemyTrail = this.sampleEnemyTrails(cid, agent.x, agent.y);
        
        // Enemy territory: instant death
        if (enemyTrail > enemyThreshold && Math.random() < enemyChance) {
          this.food.push({ x: agent.x, y: agent.y, born: this.elapsedTime });
          return false; // Dead
        }
        
        // Starvation: isolated from own colony (but not near borders - that's unfair)
        const edgeMargin = 50;
        const nearEdge = agent.x < edgeMargin || agent.x > this.width - edgeMargin ||
                         agent.y < edgeMargin || agent.y > this.height - edgeMargin;
        
        if (!nearEdge && ownTrail < starvationThreshold && Math.random() < starvationChance) {
          this.food.push({ x: agent.x, y: agent.y, born: this.elapsedTime });
          return false; // Dead
        }
        
        return true; // Alive
      });
    }
  }
  
  /**
   * Remove old food that hasn't been claimed
   */
  _decayFood() {
    const lifetime = CONFIG.foodLifetime;
    const now = this.elapsedTime;
    
    for (let i = this.food.length - 1; i >= 0; i--) {
      if (now - this.food[i].born > lifetime) {
        this.food.splice(i, 1);
      }
    }
  }
  
  /**
   * Check if agents claim nearby food (simple version for small food counts)
   */
  _processFood() {
    const foodLen = this.food.length;
    if (foodLen === 0) return;
    
    const claimRadius = 5;
    const claimRadiusSq = claimRadius * claimRadius;
    const foodPerAgent = CONFIG.foodPerAgent;
    const toRemove = [];
    
    // For small food counts, just check food against agents (not agents against food)
    // This is O(food × agents) but with food << agents, it's much faster
    for (let fi = foodLen - 1; fi >= 0; fi--) {
      const f = this.food[fi];
      const fx = f.x;
      const fy = f.y;
      
      // Find first agent close enough to claim
      outer: for (const colony of this.colonies) {
        const agents = colony.agents;
        const len = agents.length;
        // Sample only every 10th agent for speed (food will still get claimed eventually)
        for (let ai = 0; ai < len; ai += 10) {
          const agent = agents[ai];
          const dx = agent.x - fx;
          const dy = agent.y - fy;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < claimRadiusSq) {
            // Collect food
            colony.foodBank++;
            toRemove.push(fi);
            
            // Spawn new agent if enough food (10% chance for superfood: 2 agents for 1 food)
            if (colony.foodBank >= foodPerAgent && agents.length < CONFIG.maxAgentsPerColony) {
              const isSuperfood = Math.random() < 0.1;
              const spawnCount = isSuperfood ? 2 : 1;
              const cost = isSuperfood ? 1 : foodPerAgent;
              
              for (let s = 0; s < spawnCount; s++) {
                agents.push(new Agent(agent.x, agent.y, Math.random() * Math.PI * 2, colony.id));
              }
              colony.foodBank -= cost;
            }
            break outer;
          }
        }
      }
    }
    
    // Remove claimed food
    for (const i of toRemove) {
      this.food.splice(i, 1);
    }
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
          const brightness = Math.min(1, value / CONFIG.brightnessScale);
          
          // Additive blending
          data[idx] = Math.min(255, data[idx] + rgb.r * brightness);
          data[idx + 1] = Math.min(255, data[idx + 1] + rgb.g * brightness);
          data[idx + 2] = Math.min(255, data[idx + 2] + rgb.b * brightness);
        }
      }
    }
    
    // Draw trail map (scaled up to canvas size)
    this._trailCtx.putImageData(this.trailImageData, 0, 0);
    
    // Scale up with image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this._trailCanvas, 0, 0, this.width, this.height);
    
    // Glow/blur effect with normal blending (preserves colors)
    ctx.filter = "blur(3px)";
    ctx.globalAlpha = 0.4;
    ctx.drawImage(this.canvas, 0, 0);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    
    // Draw food particles as white dots (larger and brighter)
    if (this.food.length > 0) {
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 4;
      for (const f of this.food) {
        ctx.fillRect(f.x - 2, f.y - 2, 4, 4);
      }
      ctx.shadowBlur = 0;
    }
    
    // Track render time and FPS
    this.renderTime = performance.now() - renderStart;
    this.frameCount++;
    
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
    
    ctx.font = '10px "Fira Code", monospace';
    const totalAgents = this.colonies.reduce((sum, c) => sum + c.agents.length, 0);
    
    // Left side (performance) - only when 'I' pressed
    if (this.showPerformance) {
      const trailMemMB = (this.colonies.length * this.trailWidth * this.trailHeight * 4 * 2) / (1024 * 1024);
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, this.height - 70, 130, 65);
      
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText(`FPS: ${this.fps}`, 15, this.height - 55);
      ctx.fillText(`UPDATE: ${this.updateTime.toFixed(1)}ms`, 15, this.height - 40);
      ctx.fillText(`RENDER: ${this.renderTime.toFixed(1)}ms`, 15, this.height - 25);
      ctx.fillText(`TRAIL MEM: ${trailMemMB.toFixed(1)}MB`, 15, this.height - 10);
    }
    
    // Right side (game stats) - ALWAYS visible
    // Find winning colony
    let winningColony = this.colonies[0];
    for (const c of this.colonies) {
      if (c.agents.length > winningColony.agents.length) {
        winningColony = c;
      }
    }
    
    // Right side background
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(this.width - 230, this.height - 45, 220, 40);
    
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${this.colonies.length} COLONIES · ${totalAgents} AGENTS · ${this.food.length} FOOD`, this.width - 15, this.height - 30);
    
    // Winning colony indicator
    const winColor = `hsl(${winningColony.hue}, 100%, 60%)`;
    ctx.fillStyle = winColor;
    ctx.fillText(`LEADING: ${winningColony.agents.length} AGENTS`, this.width - 15, this.height - 15);
    
    // Chart overlay - button click only
    if (this.showDataOverlay) {
      this._drawDataOverlay(ctx);
    }
    
    // Render stats button on top
    if (this.statsButton) {
      this.statsButton.render();
    }
  }
  
  /**
   * Draw population chart overlay
   */
  _drawDataOverlay(ctx) {
    // Semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, this.width, this.height);
    
    const padding = 40;
    const chartWidth = this.width - padding * 2;
    const chartHeight = this.height - padding * 2 - 60;
    
    // Title
    ctx.font = '16px "Fira Code", monospace';
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("COLONY POPULATIONS", this.width / 2, padding);
    
    // Bar chart area
    const chartX = padding + 60;
    const chartY = padding + 50;
    const barHeight = 30;
    const barGap = 15;
    const maxBarWidth = chartWidth - 80;
    
    // Find max value for scaling (current leader + small margin)
    let maxVal = 0;
    for (const colony of this.colonies) {
      if (colony.agents.length > maxVal) maxVal = colony.agents.length;
    }
    maxVal = Math.ceil(maxVal * 1.05); // 5% headroom - scales smoothly on click bursts
    
    // Sort colonies by population (largest first)
    const sortedColonies = [...this.colonies].sort((a, b) => b.agents.length - a.agents.length);
    
    // Draw horizontal bars
    for (let i = 0; i < sortedColonies.length; i++) {
      const colony = sortedColonies[i];
      const hue = colony.hue;
      const count = colony.agents.length;
      const barWidth = (count / maxVal) * maxBarWidth;
      const by = chartY + i * (barHeight + barGap);
      
      // Bar background (track)
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(chartX, by, maxBarWidth, barHeight);
      
      // Colored bar
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fillRect(chartX, by, barWidth, barHeight);
      
      // Glow effect
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = 10;
      ctx.fillRect(chartX, by, barWidth, barHeight);
      ctx.shadowBlur = 0;
      
      // Colony rank/position indicator
      ctx.font = '12px "Fira Code", monospace';
      ctx.fillStyle = "#888";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`#${i + 1}`, chartX - 10, by + barHeight / 2);
      
      // Count label at end of bar
      ctx.font = '14px "Fira Code", monospace';
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText(count.toString(), chartX + barWidth + 10, by + barHeight / 2);
    }
    
    // Total at bottom
    const totalAgents = this.colonies.reduce((sum, c) => sum + c.agents.length, 0);
    ctx.font = '14px "Fira Code", monospace';
    ctx.fillStyle = "#888";
    ctx.textAlign = "center";
    const totalY = chartY + sortedColonies.length * (barHeight + barGap) + 20;
    ctx.fillText(`TOTAL: ${totalAgents} AGENTS`, this.width / 2, totalY);
    
  }
}

/**
 * Create Day 9 visualization
 * 
 * Factory function that creates and starts the Competing Mycelium demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {Day09Demo} returns.game - The game instance
 */
export default function day09(canvas) {
  const game = new Day09Demo(canvas);
  game.start();
  return { 
    stop: () => {
      if (game._keyHandler) {
        window.removeEventListener("keydown", game._keyHandler);
      }
      game.stop();
    }, 
    game 
  };
}
