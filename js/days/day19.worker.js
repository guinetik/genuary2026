/**
 * Web Worker for Neural Network Training
 * Offloads heavy computation from main thread
 */

// Neural network implementation (copied to worker since modules aren't easily shared)
class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize, learningRate = 0.001, weightDecay = 0) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    this.learningRate = learningRate;
    this.weightDecay = weightDecay;
    
    // Xavier initialization for weights
    const scale1 = Math.sqrt(2.0 / inputSize);
    const scale2 = Math.sqrt(2.0 / hiddenSize);
    
    // Input → Hidden weights
    this.weights1 = [];
    for (let i = 0; i < inputSize; i++) {
      this.weights1[i] = new Float32Array(hiddenSize);
      for (let j = 0; j < hiddenSize; j++) {
        this.weights1[i][j] = (Math.random() - 0.5) * 2 * scale1;
      }
    }
    
    // Hidden → Output weights
    this.weights2 = [];
    for (let i = 0; i < hiddenSize; i++) {
      this.weights2[i] = new Float32Array(outputSize);
      for (let j = 0; j < outputSize; j++) {
        this.weights2[i][j] = (Math.random() - 0.5) * 2 * scale2;
      }
    }
    
    // Biases
    this.bias1 = new Float32Array(hiddenSize);
    this.bias2 = new Float32Array(outputSize);
    
    // Cache for activations
    this.hiddenActivations = new Float32Array(hiddenSize);
    this.outputActivations = new Float32Array(outputSize);
  }
  
  forward(input) {
    // Hidden layer: ReLU activation
    for (let j = 0; j < this.hiddenSize; j++) {
      let sum = this.bias1[j];
      for (let i = 0; i < this.inputSize; i++) {
        sum += input[i] * this.weights1[i][j];
      }
      this.hiddenActivations[j] = Math.max(0, sum); // ReLU
    }
    
    // Output layer: Softmax
    let maxVal = -Infinity;
    for (let j = 0; j < this.outputSize; j++) {
      let sum = this.bias2[j];
      for (let i = 0; i < this.hiddenSize; i++) {
        sum += this.hiddenActivations[i] * this.weights2[i][j];
      }
      this.outputActivations[j] = sum;
      if (sum > maxVal) maxVal = sum;
    }
    
    // Stable softmax
    let expSum = 0;
    for (let j = 0; j < this.outputSize; j++) {
      this.outputActivations[j] = Math.exp(this.outputActivations[j] - maxVal);
      expSum += this.outputActivations[j];
    }
    for (let j = 0; j < this.outputSize; j++) {
      this.outputActivations[j] /= expSum;
    }
    
    return this.outputActivations;
  }
  
  backward(input, target, output) {
    // Output layer gradients (cross-entropy + softmax derivative = output - target)
    const outputGrad = new Float32Array(this.outputSize);
    for (let j = 0; j < this.outputSize; j++) {
      outputGrad[j] = output[j] - target[j];
    }
    
    // Hidden layer gradients
    const hiddenGrad = new Float32Array(this.hiddenSize);
    for (let i = 0; i < this.hiddenSize; i++) {
      let grad = 0;
      for (let j = 0; j < this.outputSize; j++) {
        grad += outputGrad[j] * this.weights2[i][j];
      }
      // ReLU derivative
      hiddenGrad[i] = this.hiddenActivations[i] > 0 ? grad : 0;
    }
    
    // Accumulate gradients (don't apply yet)
    if (!this.gradW2) {
      this.gradW2 = this.weights2.map(row => new Float32Array(row.length));
      this.gradB2 = new Float32Array(this.outputSize);
      this.gradW1 = this.weights1.map(row => new Float32Array(row.length));
      this.gradB1 = new Float32Array(this.hiddenSize);
      this.gradCount = 0;
    }
    
    // Accumulate weights2 gradients
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        this.gradW2[i][j] += outputGrad[j] * this.hiddenActivations[i];
      }
    }
    
    // Accumulate bias2 gradients
    for (let j = 0; j < this.outputSize; j++) {
      this.gradB2[j] += outputGrad[j];
    }
    
    // Accumulate weights1 gradients
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        this.gradW1[i][j] += hiddenGrad[j] * input[i];
      }
    }
    
    // Accumulate bias1 gradients
    for (let j = 0; j < this.hiddenSize; j++) {
      this.gradB1[j] += hiddenGrad[j];
    }
    
    this.gradCount++;
  }
  
  /**
   * Apply gradients with optional weight decay (for two-phase training)
   * NO AVERAGING - raw gradient sum for maximum noise/instability
   */
  applyGradients(useWeightDecay = true) {
    if (!this.gradCount || this.gradCount === 0) return;
    
    const lr = this.learningRate;
    const wd = useWeightDecay ? this.weightDecay : 0;
    // NO SCALE - raw gradients, not averaged!
    
    // Apply raw gradients with conditional weight decay
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        this.weights2[i][j] -= lr * (this.gradW2[i][j] + wd * this.weights2[i][j]);
        this.gradW2[i][j] = 0;
      }
    }
    
    for (let j = 0; j < this.outputSize; j++) {
      this.bias2[j] -= lr * this.gradB2[j];
      this.gradB2[j] = 0;
    }
    
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        this.weights1[i][j] -= lr * (this.gradW1[i][j] + wd * this.weights1[i][j]);
        this.gradW1[i][j] = 0;
      }
    }
    
    for (let j = 0; j < this.hiddenSize; j++) {
      this.bias1[j] -= lr * this.gradB1[j];
      this.gradB1[j] = 0;
    }
    
    this.gradCount = 0;
  }
  
  /**
   * Apply AVERAGED gradients - standard mini-batch SGD for grokking
   * Divides accumulated gradients by batch size before applying
   */
  applyGradientsAveraged(batchSize, useWeightDecay = true) {
    if (!this.gradCount || this.gradCount === 0) return;
    
    const lr = this.learningRate;
    const wd = useWeightDecay ? this.weightDecay : 0;
    const scale = 1.0 / batchSize; // Average the gradients
    
    // Apply averaged gradients with conditional weight decay
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        this.weights2[i][j] -= lr * (this.gradW2[i][j] * scale + wd * this.weights2[i][j]);
        this.gradW2[i][j] = 0;
      }
    }
    
    for (let j = 0; j < this.outputSize; j++) {
      this.bias2[j] -= lr * this.gradB2[j] * scale;
      this.gradB2[j] = 0;
    }
    
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        this.weights1[i][j] -= lr * (this.gradW1[i][j] * scale + wd * this.weights1[i][j]);
        this.gradW1[i][j] = 0;
      }
    }
    
    for (let j = 0; j < this.hiddenSize; j++) {
      this.bias1[j] -= lr * this.gradB1[j] * scale;
      this.gradB1[j] = 0;
    }
    
    this.gradCount = 0;
  }
  
  /**
   * Initialize Adam optimizer state
   */
  initAdam() {
    if (this.adamInitialized) return;
    
    // First moment (mean of gradients)
    this.m_W1 = this.weights1.map(row => new Float32Array(row.length));
    this.m_B1 = new Float32Array(this.hiddenSize);
    this.m_W2 = this.weights2.map(row => new Float32Array(row.length));
    this.m_B2 = new Float32Array(this.outputSize);
    
    // Second moment (variance of gradients)
    this.v_W1 = this.weights1.map(row => new Float32Array(row.length));
    this.v_B1 = new Float32Array(this.hiddenSize);
    this.v_W2 = this.weights2.map(row => new Float32Array(row.length));
    this.v_B2 = new Float32Array(this.outputSize);
    
    this.adamT = 0; // Time step
    this.adamInitialized = true;
  }
  
  /**
   * AdamW optimizer - THE key to grokking!
   * Decoupled weight decay (applied directly to weights, not gradients)
   * @param {number} batchSize - Batch size for gradient averaging
   * @param {boolean} useWeightDecay - Whether to apply weight decay
   * @param {number} beta1 - First moment decay (default 0.9)
   * @param {number} beta2 - Second moment decay (default 0.98)
   * @param {number} epsilon - Small constant for numerical stability
   */
  applyAdamW(batchSize, useWeightDecay = true, beta1 = 0.9, beta2 = 0.98, epsilon = 1e-8) {
    if (!this.gradCount || this.gradCount === 0) return;
    
    this.initAdam();
    this.adamT++;
    
    const lr = this.learningRate;
    const wd = useWeightDecay ? this.weightDecay : 0;
    const scale = 1.0 / batchSize;
    
    // Bias correction factors
    const bc1 = 1 - Math.pow(beta1, this.adamT);
    const bc2 = 1 - Math.pow(beta2, this.adamT);
    
    // Update weights2 (hidden -> output)
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        const g = this.gradW2[i][j] * scale;
        
        // Update moments
        this.m_W2[i][j] = beta1 * this.m_W2[i][j] + (1 - beta1) * g;
        this.v_W2[i][j] = beta2 * this.v_W2[i][j] + (1 - beta2) * g * g;
        
        // Bias-corrected moments
        const m_hat = this.m_W2[i][j] / bc1;
        const v_hat = this.v_W2[i][j] / bc2;
        
        // AdamW update: gradient step + DECOUPLED weight decay
        this.weights2[i][j] -= lr * (m_hat / (Math.sqrt(v_hat) + epsilon) + wd * this.weights2[i][j]);
        this.gradW2[i][j] = 0;
      }
    }
    
    // Update bias2
    for (let j = 0; j < this.outputSize; j++) {
      const g = this.gradB2[j] * scale;
      this.m_B2[j] = beta1 * this.m_B2[j] + (1 - beta1) * g;
      this.v_B2[j] = beta2 * this.v_B2[j] + (1 - beta2) * g * g;
      const m_hat = this.m_B2[j] / bc1;
      const v_hat = this.v_B2[j] / bc2;
      this.bias2[j] -= lr * m_hat / (Math.sqrt(v_hat) + epsilon);
      this.gradB2[j] = 0;
    }
    
    // Update weights1 (input -> hidden)
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        const g = this.gradW1[i][j] * scale;
        this.m_W1[i][j] = beta1 * this.m_W1[i][j] + (1 - beta1) * g;
        this.v_W1[i][j] = beta2 * this.v_W1[i][j] + (1 - beta2) * g * g;
        const m_hat = this.m_W1[i][j] / bc1;
        const v_hat = this.v_W1[i][j] / bc2;
        this.weights1[i][j] -= lr * (m_hat / (Math.sqrt(v_hat) + epsilon) + wd * this.weights1[i][j]);
        this.gradW1[i][j] = 0;
      }
    }
    
    // Update bias1
    for (let j = 0; j < this.hiddenSize; j++) {
      const g = this.gradB1[j] * scale;
      this.m_B1[j] = beta1 * this.m_B1[j] + (1 - beta1) * g;
      this.v_B1[j] = beta2 * this.v_B1[j] + (1 - beta2) * g * g;
      const m_hat = this.m_B1[j] / bc1;
      const v_hat = this.v_B1[j] / bc2;
      this.bias1[j] -= lr * m_hat / (Math.sqrt(v_hat) + epsilon);
      this.gradB1[j] = 0;
    }
    
    this.gradCount = 0;
  }
  
  predict(input) {
    const output = this.forward(input);
    let maxIdx = 0;
    let maxVal = output[0];
    for (let i = 1; i < output.length; i++) {
      if (output[i] > maxVal) {
        maxVal = output[i];
        maxIdx = i;
      }
    }
    return maxIdx;
  }
  
  /**
   * Export network state for transfer to main thread
   */
  exportState() {
    return {
      weights1: this.weights1.map(w => Array.from(w)),
      weights2: this.weights2.map(w => Array.from(w)),
      bias1: Array.from(this.bias1),
      bias2: Array.from(this.bias2),
      hiddenActivations: Array.from(this.hiddenActivations),
      outputActivations: Array.from(this.outputActivations),
    };
  }
  
  /**
   * Import network state from main thread
   */
  importState(state) {
    for (let i = 0; i < this.inputSize; i++) {
      this.weights1[i] = new Float32Array(state.weights1[i]);
    }
    for (let i = 0; i < this.hiddenSize; i++) {
      this.weights2[i] = new Float32Array(state.weights2[i]);
    }
    this.bias1 = new Float32Array(state.bias1);
    this.bias2 = new Float32Array(state.bias2);
  }
}

/**
 * One-hot encode a target value
 */
function oneHot(target, size) {
  const arr = new Float32Array(size);
  arr[target] = 1;
  return arr;
}

/**
 * Calculate accuracy on a dataset
 */
function calculateAccuracy(network, data) {
  let correct = 0;
  for (const example of data) {
    const prediction = network.predict(example.input);
    if (prediction === example.target) correct++;
  }
  return correct / data.length;
}

// Worker state
let network = null;
let trainData = [];
let testData = [];
let epoch = 0;
let trainAccuracy = 0;
let testAccuracy = 0;
let isTraining = false;

// Two-phase grokking state
let phase = 1; // 1 = memorization (no weight decay), 2 = compression (with weight decay)
const PHASE1_THRESHOLD = 0.95; // Switch to phase 2 when train accuracy hits 95%

/**
 * Handle messages from main thread
 */
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'init':
      // Initialize network and data
      const { inputSize, hiddenSize, outputSize, learningRate, weightDecay } = data.config;
      network = new NeuralNetwork(inputSize, hiddenSize, outputSize, learningRate, weightDecay);
      
      // Convert inputs to Float32Array (postMessage may serialize typed arrays as objects)
      trainData = data.trainData.map(ex => ({
        ...ex,
        input: ex.input instanceof Float32Array ? ex.input : new Float32Array(Object.values(ex.input))
      }));
      testData = data.testData.map(ex => ({
        ...ex,
        input: ex.input instanceof Float32Array ? ex.input : new Float32Array(Object.values(ex.input))
      }));
      
      console.log(`[Worker] Init: inputSize=${inputSize}, trainData=${trainData.length}, testData=${testData.length}, inputLen=${trainData[0]?.input?.length}`);
      
      epoch = 0;
      trainAccuracy = 0;
      testAccuracy = 0;
      phase = 1; // Start in memorization phase (no weight decay)
      
      // Send initial state
      sendState();
      break;
      
    case 'train':
      // Train using AdamW optimizer (key to grokking!)
      if (!network || isTraining) return;
      
      isTraining = true;
      const { epochsPerFrame, batchSize = 512 } = data;
      
      for (let e = 0; e < epochsPerFrame; e++) {
        // Shuffle training data indices for each epoch
        const indices = [];
        for (let i = 0; i < trainData.length; i++) indices.push(i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        // Process in batches with AdamW optimizer
        for (let batchStart = 0; batchStart < trainData.length; batchStart += batchSize) {
          const batchEnd = Math.min(batchStart + batchSize, trainData.length);
          const actualBatchSize = batchEnd - batchStart;
          
          // Accumulate gradients over the batch
          for (let i = batchStart; i < batchEnd; i++) {
            const idx = indices[i];
            const example = trainData[idx];
            
            const output = new Float32Array(network.forward(example.input));
            const target = oneHot(example.target, network.outputSize);
            network.backward(example.input, target, output);
          }
          
          // AdamW update - weight decay from the START (like the Python impl)
          // No two-phase training - AdamW handles this properly
          network.applyAdamW(actualBatchSize, true);
        }
        
        epoch++;
      }
      
      // Calculate accuracies every frame
      const trainSample = trainData.slice(0, Math.min(500, trainData.length));
      const testSample = testData.slice(0, Math.min(500, testData.length));
      trainAccuracy = calculateAccuracy(network, trainSample);
      testAccuracy = calculateAccuracy(network, testSample);
      
      // Debug: log sample predictions every 1000 epochs
      if (epoch % 1000 === 0) {
        const testEx = testData[0];
        const trainEx = trainData[0];
        const testPred = network.predict(testEx.input);
        const trainPred = network.predict(trainEx.input);
        console.log(`[Debug] Epoch ${epoch}:`);
        console.log(`  Train[0]: (${trainEx.original}) → pred=${trainPred}, target=${trainEx.target}, correct=${trainPred === trainEx.target}`);
        console.log(`  Test[0]: (${testEx.original}) → pred=${testPred}, target=${testEx.target}, correct=${testPred === testEx.target}`);
        console.log(`  Test input sum: ${testEx.input.reduce((a,b) => a+b, 0)}, len: ${testEx.input.length}`);
      }
      
      // TWO-PHASE TRAINING: Switch to phase 2 when memorization is complete
      // Phase 1: No weight decay - allows pure overfitting/memorization
      // Phase 2: Weight decay kicks in - forces compression/generalization
      if (phase === 1 && trainAccuracy >= PHASE1_THRESHOLD) {
        phase = 2;
        console.log(`[GROK] Phase 2 started at epoch ${epoch} - weight decay now active`);
      }
      
      // Safety: if train accuracy drops too much in Phase 2, weight decay is too strong
      if (phase === 2 && trainAccuracy < 0.5) {
        console.warn(`[GROK] Train accuracy collapsed to ${(trainAccuracy*100).toFixed(1)}% - weight decay may be too strong`);
      }
      
      isTraining = false;
      sendState();
      break;
      
    case 'forward':
      // Run forward pass for visualization
      if (!network) return;
      network.forward(data.input);
      self.postMessage({
        type: 'forward',
        hiddenActivations: Array.from(network.hiddenActivations),
        outputActivations: Array.from(network.outputActivations),
        prediction: network.predict(data.input),
      });
      break;
      
    case 'reset':
      // Reset network
      if (network) {
        const cfg = data.config;
        network = new NeuralNetwork(cfg.inputSize, cfg.hiddenSize, cfg.outputSize, cfg.learningRate, cfg.weightDecay);
        
        // Convert inputs to Float32Array (postMessage may serialize typed arrays as objects)
        trainData = data.trainData.map(ex => ({
          ...ex,
          input: ex.input instanceof Float32Array ? ex.input : new Float32Array(Object.values(ex.input))
        }));
        testData = data.testData.map(ex => ({
          ...ex,
          input: ex.input instanceof Float32Array ? ex.input : new Float32Array(Object.values(ex.input))
        }));
        
        phase = 1; // Reset to memorization phase
        epoch = 0;
        trainAccuracy = 0;
        testAccuracy = 0;
        sendState();
      }
      break;
  }
};

/**
 * Send current state to main thread
 */
function sendState() {
  self.postMessage({
    type: 'state',
    epoch,
    trainAccuracy,
    testAccuracy,
    phase, // 1 = memorization, 2 = compression (grokking)
    hiddenActivations: Array.from(network.hiddenActivations),
    outputActivations: Array.from(network.outputActivations),
    weights1: network.weights1.map(w => Array.from(w)),
    weights2: network.weights2.map(w => Array.from(w)),
  });
}
