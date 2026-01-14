/**
 * WireWorld - A cellular automaton for simulating electronic circuits.
 * 4 states: empty, wire (conductor), electron head, electron tail.
 * Electrons flow through wires, enabling logic gates and circuits.
 *
 * Click to inject electrons into wires.
 * Watch signals propagate through pre-built circuits.
 * 
 * Saved from Day 9 for potential future use.
 */
import { Game, Painter } from "@guinetik/gcanvas";

const CONFIG = {
  cellSize: 12,
  updateInterval: 0.08, // seconds between CA steps

  colors: {
    bg: "#000",              // Black background
    empty: "#0a0a0a",        // Empty cells
    wire: "#0a0",            // Dark green wire
    wireHighlight: "#0f0",   // Bright green highlight
    electronHead: "#fff",    // White electron front
    electronTail: "#0f0",    // Neon green electron back
    grid: "#111",            // Grid lines
    text: "#0f0",
    textDim: "rgba(0, 255, 0, 0.5)",
  },
};

// Cell states
const EMPTY = 0;
const WIRE = 1;
const HEAD = 2;
const TAIL = 3;

// Pre-built circuit patterns
const CIRCUITS = [
  {
    name: "CLOCK + DIODES",
    desc: "Oscillator feeding into one-way diodes",
    width: 60,
    height: 30,
    pattern: `
......................................................
......................................................
....HTWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW....
....W................................................W....
....W................................................W....
....W.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW......W....
....W.....W......................................W......W....
....W.....W......................................W......W....
....W.....W.....WWWWWWWWWWWWWWWWWWWWWWWWWWW......W......W....
....W.....W.....W..........................W......W......W....
....WWWWWWWWWWWWW..........................WWWWWWWWWWWWWWW....
......................................................
......................................................
`,
  },
  {
    name: "XOR GATE",
    desc: "Two inputs, XOR logic output",
    width: 50,
    height: 25,
    pattern: `
..................................................
..................................................
.....WWWWWWWWWWWWWWWW.............................
.....W...............WWWWW........................
.....W...............W...WWWWWWWWWWWWWWWWWWWWWW...
.....W...............W...W....................W...
.....W..........WWWWWWWWWW....................W...
.....W..........W.....W.......................W...
.....WWWWWWWWWWWW.....W.......................W...
......................W.......................W...
......................W.......................W...
.....WWWWWWWWWWWW.....W.......................W...
.....W..........W.....W.......................W...
.....W..........WWWWWWWWWWW...................W...
.....W...............W...W....................W...
.....W...............W...WWWWWWWWWWWWWWWWWWWWWW...
.....W...............WWWWW........................
.....WWWWWWWWWWWWWWWW.............................
..................................................
`,
  },
  {
    name: "SIGNAL RACE",
    desc: "Electrons race through parallel paths",
    width: 70,
    height: 20,
    pattern: `
......................................................................
......................................................................
....HTWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW....
..........W......................................................W....
..........W......................................................W....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW....
..........W......................................................W....
..........W......................................................W....
....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW....
......................................................................
`,
  },
  {
    name: "CLOCK PULSER",
    desc: "Simple 4-cycle clock generator",
    width: 30,
    height: 15,
    pattern: `
..............................
..............................
.....HTWW.....................
.....W..W.....................
.....W..WWWWWWWWWWWWWWWWWWW...
.....W..W.................W...
.....W..W.................W...
.....WWWW.................W...
..........................W...
..........................W...
..............................
`,
  },
  {
    name: "BINARY COUNTER",
    desc: "Pulses generate counting pattern",
    width: 80,
    height: 35,
    pattern: `
................................................................................
................................................................................
.....HTW........................................................................
.....W.W........................................................................
.....W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.....W.W.....................................................................W.....
.....W.W.....................................................................W.....
.....W.W........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...W.....
.....W.W........W........................................................W...W.....
.....W.W........W........................................................W...W.....
.....W.W........W.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...W...W.....
.....W.W........W.......W............................................W...W...W.....
.....W.W........W.......W............................................W...W...W.....
.....W.W........W.......W......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...W...W...W.....
.....W.W........W.......W......W..................................W...W...W...W.....
.....W.W........W.......W......W..................................W...W...W...W.....
.....W.WWWWWWWWWWWWWWWWWWWWWWWWWW..................................W...W...W...W.....
.....W.W........W.......W......W..................................W...W...W...W.....
.....WWW........W.......W......W..................................W...W...W...W.....
................W.......W......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
................W.......W............................................W...W...W.....
................W.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
................W........................................................W...W.....
................WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.....................................................................W...W.....
.....................................................................WWWWW.....
................................................................................
`,
  },
  {
    name: "NEURON NETWORK",
    desc: "Interconnected oscillators",
    width: 60,
    height: 40,
    pattern: `
............................................................
............................................................
.....HTW....................................................
.....W.W....................................................
.....W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW......................
.....W.W............................W......................
.....WWW............................W......................
................................WWWWWWWWW...................
................................W.......W...................
.....HTW........................W.......W...................
.....W.W........................W.......WWWWWWWWWWWWWWWWW...
.....W.WWWWWWWWWWWWWWWWWWWWWWWWWW.......W...............W...
.....W.W............................W...W...............W...
.....WWW............................W...W...............W...
................................WWWWW...W...............W...
................................W.......W...............W...
.....HTW........................W.......W...............W...
.....W.W........................W.......WWWWWWWWWWWWWWWWW...
.....W.WWWWWWWWWWWWWWWWWWWWWWWWWW.......W...................
.....W.W............................W...W...................
.....WWW............................WWWWW...................
............................................................
............................................................
`,
  },
];

class WireWorld {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = new Uint8Array(width * height);
  }

  index(x, y) {
    return y * this.width + x;
  }

  get(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return EMPTY;
    return this.cells[this.index(x, y)];
  }

  set(x, y, state) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.cells[this.index(x, y)] = state;
  }

  countHeadNeighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (this.get(x + dx, y + dy) === HEAD) count++;
      }
    }
    return count;
  }

  step() {
    const newCells = new Uint8Array(this.width * this.height);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const state = this.get(x, y);
        let newState = state;

        switch (state) {
          case EMPTY:
            newState = EMPTY;
            break;
          case HEAD:
            newState = TAIL;
            break;
          case TAIL:
            newState = WIRE;
            break;
          case WIRE:
            const heads = this.countHeadNeighbors(x, y);
            newState = (heads === 1 || heads === 2) ? HEAD : WIRE;
            break;
        }

        newCells[this.index(x, y)] = newState;
      }
    }

    this.cells = newCells;
  }

  loadPattern(pattern, offsetX = 0, offsetY = 0) {
    const lines = pattern.trim().split('\n');
    for (let y = 0; y < lines.length; y++) {
      const line = lines[y];
      for (let x = 0; x < line.length; x++) {
        const char = line[x];
        let state = EMPTY;
        switch (char) {
          case 'W': state = WIRE; break;
          case 'H': state = HEAD; break;
          case 'T': state = TAIL; break;
          default: state = EMPTY;
        }
        this.set(x + offsetX, y + offsetY, state);
      }
    }
  }

  clear() {
    this.cells.fill(EMPTY);
  }

  injectElectron(x, y) {
    if (this.get(x, y) === WIRE) {
      this.set(x, y, HEAD);
      return true;
    }
    return false;
  }
}

class GatesDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.colors.bg;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    this.container = this.canvas.parentElement;
    if (this.container) {
      this.enableFluidSize(this.container);
    }

    this.cellSize = CONFIG.cellSize;
    this.circuitIndex = 0;
    this.updateTimer = 0;
    this.stepCount = 0;

    this.setupGrid();
    this.loadCircuit(this.circuitIndex);

    // Mouse state
    this.mouseX = -1;
    this.mouseY = -1;

    // Click to inject electron or change circuit
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert to grid coordinates
      const gridX = Math.floor((clickX - this.offsetX) / this.cellSize);
      const gridY = Math.floor((clickY - this.offsetY) / this.cellSize);

      // Try to inject electron
      if (this.world.injectElectron(gridX, gridY)) {
        return; // Injected electron
      }

      // Otherwise cycle circuit
      this.circuitIndex = (this.circuitIndex + 1) % CIRCUITS.length;
      this.loadCircuit(this.circuitIndex);
    });

    // Track mouse for hover effect
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = Math.floor((e.clientX - rect.left - this.offsetX) / this.cellSize);
      this.mouseY = Math.floor((e.clientY - rect.top - this.offsetY) / this.cellSize);
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.mouseX = -1;
      this.mouseY = -1;
    });

    // Keyboard controls
    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        this.circuitIndex = (this.circuitIndex + 1) % CIRCUITS.length;
        this.loadCircuit(this.circuitIndex);
      } else if (e.key === "ArrowLeft") {
        this.circuitIndex = (this.circuitIndex - 1 + CIRCUITS.length) % CIRCUITS.length;
        this.loadCircuit(this.circuitIndex);
      } else if (e.key === "r" || e.key === "R") {
        this.loadCircuit(this.circuitIndex); // Reset current
      }
    });
  }

  setupGrid() {
    this.gridWidth = Math.floor(this.width / this.cellSize);
    this.gridHeight = Math.floor(this.height / this.cellSize);
    this.world = new WireWorld(this.gridWidth, this.gridHeight);
  }

  loadCircuit(index) {
    const circuit = CIRCUITS[index];
    this.world.clear();
    this.stepCount = 0;

    // Center the pattern
    const patternLines = circuit.pattern.trim().split('\n');
    const patternHeight = patternLines.length;
    const patternWidth = Math.max(...patternLines.map(l => l.length));

    const offsetX = Math.floor((this.gridWidth - patternWidth) / 2);
    const offsetY = Math.floor((this.gridHeight - patternHeight) / 2);

    this.world.loadPattern(circuit.pattern, offsetX, offsetY);
  }

  update(dt) {
    super.update(dt);

    // Check for resize
    const newGridWidth = Math.floor(this.width / this.cellSize);
    const newGridHeight = Math.floor(this.height / this.cellSize);

    if (newGridWidth !== this.gridWidth || newGridHeight !== this.gridHeight) {
      this.setupGrid();
      this.loadCircuit(this.circuitIndex);
    }

    // Step the simulation
    this.updateTimer += dt;
    if (this.updateTimer >= CONFIG.updateInterval) {
      this.world.step();
      this.stepCount++;
      this.updateTimer = 0;
    }
  }

  render() {
    const ctx = this.ctx;
    const cellSize = this.cellSize;

    // Clear
    ctx.fillStyle = CONFIG.colors.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // Calculate offset to center grid
    this.offsetX = (this.width - this.gridWidth * cellSize) / 2;
    this.offsetY = (this.height - this.gridHeight * cellSize) / 2;

    // Draw cells
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const state = this.world.get(x, y);
        const px = this.offsetX + x * cellSize;
        const py = this.offsetY + y * cellSize;

        let color = CONFIG.colors.empty;

        switch (state) {
          case WIRE:
            // Highlight wire under mouse
            if (x === this.mouseX && y === this.mouseY) {
              color = CONFIG.colors.wireHighlight;
            } else {
              color = CONFIG.colors.wire;
            }
            break;
          case HEAD:
            color = CONFIG.colors.electronHead;
            break;
          case TAIL:
            color = CONFIG.colors.electronTail;
            break;
        }

        if (state !== EMPTY) {
          ctx.fillStyle = color;
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

          // Add glow for electrons
          if (state === HEAD) {
            ctx.shadowColor = "#0f0";
            ctx.shadowBlur = 12;
            ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            ctx.shadowBlur = 0;
          } else if (state === TAIL) {
            ctx.shadowColor = "#0f0";
            ctx.shadowBlur = 6;
            ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            ctx.shadowBlur = 0;
          }
        }
      }
    }

    // Draw hover highlight for wire cells
    if (this.mouseX >= 0 && this.mouseY >= 0 &&
        this.mouseX < this.gridWidth && this.mouseY < this.gridHeight) {
      const state = this.world.get(this.mouseX, this.mouseY);
      if (state === WIRE) {
        ctx.strokeStyle = "#0f0";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#0f0";
        ctx.shadowBlur = 8;
        ctx.strokeRect(
          this.offsetX + this.mouseX * cellSize,
          this.offsetY + this.mouseY * cellSize,
          cellSize,
          cellSize
        );
        ctx.shadowBlur = 0;
      }
    }

    // Draw overlay
    this.drawOverlay(ctx);
  }

  drawOverlay(ctx) {
    const circuit = CIRCUITS[this.circuitIndex];
    const padding = 20;

    // Background for text
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(padding - 5, padding - 5, 260, 70);

    // Circuit name
    ctx.font = 'bold 18px "Fira Code", monospace';
    ctx.fillStyle = CONFIG.colors.text;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(circuit.name, padding, padding);

    // Description
    ctx.font = '12px "Fira Code", monospace';
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.fillText(circuit.desc, padding, padding + 25);

    // Step counter
    ctx.fillText(`Step: ${this.stepCount}`, padding, padding + 45);

    // Legend
    this.drawLegend(ctx);

    // Controls hint
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.textAlign = "right";
    ctx.fillText("click wire: inject electron | click empty: next circuit | arrows: navigate", this.width - padding, this.height - padding);
  }

  drawLegend(ctx) {
    const startX = this.width - 140;
    const startY = 20;
    const boxSize = 14;
    const spacing = 22;

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(startX - 10, startY - 10, 130, 100);

    const items = [
      { label: "Wire", color: CONFIG.colors.wire },
      { label: "Head", color: CONFIG.colors.electronHead },
      { label: "Tail", color: CONFIG.colors.electronTail },
    ];

    ctx.font = '11px "Fira Code", monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    items.forEach((item, i) => {
      const y = startY + i * spacing;

      ctx.fillStyle = item.color;
      ctx.fillRect(startX, y, boxSize, boxSize);

      ctx.fillStyle = CONFIG.colors.textDim;
      ctx.fillText(item.label, startX + boxSize + 8, y + boxSize / 2);
    });
  }
}

export default function gates(canvas) {
  const game = new GatesDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
