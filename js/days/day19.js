/**
 * Genuary 2026 - Day 19
 * Prompt: "16×16"
 * 
 * @fileoverview GROKKING NEURAL NETWORK - Modular arithmetic learning
 * 
 * A neural network learns modular arithmetic: (a + b) mod p = c
 * The 16×16 grid visualizes the hidden layer activations (256 neurons).
 * Watch the network transition from memorization to generalization (grokking).
 * 
 * The network starts by memorizing training examples, then suddenly
 * discovers the underlying pattern and generalizes to unseen examples.
 * 
 * Click to restart training. Hover to see current test case.
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import { Game, Painter, Motion, StateMachine, Tweenetik, Easing } from '@guinetik/gcanvas';
// Factored MLP (Google's grokking architecture)
import { FactoredNetwork, generateAllPairs, splitData, calcAccuracy } from './day19.grokking.js';

/**
 * Neuron class to represent neuron state and rendering
 */
class Neuron {
  constructor(x, y, baseSize = 4) {
    this.x = x;
    this.y = y;
    this.targetX = x; // Target position for spawn animation
    this.targetY = y;
    this.baseSize = baseSize;
    this.activation = 0;
    this.isActive = false;
    this.isSelected = false; // For highlighting (e.g., predicted output)
    this.isTarget = false; // For highlighting (e.g., target output)
    this.isError = false; // For error state (red)
    this.isCorrect = false; // For correct state (green)
    this.spawnScale = 1; // Scale for spawn animation (0 = hidden, 1 = full)
  }
  
  /**
   * Render the neuron
   */
  render(ctx, colors) {
    const { neuronIdle, neuronActive, neuronBright } = colors;
    
    if (this.isActive) {
      // Activated neuron: white core with small green glow
      const size = this.baseSize;
      const glowRadius = size * 1.1;
      const glowAlpha = 0.2;
      
      ctx.fillStyle = `rgba(0, 255, 0, ${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Determine color based on selection/target
      let color = neuronActive;
      if (this.isSelected || this.isTarget) {
        color = neuronBright; // White for selected/target
      }
      
      ctx.fillStyle = color;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Inactive neuron: dim dot
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.baseSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * Render as grid neuron with scale-based activation
   * @param {number} grokMode - 0=green, 1=rainbow (smooth transition)
   * @param {number} row - Grid row for rainbow hue calculation
   * @param {number} col - Grid column for rainbow hue calculation
   * @param {number} time - Animation time for rainbow shimmer
   * @param {number} neuronScale - Scale multiplier for activation (0.3 to 1.5)
   */
  renderGrid(ctx, colors, maxActivation = 1, flashIntensity = 0, scale = 1, grokMode = 0, row = 0, col = 0, time = 0, neuronScale = 1) {
    // Skip if not spawned yet
    if (this.spawnScale <= 0.01) return;

    const { neuronActive, neuronBright } = colors;

    // Use neuronScale for size-based activation (not opacity)
    const spawnMult = this.spawnScale;
    const sizeMultiplier = neuronScale;
    // Use configured base size
    const neuronBaseSize = CONFIG.neuron?.baseSize || 8;
    const baseSize = neuronBaseSize * scale * spawnMult * sizeMultiplier;
    const minDotSize = 2 * scale * spawnMult;

    // Calculate rainbow hue based on grid position (like day23)
    const hue = (row * 0.1 + col * 0.15 + time * 0.1) % 1;
    const rainbowR = Math.floor((0.5 + 0.5 * Math.sin(hue * 6.28)) * 255);
    const rainbowG = Math.floor((0.5 + 0.5 * Math.sin(hue * 6.28 + 2.09)) * 255);
    const rainbowB = Math.floor((0.5 + 0.5 * Math.sin(hue * 6.28 + 4.18)) * 255);

    // Small inactive neurons (scale-based, not opacity)
    const isActivated = neuronScale > 0.4;
    if (!isActivated) {
      // Dim green dot (original style)
      const inactiveSize = Math.max(2, minDotSize);
      if (grokMode > 0.5) {
        const dimBrightness = 0.4;
        ctx.fillStyle = `rgb(${Math.floor(rainbowR * dimBrightness)}, ${Math.floor(rainbowG * dimBrightness)}, ${Math.floor(rainbowB * dimBrightness)})`;
      } else {
        // Original: dim green
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, inactiveSize, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    
    // Size driven by neuronScale (already incorporated in baseSize)
    const size = baseSize;
    
    // Determine colors based on grokMode
    let coreR, coreG, coreB;

    if (grokMode > 0.5) {
      coreR = rainbowR;
      coreG = rainbowG;
      coreB = rainbowB;
    } else if (grokMode > 0.01) {
      coreR = Math.floor(rainbowR * grokMode);
      coreG = Math.floor(255 * (1 - grokMode) + rainbowG * grokMode);
      coreB = Math.floor(255 * (1 - grokMode) + rainbowB * grokMode);
    } else {
      // Cyan theme (original look)
      coreR = 0;
      coreG = 255;
      coreB = 255;
    }

    // Large soft outer glow
    ctx.fillStyle = `rgba(${coreR}, ${coreG}, ${coreB}, 0.15)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Medium glow
    ctx.fillStyle = `rgba(${coreR}, ${coreG}, ${coreB}, 0.25)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core ring (cyan)
    ctx.fillStyle = `rgb(${coreR}, ${coreG}, ${coreB})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();

    // Bright white center (large, prominent)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render as output neuron - WHITE to differentiate from grid
   * Uses scale for activation (like grid neurons)
   * @param {number} grokMode - If > 0.5, override error state
   */
  renderOutput(ctx, colors, flashIntensity = 0, scale = 1, grokMode = 0) {
    // Skip if not spawned yet
    if (this.spawnScale <= 0.01) return;

    const spawnMult = this.spawnScale;
    const neuronCfg = CONFIG.neuron;

    // Use scale-based activation like grid neurons
    if (this.currentScale === undefined) {
      this.currentScale = neuronCfg.minScale;
    }

    // Target scale based on activation
    const targetScale = flashIntensity > 0.5 ? neuronCfg.maxScale : neuronCfg.minScale;

    // Smooth scale transition
    const speed = targetScale > this.currentScale ? neuronCfg.growSpeed : neuronCfg.shrinkSpeed;
    this.currentScale += (targetScale - this.currentScale) * Math.min(1, speed * 0.016);

    const sizeMultiplier = this.currentScale;
    // Use same base size as grid neurons
    const neuronBaseSize = CONFIG.neuron?.baseSize || 8;
    const baseSize = neuronBaseSize * scale * spawnMult * sizeMultiplier;
    const minDotSize = 3 * scale * spawnMult;

    // In grok mode, override error state
    const showError = this.isError && grokMode < 0.5;

    // Inactive: small white dot (visible against dark background)
    if (sizeMultiplier < 0.4) {
      const dimAlpha = (this.isTarget || this.isSelected) ? 0.4 : 0.2;
      ctx.fillStyle = `rgba(255, 255, 255, ${dimAlpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(2, minDotSize), 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Active: colored based on state (green=correct, red=error, white=neutral)
    let coreColor, glowColor;

    if (showError) {
      // Red for wrong prediction
      coreColor = '#f44';
      glowColor = 'rgba(255, 50, 50, 0.3)';
    } else if (this.isCorrect) {
      // Green for correct (either correct prediction or target when wrong)
      coreColor = '#0f0';
      glowColor = 'rgba(0, 255, 0, 0.3)';
    } else {
      // White for neutral
      coreColor = '#fff';
      glowColor = 'rgba(255, 255, 255, 0.2)';
    }

    // Draw glow
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, baseSize * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Draw neuron core
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, baseSize, 0, Math.PI * 2);
    ctx.fill();

    // Gray center for white neurons (to match grid style)
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, baseSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Maps actual network neurons to display grid positions
 * 64 hidden neurons → 16×16 grid (8×8 neurons, each as 2×2 block centered)
 * 67 output tokens → 16 display rows (grouped with proper distribution)
 */
class NeuronMapper {
  constructor(hiddenSize, nTokens, gridRows = 16, gridCols = 16) {
    this.hiddenSize = hiddenSize;  // 64
    this.nTokens = nTokens;        // 67
    this.gridRows = gridRows;      // 16
    this.gridCols = gridCols;      // 16
    this.gridSize = gridRows * gridCols; // 256

    // Build mapping tables
    this._buildHiddenMapping();
    this._buildOutputMapping();
  }

  /**
   * Build mapping from 64 hidden neurons to 256 grid cells
   * Each neuron gets a 2×2 block, centered in the 16×16 grid
   */
  _buildHiddenMapping() {
    const neuronRows = 8;
    const neuronCols = 8;

    // Offset to center 8×8 (×2 = 16×16) in the grid
    // For 8 neurons across, each 2 cells = 16 cells, so offset = 0
    const offsetRow = Math.floor((this.gridRows - neuronRows * 2) / 2);
    const offsetCol = Math.floor((this.gridCols - neuronCols * 2) / 2);

    // hiddenToGrid[neuronIdx] = [gridIdx1, gridIdx2, gridIdx3, gridIdx4]
    this.hiddenToGrid = [];
    // gridToHidden[gridIdx] = neuronIdx (or -1 if not mapped)
    this.gridToHidden = new Int16Array(this.gridSize).fill(-1);

    for (let n = 0; n < this.hiddenSize; n++) {
      const nRow = Math.floor(n / neuronCols); // 0-7
      const nCol = n % neuronCols;             // 0-7

      // Top-left of 2×2 block in grid
      const gridRow = offsetRow + nRow * 2;
      const gridCol = offsetCol + nCol * 2;

      // Four grid cells for this neuron
      const cells = [];
      for (let dr = 0; dr < 2; dr++) {
        for (let dc = 0; dc < 2; dc++) {
          const r = gridRow + dr;
          const c = gridCol + dc;
          if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
            const gridIdx = r * this.gridCols + c;
            cells.push(gridIdx);
            this.gridToHidden[gridIdx] = n;
          }
        }
      }
      this.hiddenToGrid.push(cells);
    }
  }

  /**
   * Build mapping from 67 output tokens to 16 display rows
   * Distribute tokens evenly across rows
   */
  _buildOutputMapping() {
    const displayRows = 16;

    // tokenToRow[tokenIdx] = displayRow (0-15)
    this.tokenToRow = new Int16Array(this.nTokens);
    // rowToTokens[row] = [tokenIdx1, tokenIdx2, ...]
    this.rowToTokens = [];

    for (let r = 0; r < displayRows; r++) {
      this.rowToTokens.push([]);
    }

    for (let t = 0; t < this.nTokens; t++) {
      const row = Math.floor(t * displayRows / this.nTokens);
      this.tokenToRow[t] = row;
      this.rowToTokens[row].push(t);
    }
  }

  /**
   * Get grid cells for a hidden neuron
   * @param {number} neuronIdx - Hidden neuron index (0-63)
   * @returns {number[]} Array of grid cell indices
   */
  getGridCells(neuronIdx) {
    return this.hiddenToGrid[neuronIdx] || [];
  }

  /**
   * Get display row for output token
   * @param {number} tokenIdx - Output token (0-66)
   * @returns {number} Display row (0-15)
   */
  getOutputRow(tokenIdx) {
    return this.tokenToRow[tokenIdx];
  }

  /**
   * Get hidden neuron for a grid cell
   * @param {number} gridIdx - Grid cell index (0-255)
   * @returns {number} Hidden neuron index or -1 if not mapped
   */
  getHiddenNeuron(gridIdx) {
    return this.gridToHidden[gridIdx];
  }

  /**
   * Check if a grid cell is mapped to a hidden neuron
   * @param {number} gridIdx - Grid cell index
   * @returns {boolean}
   */
  isMapped(gridIdx) {
    return this.gridToHidden[gridIdx] >= 0;
  }

  /**
   * Get center position of a hidden neuron's 2×2 block in grid coordinates
   * @param {number} neuronIdx - Hidden neuron index
   * @returns {{row: number, col: number}} Center row/col (can be fractional)
   */
  getNeuronCenter(neuronIdx) {
    const neuronCols = 8;
    const offsetRow = Math.floor((this.gridRows - 8 * 2) / 2);
    const offsetCol = Math.floor((this.gridCols - 8 * 2) / 2);

    const nRow = Math.floor(neuronIdx / neuronCols);
    const nCol = neuronIdx % neuronCols;

    return {
      row: offsetRow + nRow * 2 + 0.5,
      col: offsetCol + nCol * 2 + 0.5
    };
  }
}

const CONFIG = {
  background: '#000',
  // Factored MLP architecture (from Google's grokking implementation)
  // Architecture: Embed → Hidden(tied) → ReLU(h_a + h_b) → Out → Unembed(tied)
  network: {
    nTokens: 67,         // Modulus (number of possible outputs)
    embedSize: 500,      // Embedding dimension (Google used 500)
    // NOTE: We use 64 neurons (not 256) to induce grokking faster.
    // More capacity = longer memorization phase before generalization.
    // 64 neurons are mapped to the 16×16 grid as 2×2 blocks for visualization.
    hiddenSize: 64,
    learningRate: 1e-2,  // Standard AdamW LR
    weightDecay: 1.0,    // HIGH weight decay - THE key to grokking!
    beta1: 0.9,          // AdamW beta1
    beta2: 0.98,         // AdamW beta2 (from Google)
    symmetric: true,     // Only use pairs where a <= b (like Google)
    trainFraction: 0.4,  // 40% train, 60% test (from Google)
  },
  // Training
  training: {
    batchSize: 64,       // Full batch per step
    epochsPerFrame: 16,  // Epochs per animation frame
    showGrokking: true,  // Track grokking transition
    useWorker: true,     // Use Web Worker for training
  },
  // Grid visualization
  // 64 hidden neurons displayed as 8×8 grid centered in 16×16 display
  // Each neuron occupies a 2×2 block of grid cells
  grid: {
    rows: 16,
    cols: 16,
    neuronRows: 8,       // Actual hidden layer is 8×8 = 64 neurons
    neuronCols: 8,
    baseSpacing: 38,     // Larger spacing for better visibility
    referenceSize: 800,  // Reference canvas size for scaling
  },
  // Test case animation - fast, continuous flow
  testAnimation: {
    testDuration: 0.8,       // Total seconds per test (fast bam bam bam)
    inputToHidden: 0.2,      // Time for synapse to reach hidden layer
    hiddenToOutput: 0.2,     // Time for synapse to reach output
    holdAtPeak: 0.15,        // Hold at full size before shrinking
    holdResult: 0.25,        // Brief pause showing result before reset
    maxActiveNeurons: 8,     // Only show top N most active neurons
  },
  // Tron-style synapse visuals
  synapse: {
    trailLength: 0.25,       // Length of glowing trail (0-1)
    headSize: 5,             // Size of bright leading edge
    trailWidth: 2,           // Width of the trail
    glowSize: 12,            // Outer glow radius
    coreAlpha: 0.3,          // Alpha of persistent core line after head passes
  },
  // Neuron activation animation
  neuron: {
    minScale: 0.15,          // Scale when inactive (tiny dot)
    maxScale: 1.2,           // Scale when fully activated (slightly larger)
    growSpeed: 25,           // How fast neurons grow (much faster to reach full size)
    shrinkSpeed: 8,          // How fast neurons shrink
    baseSize: 8,             // Bigger base size for neurons
  },
  // Colors
  colors: {
    neuronIdle: '#0a0',
    neuronActive: '#0f0',
    neuronBright: '#fff',
    text: '#0f0',
    testCase: 'rgba(0, 255, 0, 0.3)',
  },
};

/**
 * Day 19 Demo
 * 
 * Main game class for Day 19, creating a grokking neural network visualization
 * that learns modular arithmetic. Features 16×16 grid visualization of
 * hidden layer activations.
 * 
 * @class Day19Demo
 * @extends {Game}
 */
class Day19Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.background;
  }

  init() {
    super.init();
    
    // Initialize Factored Network (Google's grokking architecture)
    console.log('[Day19] Creating FactoredNetwork...');
    const startTime = performance.now();
    
    try {
      this.network = new FactoredNetwork(CONFIG.network);
      console.log(`[Day19] Network created in ${(performance.now() - startTime).toFixed(1)}ms`);
    } catch (err) {
      console.error('[Day19] Failed to create network:', err);
      return;
    }
    
    // Generate datasets using Google's methodology
    const { nTokens, symmetric, trainFraction } = CONFIG.network;
    const allData = generateAllPairs(nTokens, symmetric);
    const split = splitData(allData, trainFraction);
    this.trainData = split.train;
    this.testData = split.test;
    console.log(`Generated ${allData.length} pairs (symmetric=${symmetric}): ${this.trainData.length} train, ${this.testData.length} test`);
    
    // Training state
    this.epoch = 0;
    this.trainAccuracy = 0;
    this.testAccuracy = 0;
    this.trainLoss = 0;
    this.testLoss = 0;
    
    // Grokking tracking
    this.grokkingDetected = false;
    this.grokkingEpoch = -1;
    this.accuracyHistory = [];
    
    // Neuron mapper: maps 64 hidden neurons to 256 grid cells, 67 outputs to 16 rows
    this.neuronMapper = new NeuronMapper(
      CONFIG.network.hiddenSize,
      CONFIG.network.nTokens,
      CONFIG.grid.rows,
      CONFIG.grid.cols
    );

    // Current test case for visualization
    this.currentTestCase = null;
    this.testCaseIndex = 0;

    // Test case animation - continuous flow
    this.testTime = 0;           // Time within current test (0 to testDuration)
    this.testRunning = false;    // Whether a test is currently animating

    // Store actual activations for current test
    this.currentHiddenActivations = null; // Float32Array of 64 values
    this.currentOutputActivations = null; // Float32Array of 67 values
    this.currentPrediction = null;
    this.activeHiddenNeurons = []; // Top N most active neuron indices
    this.activeGridCells = [];    // Grid cells for active neurons (for rendering)

    // Preloaded next test case (prepared while current one animates)
    this.nextTestCase = null;
    this.nextHiddenActivations = null;
    this.nextActiveNeurons = [];
    this.nextPrediction = null;

    // Scale factor for responsive sizing
    const minDim = Math.min(this.width, this.height);
    this.scale = minDim / CONFIG.grid.referenceSize;
    this.gridSpacing = CONFIG.grid.baseSpacing * this.scale;

    // Synapse animation
    this.synapseAnimationTime = 0;
    this.outputFlashes = new Map(); // Track flash effects on output neurons
    this.gridFlashes = new Map(); // Track flash effects on grid neurons

    // Track which neurons are currently active in the visualization
    this.activatedGridNeurons = new Set(); // Grid neurons that have been activated
    this.activatedOutputNeurons = new Set(); // Output neurons that have been activated

    // Synapse path data for current test (populated by forward pass)
    this.inputSynapseTargets = []; // Grid cell indices to send input synapses to
    this.outputSynapseTargets = []; // {from: gridIdx, to: outputRow} pairs
    
    // Grok mode - rainbow colors when model achieves high test accuracy
    this.grokMode = 0; // 0 = green, 1 = full rainbow (smooth transition)
    this.grokThreshold = 0.6; // Test accuracy threshold to trigger grok mode (90%)
    
    // Cached output neurons (avoid creating new objects every frame)
    this.outputNeurons = [];
    this.outputNeuronsInitialized = false;
    
    // Animation time for stateless animations
    this.animTime = 0;
    
    // Cache forward pass results to avoid multiple calls
    this.cachedOutput = null;
    this.cachedPrediction = null;
    
    // Initialize with a forward pass so grid shows something immediately
    if (this.trainData.length > 0) {
      const sample = this.trainData[0];
      this.network.forward(sample.a, sample.b);
    }
    
    // Grid positioning
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;
    
    // Web Worker for training (if enabled)
    this.useWorker = CONFIG.training.useWorker;
    this.workerReady = false;
    this.workerTraining = false;
    
    if (this.useWorker) {
      this.initWorker();
    }
    
    // Input dots for spawn animation
    this.inputDots = [];
    this.outputDots = [];
    
    // State machine for intro → training
    this.fsm = new StateMachine({
      initial: 'intro',
      context: this,
      states: {
        intro: {
          enter: () => this.startIntroAnimation(),
          update: (dt) => this.updateIntro(dt),
        },
        training: {
          enter: () => this.startTraining(),
          update: (dt) => this.updateTraining(dt),
        }
      }
    });
    
    // Training UI opacity (for fade-in)
    this.trainingOpacity = 0;
    this.synapseOpacity = 0; // Separate slower fade for synapses
    
    // Click to restart
    this.canvas.addEventListener('click', () => {
      this.restart();
    });
    
    // Debug: Press 'g' to toggle grok mode
    // Instead of just visuals, swap test set with train set so accuracy rises naturally
    this.grokModeOverride = false;
    this.originalTestData = null; // Store original test data for restoration
    window.addEventListener('keydown', (e) => {
      if (e.key === 'g' || e.key === 'G') {
        this.grokModeOverride = !this.grokModeOverride;
        
        if (this.grokModeOverride) {
          // Enable grok mode: swap test set with train set
          this.originalTestData = this.testData;
          this.testData = [...this.trainData]; // Use train data for testing
          this.grokMode = 1;
          console.log(`[DEBUG] Grok mode ON - test set = train set (${this.testData.length} examples)`);
          
          // Tell worker to do the same
          if (this.worker) {
            this.worker.postMessage({ type: 'grokMode', enabled: true });
            // Also sync weights so predictions are accurate
            this.worker.postMessage({ type: 'syncWeights' });
          }
        } else {
          // Disable grok mode: restore original test set
          if (this.originalTestData) {
            this.testData = this.originalTestData;
            this.originalTestData = null;
          }
          this.grokMode = 0;
          console.log(`[DEBUG] Grok mode OFF - original test set restored (${this.testData.length} examples)`);
          
          // Tell worker to restore
          if (this.worker) {
            this.worker.postMessage({ type: 'grokMode', enabled: false });
          }
        }
      }
    });
  }
  
  /**
   * Initialize Web Worker for training
   */
  initWorker() {
    try {
      // Create worker from separate file
      this.worker = new Worker(new URL('./day19.worker.js', import.meta.url), { type: 'module' });
      
      // Handle messages from worker
      this.worker.onmessage = (e) => {
        const { type } = e.data;
        
        switch (type) {
          case 'state':
            // Update local state from worker
            this.epoch = e.data.epoch;
            this.trainAccuracy = e.data.trainAccuracy;
            this.testAccuracy = e.data.testAccuracy;
            
            // Update network activations for visualization (256 values for 16x16 grid)
            if (this.network) {
              // The worker sends 256 grid-mapped activations
              this.network.hiddenActivations = new Float32Array(e.data.hiddenActivations);
              this.network.outputActivations = new Float32Array(e.data.outputActivations);
            }
            
            this.workerTraining = false;
            this.workerReady = true;
            break;
            
          case 'forward':
            // Update activations from forward pass
            if (this.network) {
              this.network.hiddenActivations = new Float32Array(e.data.hiddenActivations);
              this.network.outputActivations = new Float32Array(e.data.outputActivations);
            }
            this.cachedOutput = new Float32Array(e.data.outputActivations);
            this.cachedPrediction = e.data.prediction;
            break;
            
          case 'syncWeights':
            // Sync trained weights from worker to main thread network
            // Structured clone preserves Float32Array[] - assign directly
            if (this.network && e.data.weights) {
              const w = e.data.weights;
              this.network.embed = w.embed;     // Already Float32Array[]
              this.network.Whidden = w.Whidden; // Already Float32Array[]
              this.network.Wout = w.Wout;       // Already Float32Array[]
              console.log('[Main] Synced weights from worker');
              this._weightsSynced = true;
            }
            break;
        }
      };
      
      this.worker.onerror = (err) => {
        console.error('Worker error:', err);
        this.useWorker = false;
        this.workerReady = false;
      };
      
      // Initialize worker with network config
      // Worker generates its own data from the same config
      this.worker.postMessage({
        type: 'init',
        data: {
          config: CONFIG.network,
        }
      });
      
      console.log('Web Worker initialized for training');
    } catch (err) {
      console.warn('Failed to create Web Worker, falling back to main thread:', err);
      this.useWorker = false;
    }
  }
  
  /**
   * Start the intro spawn animation
   */
  startIntroAnimation() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const { rows, cols } = CONFIG.grid;
    
    // Track pending tweens - only transition when all complete
    this.pendingTweens = 0;
    
    // Calculate final positions
    this.gridOffsetX = this.width / 2 - (cols * this.gridSpacing) / 2;
    this.gridOffsetY = this.height / 2 - (rows * this.gridSpacing) / 2;
    
    // Create grid neurons at center with scale 0
    this.gridNeurons = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const targetX = this.gridOffsetX + col * this.gridSpacing;
        const targetY = this.gridOffsetY + row * this.gridSpacing;
        const neuron = new Neuron(centerX, centerY, 4 * this.scale);
        neuron.targetX = targetX;
        neuron.targetY = targetY;
        neuron.spawnScale = 0;
        this.gridNeurons.push(neuron);
        
        // Staggered spawn animation - fast wave from center
        const distFromCenter = Math.sqrt(
          Math.pow(col - cols/2, 2) + Math.pow(row - rows/2, 2)
        );
        const delay = distFromCenter * 0.04; // Much faster stagger
        
        this.pendingTweens++;
        Tweenetik.to(neuron, { 
          x: targetX, 
          y: targetY, 
          spawnScale: 1 
        }, 0.4, Easing.easeOutBack, { 
          delay: 0.1 + delay,
          onComplete: () => this.onTweenComplete()
        });
      }
    }
    
    // Create input dots at center
    const gridWidth = cols * this.gridSpacing;
    const leftX = centerX - gridWidth / 2 - 100 * this.scale;
    const rightX = centerX + gridWidth / 2 + 100 * this.scale;
    
    // Input A dots (7 bits) - faster spawn
    this.inputDots = [];
    for (let i = 0; i < 14; i++) { // 7 bits for A, 7 bits for B
      const dot = { x: centerX, y: centerY, spawnScale: 0 };
      this.inputDots.push(dot);
      this.pendingTweens++;
      Tweenetik.to(dot, { spawnScale: 1 }, 0.3, Easing.easeOutBack, { 
        delay: 0.05 + i * 0.01,
        onComplete: () => this.onTweenComplete()
      });
    }
    
    // Output dots (7 bits) - faster spawn
    this.outputDots = [];
    for (let i = 0; i < 7; i++) {
      const dot = { x: centerX, y: centerY, spawnScale: 0 };
      this.outputDots.push(dot);
      this.pendingTweens++;
      Tweenetik.to(dot, { spawnScale: 1 }, 0.3, Easing.easeOutBack, { 
        delay: 0.1 + i * 0.01,
        onComplete: () => this.onTweenComplete()
      });
    }
  }
  
  /**
   * Called when a tween completes - transition to training when all done
   */
  onTweenComplete() {
    this.pendingTweens--;
    if (this.pendingTweens <= 0 && this.fsm.is('intro')) {
      this.fsm.setState('training');
    }
  }
  
  /**
   * Update intro state
   */
  updateIntro(dt) {
    
  }
  
  /**
   * Start training state - fade in UI elements
   */
  startTraining() {
    this.trainingOpacity = 0;
    this.synapseOpacity = 0;
    // Fade in stats/input/output quickly
    Tweenetik.to(this, { trainingOpacity: 1 }, 0.8, Easing.easeOutQuad);
    // Fade in synapses more slowly with a delay
    Tweenetik.to(this, { synapseOpacity: 1 }, 1.5, Easing.easeInOutQuad, { delay: 0.5 });
  }
  
  /**
   * Update training state
   */
  updateTraining(dt) {
    // Update tweens (for fade-in)
    Tweenetik.updateAll(dt);
    // Normal training logic
    this.trainNetwork();
    // Note: synapseAnimationTime is now updated in updateTestCaseAnimation
  }
  
  restart() {
    // Create new FactoredNetwork
    this.network = new FactoredNetwork(CONFIG.network);

    // Generate datasets using Google's methodology
    const { nTokens, symmetric, trainFraction } = CONFIG.network;
    const allData = generateAllPairs(nTokens, symmetric);
    const split = splitData(allData, trainFraction);
    this.trainData = split.train;
    this.testData = split.test;

    this.epoch = 0;
    this.trainAccuracy = 0;
    this.testAccuracy = 0;
    this.grokkingDetected = false;
    this.grokkingEpoch = -1;
    this.accuracyHistory = [];
    this.grokMode = 0; // Reset rainbow mode
    this.grokModeOverride = false; // Re-enable auto detection
    this.outputNeuronsInitialized = false;
    this.outputNeuronsKeys = null;
    this.gridNeurons = null;
    this.animTime = 0;
    this.cachedOutput = null;
    this.cachedPrediction = null;
    this.trainingOpacity = 0; // Reset opacity for fade-in
    this.synapseOpacity = 0; // Reset synapse opacity

    // Reset test case animation state
    this.testTime = 0;
    this.testRunning = false;
    this.testCaseIndex = 0;
    this.currentTestCase = null;
    this.currentHiddenActivations = null;
    this.currentOutputActivations = null;
    this.currentPrediction = null;
    this.activeHiddenNeurons = [];
    this.activeGridCells = [];
    this.predictionRow = -1;
    this.targetRow = -1;
    this.nextTestCase = null;
    this.nextHiddenActivations = null;
    this.nextActiveNeurons = [];
    this.nextPrediction = null;

    // Reset worker if using
    if (this.useWorker && this.worker) {
      this.workerReady = false;
      this.workerTraining = false;
      this.worker.postMessage({
        type: 'reset',
        data: {
          config: CONFIG.network,
        }
      });
    }

    // Kill any active tweens and restart intro
    Tweenetik.killAll();
    this.fsm.setState('intro');
  }

  update(dt) {
    super.update(dt);
    
    // Calculate scale factor based on canvas size
    const minDim = Math.min(this.width, this.height);
    this.scale = minDim / CONFIG.grid.referenceSize;
    
    // Calculate dynamic grid spacing
    this.gridSpacing = CONFIG.grid.baseSpacing * this.scale;
    
    // Update grid offset
    this.gridOffsetX = this.width / 2 - (CONFIG.grid.cols * this.gridSpacing) / 2;
    this.gridOffsetY = this.height / 2 - (CONFIG.grid.rows * this.gridSpacing) / 2;
    
    // Update state machine
    this.fsm.update(dt);
    
    // Update animation time for stateless animations
    this.animTime += dt;

    // Update test case animation (discrete phases per test)
    this.updateTestCaseAnimation(dt);
  }

  /**
   * Update test case animation - continuous flow, ~1 second per test
   */
  updateTestCaseAnimation(dt) {
    if (!this.fsm.is('training')) return;

    const timing = CONFIG.testAnimation;

    // Start first test or advance time
    if (!this.testRunning) {
      this.startNewTestCase();
      return;
    }

    this.testTime += dt;

    // Test complete - start next one
    if (this.testTime >= timing.testDuration) {
      this.startNewTestCase();
    }
  }

  /**
   * Preload next test case (call while current one animates)
   */
  preloadNextTest() {
    if (this.testData.length === 0) return;

    // Pick next test case
    const nextIndex = (this.testCaseIndex + 1) % this.testData.length;
    this.nextTestCase = this.testData[nextIndex];

    // Run forward pass
    const { probs } = this.network.forward(
      this.nextTestCase.a,
      this.nextTestCase.b
    );

    this.nextHiddenActivations = new Float32Array(this.network._actualHiddenActivations);

    // Find prediction
    let maxIdx = 0;
    let maxVal = probs[0];
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > maxVal) {
        maxVal = probs[i];
        maxIdx = i;
      }
    }
    this.nextPrediction = maxIdx;

    // Find TOP N most active hidden neurons (not all of them)
    const maxNeurons = CONFIG.testAnimation.maxActiveNeurons;
    const activations = this.nextHiddenActivations;

    // Build array of {index, value} and sort by value
    const neurons = [];
    for (let i = 0; i < activations.length; i++) {
      if (activations[i] > 0.01) {
        neurons.push({ idx: i, val: activations[i] });
      }
    }
    neurons.sort((a, b) => b.val - a.val);

    // Take top N
    this.nextActiveNeurons = neurons.slice(0, maxNeurons).map(n => n.idx);
  }

  /**
   * Start a new test case (uses preloaded data if available)
   */
  startNewTestCase() {
    if (this.testData.length === 0) return;

    // Use preloaded data if available, otherwise load fresh
    if (this.nextTestCase) {
      this.testCaseIndex = (this.testCaseIndex + 1) % this.testData.length;
      this.currentTestCase = this.nextTestCase;
      this.currentHiddenActivations = this.nextHiddenActivations;
      this.currentPrediction = this.nextPrediction;
      this.activeHiddenNeurons = this.nextActiveNeurons;
      this.cachedPrediction = this.nextPrediction;
    } else {
      // First test - load directly
      this.testCaseIndex = 0;
      this.currentTestCase = this.testData[0];

      const { probs } = this.network.forward(
        this.currentTestCase.a,
        this.currentTestCase.b
      );

      this.currentHiddenActivations = new Float32Array(this.network._actualHiddenActivations);
      this.cachedOutput = probs;

      // Find prediction
      let maxIdx = 0;
      let maxVal = probs[0];
      for (let i = 1; i < probs.length; i++) {
        if (probs[i] > maxVal) {
          maxVal = probs[i];
          maxIdx = i;
        }
      }
      this.currentPrediction = maxIdx;
      this.cachedPrediction = maxIdx;

      // Get top N active neurons
      const maxNeurons = CONFIG.testAnimation.maxActiveNeurons;
      const neurons = [];
      for (let i = 0; i < this.currentHiddenActivations.length; i++) {
        if (this.currentHiddenActivations[i] > 0.01) {
          neurons.push({ idx: i, val: this.currentHiddenActivations[i] });
        }
      }
      neurons.sort((a, b) => b.val - a.val);
      this.activeHiddenNeurons = neurons.slice(0, maxNeurons).map(n => n.idx);
    }

    // Build grid cells list for active neurons
    // Pick random cell from each neuron's 2x2 block for visual variety
    this.activeGridCells = [];
    for (const neuronIdx of this.activeHiddenNeurons) {
      const cells = this.neuronMapper.getGridCells(neuronIdx);
      if (cells.length > 0) {
        const randomCell = cells[Math.floor(Math.random() * cells.length)];
        this.activeGridCells.push(randomCell);
      }
    }

    // Get output rows
    this.predictionRow = this.currentPrediction !== null
      ? this.neuronMapper.getOutputRow(this.currentPrediction)
      : -1;
    this.targetRow = this.currentTestCase
      ? this.neuronMapper.getOutputRow(this.currentTestCase.target)
      : -1;

    // Reset and start animation
    this.testTime = 0;
    this.testRunning = true;
    this.outputNeuronsInitialized = false;

    // Request worker prediction for accuracy
    if (this.useWorker && this.workerReady) {
      this.worker.postMessage({
        type: 'forward',
        data: { a: this.currentTestCase.a, b: this.currentTestCase.b }
      });
    }

    // Preload next test while this one animates
    this.preloadNextTest();
  }
  
  trainNetwork() {
    const { epochsPerFrame, batchSize } = CONFIG.training;
    const { nTokens } = CONFIG.network;
    
    // Use Web Worker if available
    if (this.useWorker && this.workerReady && !this.workerTraining) {
      this.workerTraining = true;
      this.worker.postMessage({
        type: 'train',
        data: { epochsPerFrame, batchSize }
      });
      
      // Track grokking from worker state (push every epoch for faster graph)
      this.accuracyHistory.push({
        epoch: this.epoch,
        train: this.trainAccuracy,
        test: this.testAccuracy,
      });
      
      if (this.accuracyHistory.length > 500) {
        this.accuracyHistory.shift();
      }
      
      // Grok mode detection - only when train is ~100% AND test is high
      // Skip if manual override is active (press G to toggle)
      if (!this.grokModeOverride) {
        const hasMemorized = this.trainAccuracy >= 0.95; // Train must be ~100%
        const hasGrokked = hasMemorized && this.testAccuracy >= this.grokThreshold;
        const targetGrok = hasGrokked ? 1 : 0;
        const wasGrokked = this.grokMode > 0.5;
        this.grokMode += (targetGrok - this.grokMode) * 0.05; // Smooth transition to rainbow
        
        // When grokking is first detected, sync weights and refresh
        if (!wasGrokked && this.grokMode > 0.5) {
          this.currentTestCase = null; // Force new test case
          this.cachedOutput = null;
          this.cachedPrediction = null;
          
          // Sync trained weights from worker so main thread predictions are accurate
          if (this.useWorker && this.workerReady && !this._weightsSynced) {
            this.worker.postMessage({ type: 'syncWeights' });
          }
        }
        
        // Sync weights periodically when train accuracy is 100% (every ~5 seconds)
        // This ensures main thread predictions are accurate during memorization phase
        if (hasMemorized && this.useWorker && this.workerReady) {
          if (!this._lastWeightSync || Date.now() - this._lastWeightSync > 5000) {
            this._lastWeightSync = Date.now();
            this.worker.postMessage({ type: 'syncWeights' });
          }
        }
      }
      
      return;
    }
    
    // Fallback: train on main thread
    if (this.useWorker) return; // Wait for worker to be ready
    
    // Main thread fallback using FactoredNetwork
    this.network.resetGradients();
    for (let e = 0; e < epochsPerFrame; e++) {
      // Process all training data each epoch (full batch)
      for (let i = 0; i < this.trainData.length; i++) {
        const ex = this.trainData[i];
        const { cache } = this.network.forward(ex.a, ex.b);
        this.network.backward(ex.target, cache);
      }
      this.network.applyAdamW(this.trainData.length);
      this.epoch++;
    }
    
    if (this.epoch % 20 === 0) {
      const trainSample = this.trainData.slice(0, Math.min(100, this.trainData.length));
      const testSample = this.testData.slice(0, Math.min(100, this.testData.length));
      this.trainAccuracy = calcAccuracy(this.network, trainSample);
      this.testAccuracy = calcAccuracy(this.network, testSample);
    }
    
    // Push every epoch for faster graph updates
    this.accuracyHistory.push({
      epoch: this.epoch,
      train: this.trainAccuracy,
      test: this.testAccuracy,
    });
    
    if (this.accuracyHistory.length > 500) {
      this.accuracyHistory.shift();
    }
    
    // Detect grokking: test accuracy suddenly jumps while train is already high
    if (!this.grokkingDetected && this.epoch > 100) {
      const recent = this.accuracyHistory.slice(-50);
      if (recent.length >= 50) {
        const oldTest = recent[0].test;
        const newTest = recent[recent.length - 1].test;
        // Grokking: test accuracy jumps significantly (>0.3) while train is high (>0.8)
        if (this.trainAccuracy > 0.8 && newTest - oldTest > 0.3) {
          this.grokkingDetected = true;
          this.grokkingEpoch = this.epoch;
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // Motion blur trail (lighter for better performance)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, w, h);
    
    // Update output neuron state FIRST (sets isSelected/isTarget flags)
    // This must run before drawSynapses so output targets are set
    this.updateOutputNeuronState();
    
    // Draw synapses (connections) first, behind neurons
    this.drawSynapses(ctx);
    
    // Draw grid of hidden neurons
    this.drawNeuronGrid(ctx);
    
    // Draw input/output neurons (uses pre-computed state)
    this.drawInputOutputNeurons(ctx);
    
    // Draw input/output/result around grid
    this.drawInputOutput(ctx);
    
    // Draw stats (compact)
    this.drawStats(ctx);
  }
  
  drawNeuronGrid(ctx) {
    const { rows, cols } = CONFIG.grid;
    const spacing = this.gridSpacing;
    const isIntro = this.fsm.is('intro');

    // Reinitialize grid neurons if spacing changed significantly (but not during intro)
    const spacingChanged = this._lastSpacing && Math.abs(this._lastSpacing - spacing) > 1;
    this._lastSpacing = spacing;

    // Initialize grid neurons cache if needed (skip during intro - already created)
    if (!this.gridNeurons || this.gridNeurons.length !== rows * cols || (spacingChanged && !isIntro)) {
      this.gridNeurons = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = this.gridOffsetX + col * spacing;
          const y = this.gridOffsetY + row * spacing;
          this.gridNeurons.push(new Neuron(x, y, 4 * this.scale));
        }
      }
    }

    // Build map of grid cell index -> synapse index for stagger calculation
    const activeMap = new Map();
    if (this.activeGridCells) {
      for (let i = 0; i < this.activeGridCells.length; i++) {
        activeMap.set(this.activeGridCells[i], i);
      }
    }

    // Calculate timing
    const timing = CONFIG.testAnimation;
    const neuronCfg = CONFIG.neuron;
    const t = this.testTime || 0;
    const inputDone = timing.inputToHidden;
    const outputDone = inputDone + timing.hiddenToOutput;
    const holdAtPeak = timing.holdAtPeak || 0;
    const shrinkStart = outputDone + holdAtPeak;  // Hold at full size before shrinking

    // Input phase progress
    const inputProgress = Math.min(1, t / inputDone);
    // Shrink phase (only after hold period)
    const shrinkProgress = t > shrinkStart ? (t - shrinkStart) / timing.holdResult : 0;

    // Update and render cached neurons
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridIdx = row * cols + col;
        const neuron = this.gridNeurons[gridIdx];

        // Update position (in case grid offset changed)
        neuron.x = this.gridOffsetX + col * spacing;
        neuron.y = this.gridOffsetY + row * spacing;

        // Check if this grid cell maps to a hidden neuron
        const isMapped = this.neuronMapper.isMapped(gridIdx);
        const synapseIdx = activeMap.get(gridIdx);
        const isActive = synapseIdx !== undefined;

        // Initialize scale tracking if needed
        if (neuron.currentScale === undefined) {
          neuron.currentScale = neuronCfg.minScale;
        }

        let targetScale = neuronCfg.minScale;

        if (isIntro) {
          targetScale = neuronCfg.minScale;
        } else if (!isMapped) {
          targetScale = neuronCfg.minScale;
        } else if (isActive && this.testRunning) {
          // Calculate staggered arrival for this specific synapse
          const stagger = (synapseIdx / this.activeGridCells.length) * 0.3;
          const arrivalProgress = Math.max(0, (inputProgress - stagger) / (1 - stagger));

          // Grow when synapse arrives
          if (arrivalProgress >= 0.98) {
            // Synapse arrived - grow to max
            // But shrink during result phase
            if (shrinkProgress > 0) {
              // Stagger shrink in reverse order
              const shrinkStagger = ((this.activeGridCells.length - 1 - synapseIdx) / this.activeGridCells.length) * 0.5;
              const localShrink = Math.max(0, (shrinkProgress - shrinkStagger) / (1 - shrinkStagger));
              targetScale = neuronCfg.maxScale - (neuronCfg.maxScale - neuronCfg.minScale) * Math.min(1, localShrink);
            } else {
              targetScale = neuronCfg.maxScale;
            }
          } else {
            targetScale = neuronCfg.minScale;
          }
        } else {
          targetScale = neuronCfg.minScale;
        }

        // Smooth scale transition
        const speed = targetScale > neuron.currentScale ? neuronCfg.growSpeed : neuronCfg.shrinkSpeed;
        neuron.currentScale += (targetScale - neuron.currentScale) * Math.min(1, speed * 0.016); // ~60fps

        neuron.activation = (neuron.currentScale - neuronCfg.minScale) / (neuronCfg.maxScale - neuronCfg.minScale);
        neuron.isActive = neuron.currentScale > neuronCfg.minScale + 0.1;

        // Pass scale to render
        neuron.renderGrid(ctx, CONFIG.colors, 1.0, neuron.activation, this.scale, this.grokMode, row, col, this.animTime, neuron.currentScale);
      }
    }
  }
  
  /**
   * Update output neuron state (positions, isSelected, isTarget)
   * Uses NeuronMapper to properly map 67 tokens to 16 display rows
   * Aligned with grid top, white color to differentiate
   */
  updateOutputNeuronState() {
    if (!this.currentTestCase) return;
    if (!this.fsm.is('training')) return;

    const gridCenterX = this.width / 2;
    const gridWidth = CONFIG.grid.cols * this.gridSpacing;

    // Position output column to the right of grid
    const outputX = gridCenterX + gridWidth / 2 + 50 * this.scale;
    const output = this.cachedOutput || this.currentOutputActivations;
    const prediction = this.cachedPrediction ?? this.currentPrediction;

    const displayRows = 16;

    // Align with grid top (same Y start as grid)
    const outputSpacing = this.gridSpacing;
    const outputStartY = this.gridOffsetY;

    // Initialize output neurons if needed
    if (!this.outputNeurons || this.outputNeurons.length !== displayRows) {
      this.outputNeurons = [];
      for (let i = 0; i < displayRows; i++) {
        const outputY = outputStartY + i * outputSpacing;
        this.outputNeurons.push(new Neuron(outputX, outputY, 4 * this.scale));
      }
    }

    // Use mapper to get display rows for prediction and target
    const predictionRow = prediction !== null && prediction !== undefined
      ? this.neuronMapper.getOutputRow(prediction) : -1;
    const targetRow = this.currentTestCase.target !== undefined
      ? this.neuronMapper.getOutputRow(this.currentTestCase.target) : -1;

    // Compute max activation per display row (for brightness)
    const rowActivations = new Float32Array(displayRows);
    if (output) {
      for (let token = 0; token < output.length; token++) {
        const row = this.neuronMapper.getOutputRow(token);
        if (output[token] > rowActivations[row]) {
          rowActivations[row] = output[token];
        }
      }
    }

    // Update neuron states (positions and flags)
    for (let i = 0; i < displayRows; i++) {
      const neuron = this.outputNeurons[i];

      // Update position
      neuron.x = outputX;
      neuron.y = outputStartY + i * outputSpacing;

      // Set flags based on display row mapping
      neuron.isTarget = (i === targetRow);
      neuron.isSelected = (i === predictionRow);

      // Store activation for rendering
      neuron.activation = rowActivations[i];
    }
  }
  
  /**
   * Draw input and output neurons (left and right of grid)
   * Output neurons light up when synapses reach them in continuous flow
   */
  drawInputOutputNeurons(ctx) {
    if (!this.currentTestCase) return;
    if (!this.fsm.is('training')) return;
    if (this.trainingOpacity <= 0) return;
    if (!this.outputNeurons || this.outputNeurons.length === 0) return;

    ctx.save();
    ctx.globalAlpha = this.trainingOpacity;

    const displayRows = 16;
    const timing = CONFIG.testAnimation;
    const t = this.testTime || 0;

    // Output progress (starts after input phase)
    const inputDone = timing.inputToHidden;
    const outputProgress = t > inputDone ? Math.min(1, (t - inputDone) / timing.hiddenToOutput) : 0;

    // Use cachedPrediction (from worker with current weights) for accurate coloring
    const currentPrediction = this.cachedPrediction ?? this.currentPrediction;
    const actualPredictionRow = currentPrediction !== null && currentPrediction !== undefined
      ? this.neuronMapper.getOutputRow(currentPrediction)
      : -1;
    const actualTargetRow = this.targetRow;

    // Render each output neuron
    for (let i = 0; i < displayRows; i++) {
      const neuron = this.outputNeurons[i];

      // Calculate flash intensity based on output synapse progress
      let flashIntensity = 0;

      if (this.testRunning && outputProgress > 0) {
        const isPrediction = (i === actualPredictionRow);
        const isTarget = (i === actualTargetRow);

        if (isPrediction || isTarget) {
          // Stagger based on which output row
          const stagger = 0.3;
          const localProgress = Math.max(0, (outputProgress - stagger) / (1 - stagger));

          // Only light up WHEN synapse arrives (not before)
          flashIntensity = localProgress >= 0.98 ? 1.0 : 0;
        }
      }

      neuron.activation = flashIntensity;

      // Determine correct/error state for coloring
      const predictionMatchesTarget = actualPredictionRow === actualTargetRow;
      const isPrediction = (i === actualPredictionRow);
      const isTarget = (i === actualTargetRow);

      // Reset states
      neuron.isError = false;
      neuron.isCorrect = false;

      if (flashIntensity > 0.1) {
        if (predictionMatchesTarget && isPrediction) {
          // Correct prediction - show green
          neuron.isCorrect = true;
        } else if (!predictionMatchesTarget) {
          if (isPrediction) {
            // Wrong prediction - show red
            neuron.isError = true;
          } else if (isTarget) {
            // This was the correct answer - show green
            neuron.isCorrect = true;
          }
        }
      }

      neuron.renderOutput(ctx, CONFIG.colors, flashIntensity, this.scale, this.grokMode);
    }

    ctx.restore();
  }
  
  /**
   * Draw a single Tron-style synapse with glowing trail
   */
  drawTronSynapse(ctx, startX, startY, endX, endY, progress, color = '#0ff', isPrimary = true) {
    if (progress <= 0) return;

    const syn = CONFIG.synapse;
    const scale = this.scale;

    // Calculate current head position
    const eased = 1 - Math.pow(1 - Math.min(1, progress), 2);
    const headX = startX + (endX - startX) * eased;
    const headY = startY + (endY - startY) * eased;

    // Trail start (behind the head)
    const trailStart = Math.max(0, eased - syn.trailLength);
    const trailX = startX + (endX - startX) * trailStart;
    const trailY = startY + (endY - startY) * trailStart;

    // Parse color for variations
    const isCyan = color === '#0ff';
    const r = isCyan ? 0 : 0;
    const g = isCyan ? 255 : 255;
    const b = isCyan ? 255 : 0;

    // === 1. OUTER GLOW (wide, faint) ===
    if (progress < 1) {
      const gradient = ctx.createLinearGradient(trailX, trailY, headX, headY);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.15)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.4)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = syn.glowSize * scale * (isPrimary ? 1 : 0.6);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();
    }

    // === 2. CORE TRAIL (bright, thin) ===
    if (progress < 1) {
      const gradient = ctx.createLinearGradient(trailX, trailY, headX, headY);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
      gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.6)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 1)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = syn.trailWidth * scale * (isPrimary ? 1 : 0.7);
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();
    }

    // === 3. PERSISTENT CORE (after head passes) ===
    if (progress > 0) {
      const coreEnd = Math.min(eased, 1);
      const coreX = startX + (endX - startX) * coreEnd;
      const coreY = startY + (endY - startY) * coreEnd;

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${syn.coreAlpha * (isPrimary ? 1 : 0.5)})`;
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(coreX, coreY);
      ctx.stroke();
    }

    // === 4. BRIGHT HEAD (leading edge) ===
    if (progress > 0 && progress < 1) {
      // Outer glow
      const glowGradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, syn.headSize * 2 * scale);
      glowGradient.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
      glowGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.6)`);
      glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(headX, headY, syn.headSize * 2 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Bright white core
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(headX, headY, syn.headSize * 0.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw synapses - Tron-style with glowing trails
   * Continuous flow from input → hidden → output
   */
  drawSynapses(ctx) {
    if (!this.currentTestCase) return;
    if (!this.fsm.is('training')) return;
    if (!this.testRunning) return;
    if (this.synapseOpacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.synapseOpacity;

    const gridCenterX = this.width / 2;
    const gridCenterY = this.height / 2;
    const gridWidth = CONFIG.grid.cols * this.gridSpacing;
    const { cols } = CONFIG.grid;
    const spacing = this.gridSpacing;

    const timing = CONFIG.testAnimation;
    const t = this.testTime;

    // Progress through each leg
    const inputDone = timing.inputToHidden;
    const inputProgress = Math.min(1, t / inputDone);
    const outputProgress = t > inputDone ? Math.min(1, (t - inputDone) / timing.hiddenToOutput) : 0;

    // Input positions
    const leftX = gridCenterX - gridWidth / 2 - 100 * this.scale;
    const inputAX = leftX;
    const inputAY = gridCenterY - 40 * this.scale;
    const inputBX = leftX;
    const inputBY = gridCenterY + 40 * this.scale;

    // Output position
    const outputX = gridCenterX + gridWidth / 2 + 50 * this.scale;
    const outputSpacing = this.gridSpacing;
    const displayRows = 16;
    const outputStartY = this.gridOffsetY; // Align with grid top

    // === DRAW INPUT → HIDDEN SYNAPSES ===
    if (inputProgress > 0 && this.activeGridCells.length > 0) {
      for (let i = 0; i < this.activeGridCells.length; i++) {
        const gridIdx = this.activeGridCells[i];
        const gridRow = Math.floor(gridIdx / cols);
        const gridCol = gridIdx % cols;
        const targetX = this.gridOffsetX + gridCol * spacing;
        const targetY = this.gridOffsetY + gridRow * spacing;

        // Alternate between input A and B
        const isA = i % 2 === 0;
        const startX = isA ? inputAX : inputBX;
        const startY = isA ? inputAY : inputBY;

        // Stagger for visual interest
        const stagger = (i / this.activeGridCells.length) * 0.3;
        const localProgress = Math.max(0, (inputProgress - stagger) / (1 - stagger));

        this.drawTronSynapse(ctx, startX, startY, targetX, targetY, localProgress, '#0ff', true);
      }
    }

    // === DRAW HIDDEN → OUTPUT SYNAPSES ===
    if (outputProgress > 0 && this.activeGridCells.length > 0) {
      // Use cachedPrediction for accurate targeting (worker has current weights)
      const currentPred = this.cachedPrediction ?? this.currentPrediction;
      const predRow = currentPred !== null && currentPred !== undefined
        ? this.neuronMapper.getOutputRow(currentPred)
        : -1;
      const targRow = this.targetRow;

      for (let i = 0; i < this.activeGridCells.length; i++) {
        const gridIdx = this.activeGridCells[i];
        const gridRow = Math.floor(gridIdx / cols);
        const gridCol = gridIdx % cols;
        const fromX = this.gridOffsetX + gridCol * spacing;
        const fromY = this.gridOffsetY + gridRow * spacing;

        // Draw to prediction row (primary, bright cyan)
        if (predRow >= 0) {
          const toX = outputX;
          const toY = outputStartY + predRow * outputSpacing;

          const stagger = (i / this.activeGridCells.length) * 0.3;
          const localProgress = Math.max(0, (outputProgress - stagger) / (1 - stagger));

          this.drawTronSynapse(ctx, fromX, fromY, toX, toY, localProgress, '#0ff', true);
        }

        // Draw to target row if different (secondary, dimmer green)
        if (targRow >= 0 && targRow !== predRow) {
          const toX = outputX;
          const toY = outputStartY + targRow * outputSpacing;

          const stagger = (i / this.activeGridCells.length) * 0.3;
          const localProgress = Math.max(0, (outputProgress - stagger) / (1 - stagger));

          this.drawTronSynapse(ctx, fromX, fromY, toX, toY, localProgress, '#0f0', false);
        }
      }
    }

    ctx.restore();
  }
  
  drawInputOutput(ctx) {
    if (!this.currentTestCase) return;
    if (!this.fsm.is('training')) return; // Only show during training
    if (this.trainingOpacity <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.trainingOpacity;
    
    const { text, neuronActive, neuronBright } = CONFIG.colors;
    // Use a, b directly (new format) or fall back to original array
    const aOrig = this.currentTestCase.a ?? this.currentTestCase.original?.[0] ?? 0;
    const bOrig = this.currentTestCase.b ?? this.currentTestCase.original?.[1] ?? 0;
    const target = this.currentTestCase.target;
    // Use cached prediction (from worker) - main thread network has stale weights!
    const prediction = this.cachedPrediction ?? this.network.predict(aOrig, bOrig);
    const correct = prediction === target;
    
    const gridCenterX = this.width / 2;
    const gridCenterY = this.height / 2;
    const gridWidth = CONFIG.grid.cols * this.gridSpacing;
    const gridHeight = CONFIG.grid.rows * this.gridSpacing;
    
    // All positions and sizes scaled
    const leftX = gridCenterX - gridWidth / 2 - 100 * this.scale;
    const rightX = gridCenterX + gridWidth / 2 + 150 * this.scale;
    const dotSize = 4 * this.scale;
    const dotSpacing = 18 * this.scale;
    const dotsPerRow = 10;
    
    // Draw input 'a' as dots on left side (top)
    const aStartY = gridCenterY - 40 * this.scale;
    this.drawNumberAsDots(ctx, aOrig, leftX, aStartY, dotSize, dotSpacing, dotsPerRow, neuronActive);
    
    // Draw '+' symbol (scaled font)
    ctx.fillStyle = text;
    ctx.font = `bold ${Math.round(32 * this.scale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', leftX, gridCenterY);
    
    // Draw input 'b' as dots on left side (bottom)
    const bStartY = gridCenterY + 40 * this.scale;
    this.drawNumberAsDots(ctx, bOrig, leftX, bStartY, dotSize, dotSpacing, dotsPerRow, neuronActive);
    
    // Draw output 'target' as dots on right side
    this.drawNumberAsDots(ctx, target, rightX, gridCenterY, dotSize, dotSpacing, dotsPerRow, neuronBright);
    
    // Result text - left-aligned below the graph area
    const statsX = 40 * this.scale;
    const graphBottomY = 40 * this.scale + 22 * this.scale * 6 + 60 * this.scale; // Below graph
    const resultY = graphBottomY + 30 * this.scale;
    
    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.round(14 * this.scale)}px monospace`;
    ctx.fillStyle = text;
    
    // Input sum
    const sum = aOrig + bOrig;
    ctx.fillText(`${aOrig} + ${bOrig} = ${sum}`, statsX, resultY);
    
    // Mod operation
    ctx.font = `${Math.round(12 * this.scale)}px monospace`;
    ctx.fillText(`mod ${CONFIG.network.nTokens} = ${target}`, statsX, resultY + 18 * this.scale);
    
    // Prediction (with color)
    ctx.font = `bold ${Math.round(12 * this.scale)}px monospace`;
    ctx.fillStyle = correct ? '#0ff' : '#f00';
    ctx.fillText(`Predicted: ${prediction} ${correct ? '✓' : '✗'}`, statsX, resultY + 36 * this.scale);
    
    ctx.restore();
  }
  
  /**
   * Draw a number as dots representing binary representation
   * Each bit position gets a dot (1 = bright dot, 0 = dim/empty)
   */
  drawNumberAsDots(ctx, number, centerX, centerY, dotSize, spacing, dotsPerRow, color) {
    // Calculate bits needed based on mod (outputSize)
    // mod 8 needs 3 bits (0-7), mod 16 needs 4 bits (0-15), mod 97 needs 7 bits (0-96)
    const mod = CONFIG.network.nTokens;
    const bits = Math.max(1, Math.ceil(Math.log2(mod))); // Exact bits needed for values 0 to mod-1
    
    const binary = [];
    let temp = number;
    for (let i = bits - 1; i >= 0; i--) {
      const bit = (temp >> i) & 1;
      binary.push(bit);
    }
    
    // Calculate layout (arrange in rows)
    const totalRows = Math.ceil(bits / dotsPerRow);
    const startY = centerY - ((totalRows - 1) * spacing) / 2;
    
    ctx.globalAlpha = 1;
    
    for (let i = 0; i < bits; i++) {
      const bit = binary[i];
      const row = Math.floor(i / dotsPerRow);
      const col = i % dotsPerRow;
      
      // Center the dots horizontally
      const dotsInRow = Math.min(dotsPerRow, bits - row * dotsPerRow);
      const rowWidth = (dotsInRow - 1) * spacing;
      const x = centerX - rowWidth / 2 + col * spacing;
      const y = startY + row * spacing;
      
      // Use Neuron class for binary dots
      const neuron = new Neuron(x, y, dotSize);
      neuron.isActive = (bit === 1);
      neuron.activation = bit === 1 ? 1.0 : 0.0;
      neuron.render(ctx, CONFIG.colors);
    }
  }
  
  drawStats(ctx) {
    // Only show stats during training
    if (!this.fsm.is('training')) return;
    if (this.trainingOpacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.trainingOpacity;

    const x = 40 * this.scale;
    const y = 40 * this.scale;
    const lineHeight = 22 * this.scale;

    // Gray text for stats (less prominent)
    ctx.fillStyle = '#888';
    ctx.font = `${Math.round(14 * this.scale)}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillText(`Epoch: ${this.epoch}`, x, y);
    ctx.fillText(`Train: ${(this.trainAccuracy * 100).toFixed(1)}%`, x, y + lineHeight);
    ctx.fillText(`Test: ${(this.testAccuracy * 100).toFixed(1)}%`, x, y + lineHeight * 2);

    // Show grok mode status
    if (this.grokMode > 0.5) {
      ctx.fillStyle = '#f0f'; // Magenta for rainbow mode
      ctx.fillText(`✨ GROKKED!`, x, y + lineHeight * 3);
    } else if (this.grokkingDetected) {
      ctx.fillStyle = '#0ff';
      ctx.fillText(`✓ GROKKING!`, x, y + lineHeight * 3);
    }
    
    // Draw compact accuracy graph (scaled) - more space below text
    if (this.accuracyHistory.length > 2) {
      const graphW = 150 * this.scale;
      const graphH = 50 * this.scale; // Taller graph
      const graphX = x;
      const graphY = y + lineHeight * 6; // More space between text and graph
      
      // Draw background panel for visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(graphX - 5, graphY - graphH - 5, graphW + 10, graphH + 10);
      
      // Draw border
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(graphX - 5, graphY - graphH - 5, graphW + 10, graphH + 10);
      
      // Draw 50% gridline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(graphX, graphY - graphH * 0.5);
      ctx.lineTo(graphX + graphW, graphY - graphH * 0.5);
      ctx.stroke();
      
      // Sample history for performance (every Nth point)
      const sampleRate = Math.max(1, Math.floor(this.accuracyHistory.length / 100));
      
      // Train accuracy line (green) - thicker and with glow
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2.5 * this.scale;
      ctx.shadowColor = '#0f0';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < this.accuracyHistory.length; i += sampleRate) {
        const point = this.accuracyHistory[i];
        const px = graphX + (i / this.accuracyHistory.length) * graphW;
        const py = graphY - point.train * graphH;
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      
      // Test accuracy line (cyan) - thicker and with glow
      ctx.strokeStyle = '#0ff';
      ctx.shadowColor = '#0ff';
      ctx.beginPath();
      first = true;
      for (let i = 0; i < this.accuracyHistory.length; i += sampleRate) {
        const point = this.accuracyHistory[i];
        const px = graphX + (i / this.accuracyHistory.length) * graphW;
        const py = graphY - point.test * graphH;
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Legend below graph
      ctx.font = `${Math.round(10 * this.scale)}px monospace`;
      ctx.fillStyle = '#0f0';
      ctx.fillText('Train', graphX, graphY + 12 * this.scale);
      ctx.fillStyle = '#0ff';
      ctx.fillText('Test', graphX + 50 * this.scale, graphY + 12 * this.scale);
    }
    
    ctx.restore();
  }
}

/**
 * Mount Day 19 into the provided canvas.
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {Day19Demo} returns.game - The game instance
 */
export default function day19(canvas) {
  const game = new Day19Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
