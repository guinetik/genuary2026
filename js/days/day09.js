/**
 * Day 9: Crazy Automaton
 *
 * PHYSARUM SIMULATION
 * Slime mold agents explore and leave pheromone trails.
 * They sense nearby trails and steer toward them, creating
 * beautiful organic networks that self-organize.
 *
 * Click to place food sources that attract the slime.
 */
import { Game, Painter } from "@guinetik/gcanvas";

const CONFIG = {
  // Agent settings
  agentCount: 8000,
  moveSpeed: 1.0,
  turnSpeed: 0.4,
  randomSteer: 0.3,            // Random wobble amount
  
  // Sensor settings (how agents "smell" trails)
  sensorAngle: Math.PI / 6,    // 30 degrees - narrower for more defined paths
  sensorDistance: 12,
  sensorSize: 1,
  
  // Trail settings
  trailWeight: 8,              // How much trail agents deposit (increased)
  decayRate: 0.985,            // Trail fade per frame (slower decay = longer trails)
  diffuseRate: 1,              // How much trail spreads
  
  // Food settings
  foodRadius: 50,
  foodStrength: 500,           // Much more food to consume
  foodConsumeRate: 0.1,        // Depletion rate
  spawnPerFood: 2,             // Agents spawned when eating food
  maxAgents: 15000,            // Cap on total agents
  foodSenseRange: 300,         // How far agents can "smell" food
  foodAttraction: 2.0,         // How strongly agents turn toward food
  
  // Visual
  trailAlpha: 0.15,            // Motion blur
  glowPasses: 2,               // Bloom effect passes
  
  // Colors (HSL base hue)
  hue: 120,                    // Green for slime
  foodHue: 50,                 // Yellow/gold for food
  saturation: 100,
  lightness: 50,
};

/**
 * Single Physarum agent
 */
class Agent {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
  }
}

/**
 * Main Physarum simulation
 */
class Day09Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = null; // We handle our own clearing for trails
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    this.container = this.canvas.parentElement;
    if (this.container) {
      this.enableFluidSize(this.container);
    }

    // Trail map (stores pheromone concentrations)
    this.trailWidth = Math.floor(this.width);
    this.trailHeight = Math.floor(this.height);
    this.trailMap = new Float32Array(this.trailWidth * this.trailHeight);
    this.trailMapNext = new Float32Array(this.trailWidth * this.trailHeight);
    
    // Image data for rendering trails
    this.trailImageData = this.ctx.createImageData(this.trailWidth, this.trailHeight);

    // Initialize agents scattered randomly with random directions
    this.agents = [];
    const margin = 50;
    
    for (let i = 0; i < CONFIG.agentCount; i++) {
      // Spawn randomly across canvas
      const x = margin + Math.random() * (this.width - margin * 2);
      const y = margin + Math.random() * (this.height - margin * 2);
      // Random direction
      const facing = Math.random() * Math.PI * 2;
      this.agents.push(new Agent(x, y, facing));
    }

    // Food sources (attractors)
    this.foodSources = [];
    
    // Click to add food
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.width / rect.width);
      const y = (e.clientY - rect.top) * (this.height / rect.height);
      this.foodSources.push({ x, y, strength: CONFIG.foodStrength });
    });

    this.elapsedTime = 0;
  }

  /**
   * Sample the trail map at a position
   */
  sampleTrail(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.trailWidth || iy < 0 || iy >= this.trailHeight) {
      return 0;
    }
    return this.trailMap[iy * this.trailWidth + ix];
  }

  /**
   * Deposit trail at a position
   */
  depositTrail(x, y, amount) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.trailWidth || iy < 0 || iy >= this.trailHeight) {
      return;
    }
    const idx = iy * this.trailWidth + ix;
    this.trailMap[idx] = Math.min(255, this.trailMap[idx] + amount);
  }

  /**
   * Diffuse and decay the trail map
   */
  processTrailMap() {
    const w = this.trailWidth;
    const h = this.trailHeight;
    const decay = CONFIG.decayRate;
    const diffuse = CONFIG.diffuseRate;
    
    // 3x3 box blur + decay
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        
        // Sample 3x3 neighborhood
        let sum = 0;
        for (let dy = -diffuse; dy <= diffuse; dy++) {
          for (let dx = -diffuse; dx <= diffuse; dx++) {
            sum += this.trailMap[(y + dy) * w + (x + dx)];
          }
        }
        
        // Average and decay
        const kernelSize = (diffuse * 2 + 1) * (diffuse * 2 + 1);
        this.trailMapNext[idx] = (sum / kernelSize) * decay;
      }
    }
    
    // Swap buffers
    [this.trailMap, this.trailMapNext] = [this.trailMapNext, this.trailMap];
  }

  /**
   * Add food source attraction to trail map and handle consumption
   */
  processFoodSources() {
    const toRemove = [];
    
    for (let fi = 0; fi < this.foodSources.length; fi++) {
      const food = this.foodSources[fi];
      const fx = Math.floor(food.x);
      const fy = Math.floor(food.y);
      const radius = CONFIG.foodRadius;
      
      // Emit strong trails around food
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const ix = fx + dx;
            const iy = fy + dy;
            if (ix >= 0 && ix < this.trailWidth && iy >= 0 && iy < this.trailHeight) {
              const falloff = 1 - dist / radius;
              const idx = iy * this.trailWidth + ix;
              // Stronger emission based on remaining food strength
              this.trailMap[idx] = Math.min(255, this.trailMap[idx] + (food.strength / 50) * falloff * 2);
            }
          }
        }
      }
      
      // Check if agents are eating this food
      let eatingCount = 0;
      const eatRadius = radius * 1.2; // Larger eat radius
      
      for (const agent of this.agents) {
        const dx = agent.x - food.x;
        const dy = agent.y - food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < eatRadius) {
          eatingCount++;
        }
      }
      
      // Consume food and spawn new agents (GROWTH!)
      if (eatingCount > 0) {
        food.strength -= CONFIG.foodConsumeRate * eatingCount;
        
        // Spawn lots of new agents at food location - this is how slime grows!
        if (this.agents.length < CONFIG.maxAgents) {
          // Spawn rate scales with how many agents are eating
          const spawnCount = Math.min(eatingCount, 10); // Up to 10 new agents per frame
          for (let i = 0; i < spawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spawnDist = Math.random() * eatRadius * 0.5;
            this.agents.push(new Agent(
              food.x + Math.cos(angle) * spawnDist,
              food.y + Math.sin(angle) * spawnDist,
              angle // Radiate outward from food
            ));
          }
        }
        
        // Also deposit extra trail at food location (thicker network)
        for (let dy = -5; dy <= 5; dy++) {
          for (let dx = -5; dx <= 5; dx++) {
            const ix = Math.floor(food.x) + dx;
            const iy = Math.floor(food.y) + dy;
            if (ix >= 0 && ix < this.trailWidth && iy >= 0 && iy < this.trailHeight) {
              const idx = iy * this.trailWidth + ix;
              this.trailMap[idx] = Math.min(255, this.trailMap[idx] + eatingCount * 2);
            }
          }
        }
      }
      
      // Mark depleted food for removal
      if (food.strength <= 0) {
        toRemove.push(fi);
      }
    }
    
    // Remove depleted food (reverse order to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.foodSources.splice(toRemove[i], 1);
    }
  }

  update(dt) {
    super.update(dt);
    this.elapsedTime += dt;

    const w = this.trailWidth;
    const h = this.trailHeight;

    // Update each agent
    for (const agent of this.agents) {
      // First check if there's nearby food to seek
      let foodAngle = null;
      let closestFoodDist = CONFIG.foodSenseRange;
      
      for (const food of this.foodSources) {
        const dx = food.x - agent.x;
        const dy = food.y - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestFoodDist) {
          closestFoodDist = dist;
          foodAngle = Math.atan2(dy, dx);
        }
      }
      
      // If food is nearby, steer toward it
      if (foodAngle !== null) {
        // Calculate angle difference
        let angleDiff = foodAngle - agent.angle;
        // Normalize to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Turn toward food (stronger when closer)
        const proximity = 1 - closestFoodDist / CONFIG.foodSenseRange;
        const attraction = CONFIG.foodAttraction * proximity * proximity; // Quadratic - much stronger when close
        agent.angle += angleDiff * attraction * 0.2;
      }
      
      // Sense trail at 3 positions ahead
      const sensorDist = CONFIG.sensorDistance;
      const sensorAngle = CONFIG.sensorAngle;
      
      // Left sensor
      const leftX = agent.x + Math.cos(agent.angle - sensorAngle) * sensorDist;
      const leftY = agent.y + Math.sin(agent.angle - sensorAngle) * sensorDist;
      const leftSense = this.sampleTrail(leftX, leftY);
      
      // Center sensor
      const centerX = agent.x + Math.cos(agent.angle) * sensorDist;
      const centerY = agent.y + Math.sin(agent.angle) * sensorDist;
      const centerSense = this.sampleTrail(centerX, centerY);
      
      // Right sensor
      const rightX = agent.x + Math.cos(agent.angle + sensorAngle) * sensorDist;
      const rightY = agent.y + Math.sin(agent.angle + sensorAngle) * sensorDist;
      const rightSense = this.sampleTrail(rightX, rightY);
      
      // Decide which way to turn (trail following)
      const turnSpeed = CONFIG.turnSpeed;
      const randomSteer = (Math.random() - 0.5) * CONFIG.randomSteer;
      
      if (centerSense > leftSense && centerSense > rightSense) {
        // Go straight (with random wobble for exploration)
        agent.angle += randomSteer;
      } else if (centerSense < leftSense && centerSense < rightSense) {
        // Both sides stronger than center - pick randomly
        agent.angle += (Math.random() < 0.5 ? -1 : 1) * turnSpeed + randomSteer;
      } else if (leftSense > rightSense) {
        // Turn left
        agent.angle -= turnSpeed;
      } else if (rightSense > leftSense) {
        // Turn right
        agent.angle += turnSpeed;
      } else {
        // Equal - random exploration
        agent.angle += randomSteer * 2;
      }
      
      // Move forward
      const speed = CONFIG.moveSpeed;
      const newX = agent.x + Math.cos(agent.angle) * speed;
      const newY = agent.y + Math.sin(agent.angle) * speed;
      
      // Bounce off edges - turn around when hitting boundary
      if (newX < 1 || newX >= w - 1 || newY < 1 || newY >= h - 1) {
        // Pick a new random angle pointing inward
        agent.angle = Math.random() * Math.PI * 2;
        // Don't move this frame
      } else {
        agent.x = newX;
        agent.y = newY;
        // Deposit trail only when moving
        this.depositTrail(agent.x, agent.y, CONFIG.trailWeight);
      }
    }

    // Process trail map (diffuse and decay)
    this.processTrailMap();
    
    // Add food source attraction
    this.processFoodSources();
  }

  render() {
    const ctx = this.ctx;
    const w = this.trailWidth;
    const h = this.trailHeight;

    // Convert trail map to image data
    const data = this.trailImageData.data;
    const hue = CONFIG.hue;
    const sat = CONFIG.saturation;
    
    for (let i = 0; i < this.trailMap.length; i++) {
      const value = this.trailMap[i];
      const idx = i * 4;
      
      if (value > 0.5) {
        // Convert trail intensity to color
        const brightness = Math.min(1, value / 100);
        const lightness = 20 + brightness * 60;
        
        // HSL to RGB (simplified for green)
        const l = lightness / 100;
        const s = sat / 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        const m = l - c / 2;
        
        let r, g, b;
        if (hue < 60) { r = c; g = x; b = 0; }
        else if (hue < 120) { r = x; g = c; b = 0; }
        else if (hue < 180) { r = 0; g = c; b = x; }
        else if (hue < 240) { r = 0; g = x; b = c; }
        else if (hue < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        
        data[idx] = Math.floor((r + m) * 255);
        data[idx + 1] = Math.floor((g + m) * 255);
        data[idx + 2] = Math.floor((b + m) * 255);
        data[idx + 3] = Math.min(255, value * 3);
      } else {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }
    }
    
    // Draw trail map
    ctx.putImageData(this.trailImageData, 0, 0);
    
    // Add glow effect (simple additive blend)
    ctx.globalCompositeOperation = "lighter";
    ctx.filter = "blur(2px)";
    ctx.globalAlpha = 0.3;
    ctx.drawImage(this.canvas, 0, 0);
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    
    // Draw food sources as pulsing circles (size based on remaining strength)
    for (const food of this.foodSources) {
      const strengthRatio = food.strength / CONFIG.foodStrength;
      const pulse = 0.8 + Math.sin(this.elapsedTime * 5) * 0.2;
      const baseRadius = CONFIG.foodRadius * strengthRatio;
      const radius = baseRadius * pulse * 0.6;
      const foodHue = CONFIG.foodHue;
      
      // Outer glow
      const gradient = ctx.createRadialGradient(food.x, food.y, 0, food.x, food.y, radius * 2);
      gradient.addColorStop(0, `hsla(${foodHue}, 100%, 70%, ${0.6 * strengthRatio})`);
      gradient.addColorStop(0.5, `hsla(${foodHue}, 100%, 50%, ${0.3 * strengthRatio})`);
      gradient.addColorStop(1, "transparent");
      
      ctx.beginPath();
      ctx.arc(food.x, food.y, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Core
      ctx.beginPath();
      ctx.arc(food.x, food.y, radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${foodHue}, 100%, 80%, ${0.9 * strengthRatio})`;
      ctx.fill();
    }
    
    // Minimal HUD
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = "rgba(0, 255, 128, 0.5)";
    ctx.textAlign = "right";
    ctx.fillText("CLICK TO FEED", this.width - 15, this.height - 15);
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
