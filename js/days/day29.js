/**
 * Day 29: Genetic Evolution and Mutation
 *
 * COVID-inspired SEIR epidemic simulation with viral evolution.
 * Procedurally generated dungeon with rooms connected by doors.
 * Agents walk around, spread disease. Virus mutates creating variants.
 * Hospital provides vaccination and treatment.
 *
 * Features:
 * - 100 agents, some starting vaccinated
 * - Virus mutates when blocked by vaccine, creating new variants
 * - Greek letter naming for variants (Alpha, Beta, Delta, Omicron...)
 * - Each variant has different transmissibility and vaccine resistance
 */
import { Game, Painter, ToggleButton, Tweenetik, Easing } from "@guinetik/gcanvas";

// Firefox detection - shadowBlur is extremely slow
const IS_FIREFOX = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');

/**
 * Greek letter names for variants (COVID-style naming)
 */
const VARIANT_NAMES = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta",
  "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho",
  "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega"
];

/**
 * Variant colors - neon palette for stylized look
 */
const VARIANT_COLORS = [
  "#ff2060",  // Alpha - hot pink (original)
  "#ff6020",  // Beta - orange
  "#ffaa00",  // Gamma - gold
  "#ff00ff",  // Delta - magenta
  "#ff0080",  // Epsilon - pink
  "#aa00ff",  // Zeta - purple
  "#6020ff",  // Eta - indigo
  "#00aaff",  // Theta - cyan
  "#00ffaa",  // Iota - teal
  "#80ff00",  // Kappa - lime
];

const CONFIG = {
  // Dungeon generation (symmetric layout)
  gridWidth: 60,
  gridHeight: 40,

  // Agent settings
  agentCount: 100,
  initialVaccinatedPercent: 0.25,          // 25% start vaccinated
  moveDelay: 4, // frames between moves (higher = slower)
  wanderSteps: { min: 10, max: 20 }, // time spent in room before leaving

  // Disease settings (SEIR model)
  incubationTime: { min: 50, max: 100 },   // E -> I (yellow -> red)
  infectionTime: { min: 100, max: 200 },   // how long I (red) lasts
  recoveryChance: 0.3,                      // chance to recover naturally (without hospital)
  deathChance: 0.1,                         // chance to die if not treated

  // Transmission settings
  transmissionRate: 0.15,                   // base probability per contact per tick
  roomTransmissionBonus: 2.0,              // multiplier when both agents in same room
  vaccineEfficacy: 0.8,                    // 80% reduction in susceptibility for vaccinated

  // Mutation settings
  mutationChanceOnVaccinated: 0.005,       // 0.5% chance to mutate when blocked by vaccine
  mutationTransmissionBoost: 1.2,          // each mutation increases transmissibility by 20%
  mutationVaccineResistanceBoost: 0.15,    // each mutation reduces vaccine efficacy by 15%
  maxVariants: 10,                         // cap on total number of variants

  // Spawning settings (click to infect/spawn)
  newAgentInterval: 60.0,                  // seconds between new agent waves
  newAgentCount: 10,                       // agents per wave

  // Colors
  colors: {
    empty: "#050508",
    floor: "#0a0a10",
    door: "#0a0a10",
    wall: "#353545",        // lighter gray for room walls
    hospitalWall: "#40e0e0", // cyan - matches vaccine theme
    agent: "#00ff80",       // healthy/susceptible - bright green
    vaccinated: "#00ffff",  // cyan - vaccinated (protected)
    exposed: "#ffcc00",     // gold - incubating
    infected: "#ff2060",    // hot pink/red - sick/contagious
    recovered: "#4080ff",   // blue - recovered (immune)
  },
  
  // Visual style
  glowIntensity: 0.8,
  trailAlpha: 0.12,
  pulseSpeed: 3.0,
  agentGlow: true,
  
  // Variant flash settings
  variantFlashDuration: 2.5,               // seconds to show variant name
  variantFlashFadeStart: 1.5,              // start fading after this many seconds
  
  // History tracking for charts
  historyInterval: 0.5,                    // record data every 0.5 seconds
  maxHistoryPoints: 200,                   // keep last 200 data points
};

// Dungeon generator - symmetric layout with hospital center and 4 rooms around
function createDungeon(gridWidth, gridHeight) {
  const rooms = [];
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // 1. Create grid - all floor except border walls
  let grid = [];
  for (let y = 0; y < gridHeight; y++) {
    grid.push([]);
    for (let x = 0; x < gridWidth; x++) {
      if (x === 0 || x === gridWidth - 1 || y === 0 || y === gridHeight - 1) {
        grid[y].push({ type: "wall" });
      } else {
        grid[y].push({ type: "floor" });
      }
    }
  }

  // Helper: place a room with walls and a door on specified side
  const placeRoom = (x, y, width, height, doorSide) => {
    // Place walls around the room perimeter
    for (let ry = y - 1; ry <= y + height; ry++) {
      for (let rx = x - 1; rx <= x + width; rx++) {
        const isTop = ry === y - 1;
        const isBottom = ry === y + height;
        const isLeft = rx === x - 1;
        const isRight = rx === x + width;

        if (isTop || isBottom || isLeft || isRight) {
          grid[ry][rx] = { type: "room_wall" };
        } else {
          grid[ry][rx] = { type: "room_floor" };
        }
      }
    }

    // Place door on specified side (centered)
    let doorX, doorY;
    const centerX = x + Math.floor(width / 2);
    const centerY = y + Math.floor(height / 2);

    switch (doorSide) {
      case "top":
        doorX = centerX;
        doorY = y - 1;
        break;
      case "bottom":
        doorX = centerX;
        doorY = y + height;
        break;
      case "left":
        doorX = x - 1;
        doorY = centerY;
        break;
      case "right":
        doorX = x + width;
        doorY = centerY;
        break;
    }

    grid[doorY][doorX] = { type: "door" };

    return { x, y, width, height, doorX, doorY };
  };

  // 2. Calculate center position for hospital
  const hospitalSize = 8;
  const hospitalX = Math.floor(gridWidth / 2) - Math.floor(hospitalSize / 2);
  const hospitalY = Math.floor(gridHeight / 2) - Math.floor(hospitalSize / 2);
  
  // Place hospital (will be converted to hospital_wall later)
  const hospital = placeRoom(hospitalX, hospitalY, hospitalSize, hospitalSize, "top");
  hospital.isHospital = true;
  rooms.push(hospital);
  
  // 3. Place rooms in a 3x3 grid layout
  //    [TL]  [Top]   [TR]
  //    [L]   [HOSP]  [R]
  //    [BL]  [Bot]   [BR]
  
  const spacing = 5; // Space between hospital and top/bottom rooms
  const cornerMargin = 4; // Distance from border walls
  
  // === Middle column: Top and Bottom rooms (above/below hospital) ===
  
  // Top room - door faces down (toward hospital)
  const topRoomW = random(5, 7);
  const topRoomH = random(3, 5);
  const topRoomX = Math.floor(gridWidth / 2) - Math.floor(topRoomW / 2);
  const topRoomY = hospitalY - spacing - topRoomH;
  if (topRoomY > 2) {
    rooms.push(placeRoom(topRoomX, topRoomY, topRoomW, topRoomH, "bottom"));
  }
  
  // Bottom room - door faces up (toward hospital)
  const bottomRoomW = random(5, 7);
  const bottomRoomH = random(3, 5);
  const bottomRoomX = Math.floor(gridWidth / 2) - Math.floor(bottomRoomW / 2);
  const bottomRoomY = hospitalY + hospitalSize + spacing;
  if (bottomRoomY + bottomRoomH < gridHeight - 2) {
    rooms.push(placeRoom(bottomRoomX, bottomRoomY, bottomRoomW, bottomRoomH, "top"));
  }
  
  // === Left column: 3 rooms aligned vertically ===
  const leftColX = cornerMargin; // Same X as corner rooms
  
  // Top-left corner room
  const tlRoomW = random(4, 6);
  const tlRoomH = random(4, 5);
  rooms.push(placeRoom(leftColX, cornerMargin, tlRoomW, tlRoomH, "right"));
  
  // Middle-left room (aligned with hospital row)
  const mlRoomW = random(4, 6);
  const mlRoomH = random(5, 7);
  const mlRoomY = Math.floor(gridHeight / 2) - Math.floor(mlRoomH / 2);
  rooms.push(placeRoom(leftColX, mlRoomY, mlRoomW, mlRoomH, "right"));
  
  // Bottom-left corner room
  const blRoomW = random(4, 6);
  const blRoomH = random(4, 5);
  rooms.push(placeRoom(leftColX, gridHeight - cornerMargin - blRoomH - 1, blRoomW, blRoomH, "right"));
  
  // === Right column: 3 rooms aligned vertically ===
  
  // Top-right corner room
  const trRoomW = random(4, 6);
  const trRoomH = random(4, 5);
  rooms.push(placeRoom(gridWidth - cornerMargin - trRoomW - 1, cornerMargin, trRoomW, trRoomH, "left"));
  
  // Middle-right room (aligned with hospital row)
  const mrRoomW = random(4, 6);
  const mrRoomH = random(5, 7);
  const mrRoomY = Math.floor(gridHeight / 2) - Math.floor(mrRoomH / 2);
  rooms.push(placeRoom(gridWidth - cornerMargin - mrRoomW - 1, mrRoomY, mrRoomW, mrRoomH, "left"));
  
  // Bottom-right corner room
  const brRoomW = random(4, 6);
  const brRoomH = random(4, 5);
  rooms.push(placeRoom(gridWidth - cornerMargin - brRoomW - 1, gridHeight - cornerMargin - brRoomH - 1, brRoomW, brRoomH, "left"));

  return { grid, rooms };
}

// Convert hospital room to white walls with doors on all 4 sides
function setupHospital(grid, rooms) {
  // Find the hospital room (already marked isHospital in createDungeon)
  const hospital = rooms.find(r => r.isHospital);
  if (!hospital) return null;

  // Change its walls to hospital walls
  for (let ry = hospital.y - 1; ry <= hospital.y + hospital.height; ry++) {
    for (let rx = hospital.x - 1; rx <= hospital.x + hospital.width; rx++) {
      if (grid[ry] && grid[ry][rx]) {
        if (grid[ry][rx].type === "room_wall" || grid[ry][rx].type === "door") {
          grid[ry][rx].type = "hospital_wall";
        }
      }
    }
  }
  
  // Add doors on all 4 sides (centered on each wall)
  const centerX = hospital.x + Math.floor(hospital.width / 2);
  const centerY = hospital.y + Math.floor(hospital.height / 2);
  
  // Top door
  grid[hospital.y - 1][centerX].type = "door";
  // Bottom door
  grid[hospital.y + hospital.height][centerX].type = "door";
  // Left door
  grid[centerY][hospital.x - 1].type = "door";
  // Right door
  grid[centerY][hospital.x + hospital.width].type = "door";
  
  // Store door positions for reference
  hospital.doors = [
    { x: centerX, y: hospital.y - 1 },           // top
    { x: centerX, y: hospital.y + hospital.height }, // bottom
    { x: hospital.x - 1, y: centerY },           // left
    { x: hospital.x + hospital.width, y: centerY }  // right
  ];

  return hospital;
}

/**
 * Represents a viral variant with mutation properties
 */
class Variant {
  /**
   * @param {number} index - Index in VARIANT_NAMES array
   * @param {Variant|null} parent - Parent variant this mutated from
   */
  constructor(index, parent = null) {
    this.index = index;
    this.name = VARIANT_NAMES[index] || `Variant-${index}`;
    this.parent = parent;
    this.generation = parent ? parent.generation + 1 : 0;
    
    // Calculate cumulative bonuses from mutation chain
    if (parent) {
      this.transmissionMultiplier = parent.transmissionMultiplier * CONFIG.mutationTransmissionBoost;
      this.vaccineResistance = Math.min(0.95, parent.vaccineResistance + CONFIG.mutationVaccineResistanceBoost);
    } else {
      this.transmissionMultiplier = 1.0;
      this.vaccineResistance = 0; // Original strain has no vaccine resistance
    }
    
    // Color for this variant
    this.color = VARIANT_COLORS[index % VARIANT_COLORS.length];
    
    // Track infection count
    this.infectionCount = 0;
    
    // For emergence flash effect
    this.emergeTime = 0;        // Set when variant is created
    this.emergeX = 0;           // Grid position where it emerged
    this.emergeY = 0;
  }
}

class Agent {
  constructor(x, y, grid, rooms, hospital) {
    this.x = x;
    this.y = y;
    this.grid = grid;
    this.rooms = rooms;
    this.hospital = hospital;
    this.gridHeight = grid.length;
    this.gridWidth = grid[0].length;

    // State machine
    // roaming -> goingToDoor -> enteringRoom -> inRoom -> exitingRoom -> roaming
    this.state = "roaming";
    this.targetRoom = null;
    this.targetX = x;
    this.targetY = y;
    this.roamTargetX = x;
    this.roamTargetY = y;
    this.stepsRemaining = 0;
    this.waitFrames = 0;
    this.stuckCounter = 0;
    this.moveTimer = Math.floor(Math.random() * CONFIG.moveDelay);

    // Health state: "susceptible", "vaccinated", "exposed", "infected", "recovered", "dead"
    this.healthState = "susceptible";
    this.diseaseTimer = 0;
    
    // Variant tracking - which strain infected this agent
    this.variant = null;
    
    // Death flash animation (1 = white flash, 0 = normal gray)
    this.deathFlash = 0;

    // Track last room to avoid re-entering immediately
    this.lastRoom = null;
    this.roamTimeRemaining = 0; // Must roam for a bit before picking new room

    // Movement momentum - keep walking same direction
    this.dirX = 0;
    this.dirY = 0;
    this.dirSteps = 0; // How many steps to keep this direction

    // Stuck detection
    this.posHistory = [];
    this.globalStuckCounter = 0;
  }

  update() {
    // Movement delay
    this.moveTimer++;
    if (this.moveTimer < CONFIG.moveDelay) {
      return;
    }
    this.moveTimer = 0;

    // Handle waiting
    if (this.waitFrames > 0) {
      this.waitFrames--;
      return;
    }

    // Track position for stuck detection
    this.posHistory.push({ x: this.x, y: this.y });
    if (this.posHistory.length > 20) {
      this.posHistory.shift();
    }

    // Check if oscillating/stuck (stayed in small area)
    if (this.posHistory.length >= 20) {
      const minX = Math.min(...this.posHistory.map(p => p.x));
      const maxX = Math.max(...this.posHistory.map(p => p.x));
      const minY = Math.min(...this.posHistory.map(p => p.y));
      const maxY = Math.max(...this.posHistory.map(p => p.y));
      const range = (maxX - minX) + (maxY - minY);

      // If movement range is tiny, we're stuck
      if (range <= 4) {
        this.globalStuckCounter++;
        if (this.globalStuckCounter > 5) {
          this.teleportToRandomFloor();
          return;
        }
      } else {
        this.globalStuckCounter = 0;
      }
    }

    // Update disease progression
    this.updateDisease();

    // Dead agents don't move
    if (this.healthState === "dead") {
      return;
    }

    switch (this.state) {
      case "roaming":
        this.roam();
        break;
      case "goingToDoor":
        this.goToDoor();
        break;
      case "enteringRoom":
        this.enterRoom();
        break;
      case "inRoom":
        this.wanderInRoom();
        break;
      case "exitingRoom":
        this.exitRoom();
        break;
    }
  }

  updateDisease() {
    // Disease state progression
    if (this.healthState === "exposed") {
      this.diseaseTimer--;
      if (this.diseaseTimer <= 0) {
        // Incubation over -> become infectious (red)
        this.healthState = "infected";
        this.diseaseTimer = CONFIG.infectionTime.min +
          Math.floor(Math.random() * (CONFIG.infectionTime.max - CONFIG.infectionTime.min));
      }
    } else if (this.healthState === "infected") {
      this.diseaseTimer--;
      if (this.diseaseTimer <= 0) {
        // Infection period over -> recover or die
        if (Math.random() < CONFIG.deathChance) {
          this.healthState = "dead";
          this.deathFlash = 1; // Start white, will tween to 0
          this.justDied = true; // Flag for game to start tween
        } else if (Math.random() < CONFIG.recoveryChance) {
          this.healthState = "recovered";
        } else {
          // Still sick, reset timer (prolonged illness)
          this.diseaseTimer = CONFIG.infectionTime.min +
            Math.floor(Math.random() * (CONFIG.infectionTime.max - CONFIG.infectionTime.min));
        }
      }
    }
  }

  teleportToRandomFloor() {
    // Find a random floor cell and teleport there
    for (let attempts = 0; attempts < 50; attempts++) {
      const rx = Math.floor(Math.random() * this.gridWidth);
      const ry = Math.floor(Math.random() * this.gridHeight);
      const cell = this.grid[ry][rx];
      if (cell.type === "floor") {
        this.x = rx;
        this.y = ry;
        this.state = "roaming";
        this.targetRoom = null;
        this.lastRoom = null;
        this.roamTimeRemaining = 10;
        this.posHistory = [];
        this.globalStuckCounter = 0;
        this.stuckCounter = 0;
        this.dirSteps = 0;
        return;
      }
    }
  }

  roam() {
    // Decrement roam time
    if (this.roamTimeRemaining > 0) {
      this.roamTimeRemaining--;
    }

    // Simple random walk - just pick a random valid direction
    this.randomWalk();

    // Randomly stop for a bit
    if (Math.random() < 0.05) {
      this.waitFrames = Math.floor(Math.random() * 3) + 1;
    }

    // Chance to pick a room to visit (only after roaming for a bit)
    if (this.roamTimeRemaining <= 0 && Math.random() < 0.03 && this.rooms.length > 0) {
      // Pick a room that's not the one we just left
      const availableRooms = this.rooms.filter(r => r !== this.lastRoom);
      if (availableRooms.length > 0) {
        this.targetRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
        this.stuckCounter = 0;
        this.state = "goingToDoor";
      }
    }
  }

  randomWalk() {
    // Walk with momentum - keep going same direction for a while

    // If we have steps remaining in current direction, try to continue
    if (this.dirSteps > 0) {
      const nx = this.x + this.dirX;
      const ny = this.y + this.dirY;
      if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
        const cell = this.grid[ny][nx];
        if (cell.type === "floor" || cell.type === "door") {
          this.x = nx;
          this.y = ny;
          this.dirSteps--;
          return;
        }
      }
      // Couldn't continue - pick new direction
      this.dirSteps = 0;
    }

    // Pick a new direction - prefer walking along walls/borders
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    // Score each direction - prefer paths near walls (wall-hugging behavior)
    const scoredDirs = dirs.map(dir => {
      const nx = this.x + dir.dx;
      const ny = this.y + dir.dy;
      let score = Math.random() * 2; // Base randomness
      
      if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
        const cell = this.grid[ny][nx];
        if (cell.type === "floor" || cell.type === "door") {
          // Check if there's a wall nearby (prefer walking along walls)
          for (let checkY = ny - 1; checkY <= ny + 1; checkY++) {
            for (let checkX = nx - 1; checkX <= nx + 1; checkX++) {
              if (checkX >= 0 && checkX < this.gridWidth && checkY >= 0 && checkY < this.gridHeight) {
                const checkCell = this.grid[checkY][checkX];
                if (checkCell.type === "wall" || checkCell.type === "room_wall" || checkCell.type === "hospital_wall") {
                  score += 1.5; // Prefer being near walls
                }
              }
            }
          }
          // Prefer walking toward borders
          const borderDist = Math.min(nx, ny, this.gridWidth - nx, this.gridHeight - ny);
          if (borderDist < 8) score += 2;
          
          return { dir, score, valid: true };
        }
      }
      return { dir, score: -1, valid: false };
    });
    
    // Sort by score (highest first) and pick the best valid direction
    scoredDirs.sort((a, b) => b.score - a.score);
    
    for (const { dir, valid } of scoredDirs) {
      if (!valid) continue;
      const nx = this.x + dir.dx;
      const ny = this.y + dir.dy;
      this.x = nx;
      this.y = ny;
      // Set momentum - walk this direction for longer stretches
      this.dirX = dir.dx;
      this.dirY = dir.dy;
      this.dirSteps = 8 + Math.floor(Math.random() * 15);
      return;
    }
  }

  goToDoor() {
    if (!this.targetRoom) {
      this.state = "roaming";
      return;
    }

    // Find closest door (hospital has 4 doors, regular rooms have 1)
    let doorX, doorY;
    if (this.targetRoom.doors && this.targetRoom.doors.length > 0) {
      // Find closest door
      let minDist = Infinity;
      for (const door of this.targetRoom.doors) {
        const d = Math.abs(door.x - this.x) + Math.abs(door.y - this.y);
        if (d < minDist) {
          minDist = d;
          doorX = door.x;
          doorY = door.y;
        }
      }
    } else {
      doorX = this.targetRoom.doorX;
      doorY = this.targetRoom.doorY;
    }
    
    const dist = Math.abs(doorX - this.x) + Math.abs(doorY - this.y);

    // Reached the door
    if (dist <= 1) {
      this.x = doorX;
      this.y = doorY;
      this.state = "enteringRoom";
      // Pick a spot inside the room
      this.targetX = this.targetRoom.x + Math.floor(Math.random() * this.targetRoom.width);
      this.targetY = this.targetRoom.y + Math.floor(Math.random() * this.targetRoom.height);
      this.stuckCounter = 0;
      return;
    }

    // Give up if stuck too long
    if (this.stuckCounter > 20) {
      this.state = "roaming";
      this.targetRoom = null;
      this.stuckCounter = 0;
      this.roamTimeRemaining = 10;
      return;
    }

    this.smartMove(doorX, doorY);
  }

  enterRoom() {
    if (!this.targetRoom) {
      this.state = "roaming";
      return;
    }

    // Check hospital immediately upon entering
    this.checkHospital();

    const dist = Math.abs(this.targetX - this.x) + Math.abs(this.targetY - this.y);

    if (dist === 0) {
      this.state = "inRoom";
      this.stepsRemaining =
        CONFIG.wanderSteps.min +
        Math.floor(Math.random() * (CONFIG.wanderSteps.max - CONFIG.wanderSteps.min));
      return;
    }

    // If stuck, just start wandering where we are
    if (this.stuckCounter > 10) {
      this.state = "inRoom";
      this.stepsRemaining =
        CONFIG.wanderSteps.min +
        Math.floor(Math.random() * (CONFIG.wanderSteps.max - CONFIG.wanderSteps.min));
      this.stuckCounter = 0;
      return;
    }

    this.smartMove(this.targetX, this.targetY);
  }

  checkHospital() {
    // Check if currently in the hospital room
    if (this.targetRoom && this.targetRoom.isHospital) {
      // Infected -> recovered (hospital cures them)
      if (this.healthState === "infected") {
        this.healthState = "recovered";
        return true;
      }
      // Susceptible -> vaccinated
      else if (this.healthState === "susceptible") {
        this.healthState = "vaccinated";
        return true;
      }
    }
    return false;
  }

  wanderInRoom() {
    this.stepsRemaining--;

    // Check hospital every step
    this.checkHospital();

    if (this.stepsRemaining <= 0) {
      this.state = "exitingRoom";
      this.stuckCounter = 0;
      return;
    }

    // Randomly stop and linger
    if (Math.random() < 0.1) {
      this.waitFrames = Math.floor(Math.random() * 3) + 1;
      return;
    }

    // Random movement within room (but stay inside)
    const room = this.targetRoom;
    if (!room) {
      this.state = "roaming";
      return;
    }

    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 0 },
    ];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = this.x + dir.dx;
    const ny = this.y + dir.dy;

    if (
      this.canMove(nx, ny) &&
      nx >= room.x && nx < room.x + room.width &&
      ny >= room.y && ny < room.y + room.height
    ) {
      this.x = nx;
      this.y = ny;
    }
  }

  exitRoom() {
    const room = this.targetRoom;
    if (!room) {
      this.state = "roaming";
      // random walk handles movement
      return;
    }

    // Find closest door (hospital has 4 doors, regular rooms have 1)
    let doorX, doorY;
    if (room.doors && room.doors.length > 0) {
      // Find closest door
      let minDist = Infinity;
      for (const door of room.doors) {
        const d = Math.abs(door.x - this.x) + Math.abs(door.y - this.y);
        if (d < minDist) {
          minDist = d;
          doorX = door.x;
          doorY = door.y;
        }
      }
    } else {
      doorX = room.doorX;
      doorY = room.doorY;
    }
    
    const dist = Math.abs(doorX - this.x) + Math.abs(doorY - this.y);

    // At or adjacent to door - step through it and out
    if (dist <= 1) {
      // Move to door first
      this.x = doorX;
      this.y = doorY;

      // Now find floor cell outside the room
      const dirs = [
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }, // left
        { dx: 1, dy: 0 },  // right
      ];

      for (const dir of dirs) {
        const nx = doorX + dir.dx;
        const ny = doorY + dir.dy;
        if (this.canMove(nx, ny)) {
          // Check if outside room bounds (including walls)
          const outsideX = nx < room.x - 1 || nx > room.x + room.width;
          const outsideY = ny < room.y - 1 || ny > room.y + room.height;
          if (outsideX || outsideY) {
            this.x = nx;
            this.y = ny;
            break;
          }
        }
      }

      // Done exiting
      this.lastRoom = room;
      this.targetRoom = null;
      this.roamTimeRemaining = 15 + Math.floor(Math.random() * 20);
      this.state = "roaming";
      // random walk handles movement
      return;
    }

    // Walk toward door - simple direct movement
    const dx = doorX - this.x;
    const dy = doorY - this.y;

    // Try to move in the direction of the door
    let moved = false;

    // Prioritize the axis with more distance
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
      const nx = this.x + (dx > 0 ? 1 : -1);
      if (this.canMove(nx, this.y)) {
        this.x = nx;
        moved = true;
      }
    }

    if (!moved && dy !== 0) {
      const ny = this.y + (dy > 0 ? 1 : -1);
      if (this.canMove(this.x, ny)) {
        this.y = ny;
        moved = true;
      }
    }

    if (!moved && dx !== 0) {
      const nx = this.x + (dx > 0 ? 1 : -1);
      if (this.canMove(nx, this.y)) {
        this.x = nx;
        moved = true;
      }
    }

    if (!moved) {
      this.stuckCounter++;
    } else {
      this.stuckCounter = 0;
    }

    // If really stuck, teleport outside the room
    if (this.stuckCounter > 10) {
      // Find a floor cell outside the room near the door
      const dirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];
      for (const dir of dirs) {
        const nx = doorX + dir.dx;
        const ny = doorY + dir.dy;
        if (this.canMove(nx, ny)) {
          const outsideX = nx < room.x - 1 || nx > room.x + room.width;
          const outsideY = ny < room.y - 1 || ny > room.y + room.height;
          if (outsideX || outsideY) {
            this.x = nx;
            this.y = ny;
            this.lastRoom = room;
            this.targetRoom = null;
            this.roamTimeRemaining = 15 + Math.floor(Math.random() * 20);
            this.state = "roaming";
            // random walk handles movement
            this.stuckCounter = 0;
            return;
          }
        }
      }
      // Fallback - just go to door
      this.x = doorX;
      this.y = doorY;
      this.stuckCounter = 0;
    }
  }

  smartMove(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const prevX = this.x;
    const prevY = this.y;

    // Try direct movement first
    let moved = false;

    // All 4 directions, prioritized by alignment with target
    const dirs = [];
    if (dx > 0) dirs.push({ dx: 1, dy: 0, priority: Math.abs(dx) });
    if (dx < 0) dirs.push({ dx: -1, dy: 0, priority: Math.abs(dx) });
    if (dy > 0) dirs.push({ dx: 0, dy: 1, priority: Math.abs(dy) });
    if (dy < 0) dirs.push({ dx: 0, dy: -1, priority: Math.abs(dy) });

    // Sort by priority (higher = try first)
    dirs.sort((a, b) => b.priority - a.priority);

    // Try each direction
    for (const dir of dirs) {
      const nx = this.x + dir.dx;
      const ny = this.y + dir.dy;
      if (this.canMove(nx, ny)) {
        this.x = nx;
        this.y = ny;
        moved = true;
        break;
      }
    }

    // If couldn't move toward target, try wall-following (go perpendicular)
    if (!moved) {
      const perpDirs = [];
      if (dx !== 0) {
        perpDirs.push({ dx: 0, dy: 1 });
        perpDirs.push({ dx: 0, dy: -1 });
      }
      if (dy !== 0) {
        perpDirs.push({ dx: 1, dy: 0 });
        perpDirs.push({ dx: -1, dy: 0 });
      }

      // Shuffle perpendicular directions
      for (let i = perpDirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [perpDirs[i], perpDirs[j]] = [perpDirs[j], perpDirs[i]];
      }

      for (const dir of perpDirs) {
        const nx = this.x + dir.dx;
        const ny = this.y + dir.dy;
        if (this.canMove(nx, ny)) {
          this.x = nx;
          this.y = ny;
          moved = true;
          break;
        }
      }
    }

    // Track if stuck
    if (this.x === prevX && this.y === prevY) {
      this.stuckCounter++;
    } else {
      this.stuckCounter = 0;
    }
  }

  canMove(x, y) {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return false;
    const cell = this.grid[y][x];
    // Can walk on floor, room_floor, or door - not walls
    return cell.type === "floor" || cell.type === "room_floor" || cell.type === "door";
  }
}

class Day29Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = null; // Disabled - using motion blur trail instead
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Generate dungeon
    const { grid, rooms } = createDungeon(
      CONFIG.gridWidth,
      CONFIG.gridHeight
    );
    this.grid = grid;
    this.rooms = rooms;
    this.gridHeight = grid.length;
    this.gridWidth = grid[0].length;

    // Designate one room as hospital
    this.hospital = setupHospital(this.grid, this.rooms);

    // Calculate cell size to fill canvas
    this.calculateGrid();

    // Spawn agents in random walkable cells
    this.agents = [];
    const floorCells = [];
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const type = this.grid[y][x].type;
        if (type === "floor" || type === "room_floor" || type === "door") {
          floorCells.push({ x, y });
        }
      }
    }

    // Cache floor cells for spawning
    this.floorCells = floorCells;

    // Initialize variant tracking
    this.variants = [];
    this.nextVariantIndex = 0;

    for (let i = 0; i < Math.min(CONFIG.agentCount, floorCells.length); i++) {
      const idx = Math.floor(Math.random() * floorCells.length);
      const cell = floorCells[idx];
      const agent = new Agent(cell.x, cell.y, this.grid, this.rooms, this.hospital);
      
      // Some agents start vaccinated
      if (Math.random() < CONFIG.initialVaccinatedPercent) {
        agent.healthState = "vaccinated";
      }
      
      this.agents.push(agent);
    }

    // Timers for spawning
    this.elapsedTime = 0;
    this.lastWaveTime = 0;
    
    // Track if we have any infection started (for variant creation)
    this.infectionStarted = false;
    
    // Data overlay state
    this.showDataOverlay = false;
    
    // History tracking for charts
    this.history = [];
    this.lastHistoryTime = 0;
    
    // Dominant variant tracking (for visual intensity)
    this.dominantVariant = null;
    
    // Create data toggle button using gcanvas UI
    this.dataButton = new ToggleButton(this, {
      text: "[i]",
      width: 36,
      height: 36,
      font: '14px "Fira Code", monospace',
      startToggled: false,
      onToggle: (isOn) => {
        this.showDataOverlay = isOn;
      }
    });
    // Add to pipeline for input events, but we'll render it manually after motion blur
    this.pipeline.add(this.dataButton);

    // Handle resize
    this.container = this.canvas.parentElement;
    if (this.container) {
      this.enableFluidSize(this.container);
    }
    
    // Click handling: click agent to infect, click floor to spawn new agent
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleClick(e.changedTouches[0]);
    });
  }
  
  /**
   * Handle click/tap - infect agent or spawn new agent
   * @param {MouseEvent|Touch} e - Click or touch event
   */
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // If data overlay is showing, click anywhere (except button) to close it
    if (this.showDataOverlay) {
      // Check if we clicked on the button area - let it handle itself
      const btnX = this.width - 36;
      const btnY = this.height - 36;
      const inButton = clickX >= btnX - 18 && clickX <= btnX + 18 &&
                       clickY >= btnY - 18 && clickY <= btnY + 18;
      if (!inButton) {
        this.showDataOverlay = false;
        this.dataButton.toggle(false);
        return;
      }
    }
    
    // Convert to grid coordinates
    const gridX = Math.floor(clickX / this.cellW);
    const gridY = Math.floor(clickY / this.cellH);
    
    // Find closest agent within click tolerance (easier to click!)
    const clickTolerance = Math.max(this.cellW, this.cellH) * 1.5; // 1.5 cells radius
    let clickedAgent = null;
    let closestDist = clickTolerance;
    
    for (const agent of this.agents) {
      if (agent.healthState === "dead") continue;
      
      // Calculate pixel distance from click to agent center
      const agentPx = agent.x * this.cellW + this.cellW / 2;
      const agentPy = agent.y * this.cellH + this.cellH / 2;
      const dist = Math.sqrt((clickX - agentPx) ** 2 + (clickY - agentPy) ** 2);
      
      if (dist < closestDist) {
        closestDist = dist;
        clickedAgent = agent;
      }
    }
    
    if (clickedAgent) {
      // Click on agent: infect them if susceptible or vaccinated
      if (clickedAgent.healthState === "susceptible" || clickedAgent.healthState === "vaccinated") {
        this.infectAgent(clickedAgent);
      }
    } else {
      // Click on empty space: spawn new agent if valid floor
      if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
        const cell = this.grid[gridY][gridX];
        if (cell.type === "floor" || cell.type === "room_floor" || cell.type === "door") {
          const newAgent = new Agent(gridX, gridY, this.grid, this.rooms, this.hospital);
          this.agents.push(newAgent);
        }
      }
    }
  }
  
  /**
   * Infect an agent with the virus
   * @param {Agent} agent - Agent to infect
   */
  infectAgent(agent) {
    // Create Alpha variant if this is the first infection
    if (!this.infectionStarted) {
      const originalVariant = new Variant(this.nextVariantIndex++, null);
      // Set emergence location and time for the flash effect
      originalVariant.emergeTime = this.elapsedTime;
      originalVariant.emergeX = agent.x;
      originalVariant.emergeY = agent.y;
      this.variants.push(originalVariant);
      this.infectionStarted = true;
    }
    
    // Use the original variant (Alpha) for manual infections
    const variant = this.variants[0];
    
    agent.healthState = "exposed";
    agent.variant = variant;
    variant.infectionCount++;
    agent.diseaseTimer = CONFIG.incubationTime.min +
      Math.floor(Math.random() * (CONFIG.incubationTime.max - CONFIG.incubationTime.min));
  }

  calculateGrid() {
    this.cellW = this.width / this.gridWidth;
    this.cellH = this.height / this.gridHeight;
  }

  update(dt) {
    super.update(dt);
    this.calculateGrid();
    this.elapsedTime += dt;
    
    // Position the data button at bottom-right
    if (this.dataButton) {
      this.dataButton.x = this.width - 36;
      this.dataButton.y = this.height - 36;
    }

    // Spawn new agents every interval (only if infection has started)
    if (this.infectionStarted && this.elapsedTime - this.lastWaveTime >= CONFIG.newAgentInterval) {
      this.spawnNewAgents(CONFIG.newAgentCount);
      this.lastWaveTime = this.elapsedTime;
    }

    // Update all agents
    for (const agent of this.agents) {
      agent.update();
      
      // Start death flash tween for agents that just died
      if (agent.justDied) {
        agent.justDied = false;
        Tweenetik.to(agent, { deathFlash: 0 }, 0.8, Easing.easeOutQuad);
      }
    }

    // Process transmission (SEIR: only Infectious/red can transmit)
    this.processTransmission();
    
    // Track history for charts
    if (this.elapsedTime - this.lastHistoryTime >= CONFIG.historyInterval) {
      this.recordHistory();
      this.lastHistoryTime = this.elapsedTime;
    }
    
    // Find dominant variant (most active infections)
    this.updateDominantVariant();
    
    // Update all active tweens (for death flash, etc.)
    Tweenetik.updateAll(dt);
  }
  
  /**
   * Record current state for history charts
   */
  recordHistory() {
    const variantCounts = {};
    let infected = 0;
    let recovered = 0;
    
    for (const agent of this.agents) {
      if (agent.healthState === "infected" || agent.healthState === "exposed") {
        infected++;
        if (agent.variant) {
          variantCounts[agent.variant.name] = (variantCounts[agent.variant.name] || 0) + 1;
        }
      } else if (agent.healthState === "recovered") {
        recovered++;
      }
    }
    
    this.history.push({
      time: this.elapsedTime,
      infected,
      recovered,
      variants: { ...variantCounts }
    });
    
    // Trim old history
    if (this.history.length > CONFIG.maxHistoryPoints) {
      this.history.shift();
    }
  }
  
  /**
   * Find the currently dominant variant (most active infections)
   */
  updateDominantVariant() {
    if (this.variants.length === 0) {
      this.dominantVariant = null;
      return;
    }
    
    // Count active infections per variant
    const counts = new Map();
    for (const agent of this.agents) {
      if ((agent.healthState === "infected" || agent.healthState === "exposed") && agent.variant) {
        counts.set(agent.variant, (counts.get(agent.variant) || 0) + 1);
      }
    }
    
    // Find max
    let maxCount = 0;
    let dominant = null;
    for (const [variant, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        dominant = variant;
      }
    }
    
    this.dominantVariant = dominant;
  }

  /**
   * Create a new mutated variant from a parent
   * @param {Variant} parent - The variant that mutated
   * @param {Agent} sourceAgent - The agent whose virus mutated (for position tracking)
   * @returns {Variant} - The new mutated variant
   */
  createMutatedVariant(parent, sourceAgent = null) {
    const newVariant = new Variant(this.nextVariantIndex++, parent);
    // Track emergence for flash effect
    newVariant.emergeTime = this.elapsedTime;
    if (sourceAgent) {
      newVariant.emergeX = sourceAgent.x;
      newVariant.emergeY = sourceAgent.y;
    }
    this.variants.push(newVariant);
    console.log(`[MUTATION] New variant emerged: ${newVariant.name} (from ${parent.name})`);
    console.log(`  - Transmissibility: ${(newVariant.transmissionMultiplier * 100).toFixed(0)}%`);
    console.log(`  - Vaccine resistance: ${(newVariant.vaccineResistance * 100).toFixed(0)}%`);
    return newVariant;
  }

  spawnNewAgents(count) {
    for (let i = 0; i < count; i++) {
      if (this.floorCells.length === 0) break;
      const idx = Math.floor(Math.random() * this.floorCells.length);
      const cell = this.floorCells[idx];
      const agent = new Agent(cell.x, cell.y, this.grid, this.rooms, this.hospital);
      // New agents are susceptible (coming from outside)
      this.agents.push(agent);
    }
  }

  // Check which room an agent is in (if any)
  getAgentRoom(agent) {
    for (const room of this.rooms) {
      if (
        agent.x >= room.x && agent.x < room.x + room.width &&
        agent.y >= room.y && agent.y < room.y + room.height
      ) {
        return room;
      }
    }
    return null;
  }

  processTransmission() {
    // Build spatial map of agent positions
    const positionMap = new Map();
    for (const agent of this.agents) {
      if (agent.healthState === "dead") continue;
      const key = `${agent.x},${agent.y}`;
      if (!positionMap.has(key)) {
        positionMap.set(key, []);
      }
      positionMap.get(key).push(agent);
    }

    // Find all infectious (red) agents
    const infectious = this.agents.filter(a => a.healthState === "infected");

    // For each infectious agent, check for nearby susceptible/vaccinated
    for (const infected of infectious) {
      const infectedRoom = this.getAgentRoom(infected);
      const variant = infected.variant;
      
      // Skip if no variant (shouldn't happen, but safety check)
      if (!variant) continue;

      // Check same cell and adjacent cells (8-directional + center)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const checkX = infected.x + dx;
          const checkY = infected.y + dy;
          const key = `${checkX},${checkY}`;

          if (!positionMap.has(key)) continue;

          for (const target of positionMap.get(key)) {
            // Skip self
            if (target === infected) continue;

            // Only susceptible or vaccinated can be infected
            if (target.healthState !== "susceptible" && target.healthState !== "vaccinated") {
              continue;
            }

            // Calculate transmission probability with variant modifiers
            let prob = CONFIG.transmissionRate * variant.transmissionMultiplier;

            // Same cell = higher chance
            if (dx === 0 && dy === 0) {
              prob *= 1.5;
            }

            // Both in same room = indoor transmission bonus
            const targetRoom = this.getAgentRoom(target);
            if (infectedRoom && targetRoom && infectedRoom === targetRoom) {
              prob *= CONFIG.roomTransmissionBonus;
            }

            // Vaccinated have reduced susceptibility (reduced by variant's vaccine resistance)
            const isVaccinated = target.healthState === "vaccinated";
            if (isVaccinated) {
              const effectiveVaccineEfficacy = Math.max(0, CONFIG.vaccineEfficacy - variant.vaccineResistance);
              prob *= (1 - effectiveVaccineEfficacy);
            }

            // Roll for infection
            const roll = Math.random();
            if (roll < prob) {
              // Successful infection
              target.healthState = "exposed";
              target.variant = variant;
              variant.infectionCount++;
              target.diseaseTimer = CONFIG.incubationTime.min +
                Math.floor(Math.random() * (CONFIG.incubationTime.max - CONFIG.incubationTime.min));
            } else if (isVaccinated && roll < prob + CONFIG.mutationChanceOnVaccinated) {
              // Vaccine blocked infection, but virus mutates!
              // The infected agent's virus mutates for future transmissions
              if (this.variants.length < CONFIG.maxVariants) {
                const newVariant = this.createMutatedVariant(variant, infected);
                infected.variant = newVariant;
                
                // The mutated variant might now be able to infect this vaccinated person
                const newEffectiveEfficacy = Math.max(0, CONFIG.vaccineEfficacy - newVariant.vaccineResistance);
                const newProb = CONFIG.transmissionRate * newVariant.transmissionMultiplier * (1 - newEffectiveEfficacy);
                if (Math.random() < newProb) {
                  target.healthState = "exposed";
                  target.variant = newVariant;
                  newVariant.infectionCount++;
                  target.diseaseTimer = CONFIG.incubationTime.min +
                    Math.floor(Math.random() * (CONFIG.incubationTime.max - CONFIG.incubationTime.min));
                }
              }
            }
          }
        }
      }
    }
  }

  render() {
    // Don't call super.render() - it clears canvas and kills motion blur trail
    const ctx = this.ctx;
    const time = this.elapsedTime;

    // Motion blur trail effect
    ctx.fillStyle = `rgba(5, 5, 8, ${CONFIG.trailAlpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Count health states
    this.stats = {
      susceptible: 0,
      vaccinated: 0,
      exposed: 0,
      infected: 0,
      recovered: 0,
      dead: 0,
    };
    for (const agent of this.agents) {
      this.stats[agent.healthState]++;
    }

    // Draw subtle grid pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.gridWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * this.cellW, 0);
      ctx.lineTo(x * this.cellW, this.height);
      ctx.stroke();
    }
    for (let y = 0; y <= this.gridHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * this.cellH);
      ctx.lineTo(this.width, y * this.cellH);
      ctx.stroke();
    }

    // Draw walls with subtle glow
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        const px = x * this.cellW;
        const py = y * this.cellH;

        if (cell.type === "wall" || cell.type === "room_wall") {
          ctx.fillStyle = CONFIG.colors.wall;
          ctx.fillRect(px, py, this.cellW + 1, this.cellH + 1);
        } else if (cell.type === "hospital_wall") {
          // Hospital walls with subtle glow
          ctx.fillStyle = CONFIG.colors.hospitalWall;
          ctx.shadowColor = CONFIG.colors.hospitalWall;
          ctx.shadowBlur = 4;
          ctx.fillRect(px, py, this.cellW + 1, this.cellH + 1);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw medical cross in hospital center
    if (this.hospital) {
      const h = this.hospital;
      // Use pixel-based center for proper alignment
      const centerPxX = (h.x + h.width / 2) * this.cellW + 6;
      const centerPxY = (h.y + h.height / 2) * this.cellH + 6;
      
      ctx.fillStyle = CONFIG.colors.hospitalWall;
      ctx.shadowColor = CONFIG.colors.hospitalWall;
      ctx.shadowBlur = 3;
      ctx.globalAlpha = 0.25;
      
      // Draw cross centered at pixel coordinates
      const armW = this.cellW * 0.7;
      const armH = this.cellH * 2.5;
      
      // Vertical bar
      ctx.fillRect(centerPxX - armW / 2, centerPxY - armH / 2, armW, armH);
      // Horizontal bar
      ctx.fillRect(centerPxX - armH / 2, centerPxY - armW / 2, armH, armW);
      
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
    }

    // Draw agents as glowing circles
    for (const agent of this.agents) {
      const px = agent.x * this.cellW + this.cellW / 2;
      const py = agent.y * this.cellH + this.cellH / 2;
      const baseRadius = Math.min(this.cellW, this.cellH) * 0.4;
      
      let color, glowColor, alpha = 1.0, pulse = 0;
      
      // Visual dominance: dominant variant gets stronger glow
      const isDominant = agent.variant && agent.variant === this.dominantVariant;
      const glowMultiplier = isDominant ? 1.5 : (agent.variant && this.dominantVariant ? 0.6 : 1.0);
      
      switch (agent.healthState) {
        case "exposed":
          color = agent.variant ? agent.variant.color : CONFIG.colors.exposed;
          glowColor = color;
          alpha = 0.7;
          pulse = Math.sin(time * CONFIG.pulseSpeed + agent.x * 0.5) * 0.2;
          break;
        case "infected":
          color = agent.variant ? agent.variant.color : CONFIG.colors.infected;
          glowColor = color;
          // Infected pulse more intensely, dominant even more
          pulse = Math.sin(time * CONFIG.pulseSpeed * 2 + agent.y * 0.5) * (isDominant ? 0.4 : 0.25);
          break;
        case "recovered":
          color = CONFIG.colors.recovered;
          glowColor = color;
          break;
        case "vaccinated":
          color = CONFIG.colors.vaccinated;
          glowColor = color;
          // Subtle shield shimmer
          pulse = Math.sin(time * 2 + agent.x + agent.y) * 0.1;
          break;
        case "dead":
          // Flash white to gray on death (deathFlash: 1 = white, 0 = gray)
          const flash = agent.deathFlash || 0;
          const gray = Math.floor(34 + flash * 221); // 34 (#222) to 255 (#fff)
          color = `rgb(${gray}, ${gray}, ${gray})`;
          glowColor = flash > 0.1 ? "#fff" : "#111";
          alpha = 0.5 + flash * 0.5; // More visible during flash
          break;
        default:
          color = CONFIG.colors.agent;
          glowColor = color;
      }
      
      const radius = baseRadius * (1 + pulse);
      
      // Draw glow - intensity based on dominance
      if (CONFIG.agentGlow && agent.healthState !== "dead") {
        const glowRadius = radius * 2.5 * glowMultiplier;
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
        const glowAlpha = isDominant ? "80" : "40";
        gradient.addColorStop(0, glowColor + glowAlpha);
        gradient.addColorStop(0.5, glowColor + "20");
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw core
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner highlight
      if (agent.healthState !== "dead") {
        const innerGrad = ctx.createRadialGradient(
          px - radius * 0.3, py - radius * 0.3, 0,
          px, py, radius
        );
        innerGrad.addColorStop(0, "rgba(255,255,255,0.4)");
        innerGrad.addColorStop(0.5, "rgba(255,255,255,0.1)");
        innerGrad.addColorStop(1, "transparent");
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1.0;
    }

    // Scanline effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
    for (let y = 0; y < this.height; y += 3) {
      ctx.fillRect(0, y, this.width, 1);
    }
    
    // Vignette effect
    const vignetteGrad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.height * 0.3,
      this.width / 2, this.height / 2, this.height * 0.9
    );
    vignetteGrad.addColorStop(0, "transparent");
    vignetteGrad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw variant emergence flashes
    this.drawVariantFlashes(ctx, time);

    // Draw minimal HUD
    this.drawMinimalHUD(ctx);
    
    // Draw data overlay if active
    if (this.showDataOverlay) {
      this.drawDataOverlay(ctx);
    }
    
    // Render the data button AFTER all custom rendering (not via pipeline)
    if (this.dataButton) {
      this.dataButton.render();
    }
  }
  
  /**
   * Draw variant name flashes when new variants emerge
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} time - Current elapsed time
   */
  drawVariantFlashes(ctx, time) {
    for (const variant of this.variants) {
      const elapsed = time - variant.emergeTime;
      
      // Only show flash for the configured duration
      if (elapsed < 0 || elapsed > CONFIG.variantFlashDuration) continue;
      
      // Calculate alpha (fade out after fadeStart)
      let alpha = 1.0;
      if (elapsed > CONFIG.variantFlashFadeStart) {
        const fadeProgress = (elapsed - CONFIG.variantFlashFadeStart) / 
                            (CONFIG.variantFlashDuration - CONFIG.variantFlashFadeStart);
        alpha = 1.0 - fadeProgress;
      }
      
      // Convert grid position to screen position
      const px = variant.emergeX * this.cellW + this.cellW / 2;
      const py = variant.emergeY * this.cellH - 20; // Above the agent
      
      // Draw variant name with glow
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 16px "Fira Code", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      
      // Glow effect
      ctx.shadowColor = variant.color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = variant.color;
      ctx.fillText(variant.name.toUpperCase(), px, py);
      
      // Solid text on top
      ctx.shadowBlur = 0;
      ctx.fillText(variant.name.toUpperCase(), px, py);
      
      ctx.restore();
    }
  }
  
  /**
   * Draw minimal HUD - just essential stats and instructions
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawMinimalHUD(ctx) {
    // Instructions at top right (small, unobtrusive)
    ctx.font = '11px "Fira Code", monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(this.width - 180, 12, 168, 32);
    
    ctx.fillStyle = "rgba(0, 255, 128, 0.6)";
    ctx.fillText("CLICK agent to INFECT", this.width - 16, 16);
    ctx.fillText("CLICK floor to SPAWN", this.width - 16, 28);
    
    // Tiny stats at bottom left
    ctx.font = '12px "Fira Code", monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";

    const infected = this.stats.infected + this.stats.exposed;
    const recovered = this.stats.recovered;
    const dead = this.stats.dead;
    
    // Adjust box height if showing dead count
    const boxHeight = dead > 0 ? 46 : 32;
    const boxY = this.height - boxHeight - 12;

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(12, boxY, 120, boxHeight);

    let textY = boxY + 14;
    
    ctx.fillStyle = CONFIG.colors.infected;
    ctx.fillText(`INFECTED: ${infected}`, 16, textY);
    textY += 14;

    ctx.fillStyle = CONFIG.colors.recovered;
    ctx.fillText(`RECOVERED: ${recovered}`, 16, textY);
    
    // Show dead count only when there are deaths
    if (dead > 0) {
      textY += 14;
      ctx.fillStyle = "#666";
      ctx.fillText(`DEAD: ${dead}`, 16, textY);
    }
  }
  
  /**
   * Draw data overlay with charts (shown when [i] button is toggled)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawDataOverlay(ctx) {
    // Semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, this.width, this.height);
    
    const padding = 40;
    const chartWidth = this.width - padding * 2;
    const chartHeight = (this.height - padding * 3) / 2;
    
    // Title
    ctx.font = 'bold 18px "Fira Code", monospace';
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("VARIANT ANALYTICS", this.width / 2, 15);
    
    // Draw line chart: variant prevalence over time
    this.drawPrevalenceChart(ctx, padding, padding + 20, chartWidth, chartHeight - 20);
    
    // Draw bar chart: current variant stats
    this.drawVariantBars(ctx, padding, padding + chartHeight + 30, chartWidth, chartHeight - 30);
    
    // Close hint
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.textAlign = "center";
    ctx.fillText("click anywhere to close", this.width / 2, this.height - 15);
  }
  
  /**
   * Draw line chart showing variant prevalence over time
   */
  drawPrevalenceChart(ctx, x, y, w, h) {
    // Chart background
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(x, y, w, h);
    
    // Title
    ctx.font = '12px "Fira Code", monospace';
    ctx.fillStyle = "#888";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Infections Over Time", x, y - 15);
    
    if (this.history.length < 2) {
      ctx.fillStyle = "#444";
      ctx.textAlign = "center";
      ctx.fillText("Collecting data...", x + w/2, y + h/2);
      return;
    }
    
    // Find max value for scaling
    let maxVal = 1;
    for (const point of this.history) {
      maxVal = Math.max(maxVal, point.infected);
    }
    
    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const gy = y + h - (i / 4) * h;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
    
    // Draw lines for each variant
    const variantNames = new Set();
    for (const point of this.history) {
      for (const name of Object.keys(point.variants)) {
        variantNames.add(name);
      }
    }
    
    for (const variantName of variantNames) {
      const variant = this.variants.find(v => v.name === variantName);
      if (!variant) continue;
      
      ctx.strokeStyle = variant.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      let started = false;
      for (let i = 0; i < this.history.length; i++) {
        const point = this.history[i];
        const val = point.variants[variantName] || 0;
        const px = x + (i / (this.history.length - 1)) * w;
        const py = y + h - (val / maxVal) * h;
        
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }
    
    // Y-axis label
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = "#666";
    ctx.textAlign = "right";
    ctx.fillText(maxVal.toString(), x - 5, y);
    ctx.fillText("0", x - 5, y + h);
  }
  
  /**
   * Draw bar chart showing current variant transmission and resistance
   */
  drawVariantBars(ctx, x, y, w, h) {
    // Chart background
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(x, y, w, h);
    
    // Title
    ctx.font = '12px "Fira Code", monospace';
    ctx.fillStyle = "#888";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Variant Properties (Transmissibility / Vaccine Resistance)", x, y - 15);
    
    if (this.variants.length === 0) {
      ctx.fillStyle = "#444";
      ctx.textAlign = "center";
      ctx.fillText("No variants yet", x + w/2, y + h/2);
      return;
    }
    
    const barWidth = Math.min(60, (w - 20) / this.variants.length - 10);
    const spacing = (w - barWidth * this.variants.length) / (this.variants.length + 1);
    
    // Find max transmission for scaling
    let maxTrans = 1;
    for (const v of this.variants) {
      maxTrans = Math.max(maxTrans, v.transmissionMultiplier);
    }
    
    for (let i = 0; i < this.variants.length; i++) {
      const variant = this.variants[i];
      const bx = x + spacing + i * (barWidth + spacing);
      
      // Transmission bar (left half)
      const transHeight = (variant.transmissionMultiplier / maxTrans) * (h - 30);
      ctx.fillStyle = variant.color;
      ctx.fillRect(bx, y + h - 20 - transHeight, barWidth / 2 - 2, transHeight);
      
      // Resistance bar (right half)
      const resistHeight = variant.vaccineResistance * (h - 30);
      ctx.fillStyle = variant.color + "80";
      ctx.fillRect(bx + barWidth / 2 + 2, y + h - 20 - resistHeight, barWidth / 2 - 2, resistHeight);
      
      // Label
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillStyle = variant.color;
      ctx.textAlign = "center";
      ctx.fillText(variant.name, bx + barWidth / 2, y + h - 5);
    }
    
    // Legend
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = "#666";
    ctx.textAlign = "right";
    ctx.fillText("■ Trans  □ Resist", x + w, y - 15);
  }
}

export default function day29(canvas) {
  const game = new Day29Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
