// GPU.js will be loaded from CDN for web mode (no native dependencies)
let GPU = null;
let GPUReady = false;

if (typeof window !== 'undefined') {
  // Load GPU.js from CDN - web mode only (no native compilation needed)
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/gpu.js@2.16.0/dist/gpu-browser.min.js';
  script.onload = () => {
    // GPU.js v2.x exposes GPU as a constructor function
    // Check both window.GPU and direct GPU assignment
    if (window.GPU) {
      // GPU.js v2.x: window.GPU is the constructor
      GPU = window.GPU;
      GPUReady = true;
      console.log('GPU.js loaded from CDN');
    } else {
      console.warn('GPU.js loaded but GPU constructor not found, using CPU fallback');
      GPUReady = true; // Mark as ready so we don't keep retrying
    }
  };
  script.onerror = () => {
    console.warn('Failed to load GPU.js from CDN, using CPU fallback');
    GPUReady = true; // Mark as ready so we don't keep retrying
  };
  document.head.appendChild(script);
} else {
  GPUReady = true; // Not in browser, skip GPU
}

/**
 * GPU-Accelerated Neural Network with ReLU activation
 */
class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize, learningRate, weightDecay = 0) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    this.learningRate = learningRate;
    this.weightDecay = weightDecay; // L2 regularization coefficient
    
    // Initialize weights with Xavier initialization (using Float32Array)
    this.weights1 = this.initWeights(inputSize, hiddenSize);
    this.bias1 = new Float32Array(hiddenSize);
    this.weights2 = this.initWeights(hiddenSize, outputSize);
    this.bias2 = new Float32Array(outputSize);
    
    // Store activations for visualization
    this.hiddenActivations = new Float32Array(hiddenSize);
    
    // Initialize GPU if available
    this.gpu = null;
    this.useGPU = false;
    this.initGPU();
  }
  
  initGPU() {
    // Wait for GPU.js to load if not available yet
    if (!GPUReady) {
      // Will initialize on next frame
      setTimeout(() => this.initGPU(), 100);
      return;
    }
    
    // Check if GPU.js is available (could be window.GPU or just GPU)
    const GPUCtor = GPU || (typeof window !== 'undefined' && window.GPU);
    
    if (!GPUCtor || typeof GPUCtor !== 'function') {
      this.useGPU = false;
      return;
    }
    
    try {
      // Try webgl2 first, fallback to webgl
      let gpuMode = 'webgl2';
      try {
        this.gpu = new GPUCtor({ mode: gpuMode });
      } catch (e) {
        // Fallback to webgl if webgl2 not supported
        try {
          gpuMode = 'webgl';
          this.gpu = new GPUCtor({ mode: gpuMode });
        } catch (e2) {
          // If both fail, use CPU
          throw e2;
        }
      }
      
      // Create GPU kernels for forward pass
      // Input to hidden layer
      this.gpuForwardHidden = this.gpu.createKernel(function(input, weights, bias) {
        let sum = bias[this.thread.y];
        for (let i = 0; i < this.constants.inputSize; i++) {
          sum += input[i] * weights[i][this.thread.y];
        }
        return Math.max(0, sum); // ReLU
      })
      .setConstants({ inputSize: this.inputSize })
      .setOutput([this.hiddenSize])
      .setImmutable(true);
      
      // Hidden to output layer
      this.gpuForwardOutput = this.gpu.createKernel(function(hidden, weights, bias) {
        let sum = bias[this.thread.y];
        for (let i = 0; i < this.constants.hiddenSize; i++) {
          sum += hidden[i] * weights[i][this.thread.y];
        }
        return sum; // Raw logits
      })
      .setConstants({ hiddenSize: this.hiddenSize })
      .setOutput([this.outputSize])
      .setImmutable(true);
      
      // GPU kernel for backward pass - hidden error
      this.gpuBackwardHidden = this.gpu.createKernel(function(outputError, weights, hiddenActivations) {
        let sum = 0;
        for (let i = 0; i < this.constants.outputSize; i++) {
          sum += outputError[i] * weights[this.thread.y][i];
        }
        const reluDeriv = hiddenActivations[this.thread.y] > 0 ? 1 : 0;
        return sum * reluDeriv;
      })
      .setConstants({ outputSize: this.outputSize })
      .setOutput([this.hiddenSize])
      .setImmutable(true);
      
      this.useGPU = true;
      console.log('GPU.js initialized successfully');
    } catch (e) {
      console.warn('GPU.js not available, using CPU fallback:', e);
      this.useGPU = false;
    }
  }
  
  initWeights(rows, cols) {
    // Use Float32Array for better performance and GPU.js compatibility
    const weights = [];
    const scale = Math.sqrt(2.0 / (rows + cols));
    for (let i = 0; i < rows; i++) {
      weights[i] = new Float32Array(cols);
      for (let j = 0; j < cols; j++) {
        weights[i][j] = (Math.random() * 2 - 1) * scale;
      }
    }
    return weights;
  }
  
  relu(x) {
    return Math.max(0, x);
  }
  
  reluDerivative(x) {
    return x > 0 ? 1 : 0;
  }
  
  forward(input) {
    let hidden, logits;
    
    if (this.useGPU) {
      // GPU-accelerated forward pass
      // GPU.js expects arrays, so we pass them directly
      try {
        // Input to hidden (GPU) - convert input to Float32Array if needed
        const inputArray = input instanceof Float32Array ? input : new Float32Array(input);
        const hiddenGPU = this.gpuForwardHidden(inputArray, this.weights1, this.bias1);
        hidden = new Float32Array(hiddenGPU);
        
        // Hidden to output (GPU)
        const logitsGPU = this.gpuForwardOutput(hidden, this.weights2, this.bias2);
        logits = new Float32Array(logitsGPU);
      } catch (e) {
        // Fallback to CPU if GPU fails
        console.warn('GPU forward pass failed, using CPU:', e);
        this.useGPU = false;
        // Fall through to CPU code
        hidden = new Float32Array(this.hiddenSize);
        for (let i = 0; i < this.hiddenSize; i++) {
          let sum = this.bias1[i];
          for (let j = 0; j < this.inputSize; j++) {
            sum += input[j] * this.weights1[j][i];
          }
          hidden[i] = this.relu(sum);
        }
        
        logits = new Float32Array(this.outputSize);
        for (let i = 0; i < this.outputSize; i++) {
          let sum = this.bias2[i];
          for (let j = 0; j < this.hiddenSize; j++) {
            sum += hidden[j] * this.weights2[j][i];
          }
          logits[i] = sum;
        }
      }
    } else {
      // CPU fallback
      hidden = new Float32Array(this.hiddenSize);
      for (let i = 0; i < this.hiddenSize; i++) {
        let sum = this.bias1[i];
        for (let j = 0; j < this.inputSize; j++) {
          sum += input[j] * this.weights1[j][i];
        }
        hidden[i] = this.relu(sum);
      }
      
      logits = new Float32Array(this.outputSize);
      for (let i = 0; i < this.outputSize; i++) {
        let sum = this.bias2[i];
        for (let j = 0; j < this.hiddenSize; j++) {
          sum += hidden[j] * this.weights2[j][i];
        }
        logits[i] = sum;
      }
    }
    
    // Store for visualization
    this.hiddenActivations = hidden;
    
    // Store logits for backward pass
    this.lastLogits = logits;
    
    // Apply softmax for probabilities (CPU - small array)
    const output = this.softmax(logits);
    return output;
  }
  
  softmax(logits) {
    // Find max for numerical stability
    let maxLogit = logits[0];
    for (let i = 1; i < logits.length; i++) {
      if (logits[i] > maxLogit) maxLogit = logits[i];
    }
    
    // Compute exponentials and sum
    const exp = new Float32Array(logits.length);
    let sum = 0;
    for (let i = 0; i < logits.length; i++) {
      exp[i] = Math.exp(logits[i] - maxLogit);
      sum += exp[i];
    }
    
    // Normalize
    const probs = new Float32Array(logits.length);
    for (let i = 0; i < logits.length; i++) {
      probs[i] = exp[i] / sum;
    }
    
    return probs;
  }
  
  backward(input, target, output) {
    // Cross-entropy loss gradient: output - target (for softmax + cross-entropy)
    const outputError = new Float32Array(this.outputSize);
    for (let i = 0; i < this.outputSize; i++) {
      outputError[i] = output[i] - target[i];
    }
    
    // Hidden error (backpropagate through weights2)
    let hiddenError;
    if (this.useGPU) {
      try {
        const hiddenErrorGPU = this.gpuBackwardHidden(outputError, this.weights2, this.hiddenActivations);
        hiddenError = new Float32Array(hiddenErrorGPU);
      } catch (e) {
        // Fallback to CPU
        console.warn('GPU backward pass failed, using CPU:', e);
        this.useGPU = false;
        hiddenError = new Float32Array(this.hiddenSize);
        for (let i = 0; i < this.hiddenSize; i++) {
          let sum = 0;
          for (let j = 0; j < this.outputSize; j++) {
            sum += outputError[j] * this.weights2[i][j];
          }
          hiddenError[i] = sum * this.reluDerivative(this.hiddenActivations[i]);
        }
      }
    } else {
      hiddenError = new Float32Array(this.hiddenSize);
      for (let i = 0; i < this.hiddenSize; i++) {
        let sum = 0;
        for (let j = 0; j < this.outputSize; j++) {
          sum += outputError[j] * this.weights2[i][j];
        }
        hiddenError[i] = sum * this.reluDerivative(this.hiddenActivations[i]);
      }
    }
    
    // Update weights (CPU - need to modify arrays directly)
    // Update weights2 (hidden to output) with weight decay
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        const gradient = outputError[j] * this.hiddenActivations[i];
        // Weight decay: subtract λ * weight to penalize large weights
        this.weights2[i][j] -= this.learningRate * (gradient + this.weightDecay * this.weights2[i][j]);
      }
    }
    
    // Update bias2 (no weight decay on biases)
    for (let i = 0; i < this.outputSize; i++) {
      this.bias2[i] -= this.learningRate * outputError[i];
    }
    
    // Update weights1 (input to hidden) with weight decay
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        const gradient = hiddenError[j] * input[i];
        // Weight decay: subtract λ * weight to penalize large weights
        this.weights1[i][j] -= this.learningRate * (gradient + this.weightDecay * this.weights1[i][j]);
      }
    }
    
    // Update bias1 (no weight decay on biases)
    for (let i = 0; i < this.hiddenSize; i++) {
      this.bias1[i] -= this.learningRate * hiddenError[i];
    }
  }
  
  predict(input) {
    const output = this.forward(input);
    // Find class with highest probability
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
}

/**
 * Generate modular arithmetic dataset
 * Inputs are normalized to [0, 1] range for better neural network training
 * 
 * @param {number} size - Number of examples (ignored if useAllPairs=true)
 * @param {number} mod - Modulus value
 * @param {boolean} useAllPairs - If true, generate all possible (a, b) pairs
 * @param {boolean} useOneHot - If true, use one-hot encoding for inputs
 * @returns {Array} Dataset array
 */
function generateDataset(size, mod, useAllPairs = false, useOneHot = false) {
  const data = [];
  
  if (useAllPairs) {
    // Generate all possible pairs (a, b) where a, b ∈ [0, mod-1]
    for (let a = 0; a < mod; a++) {
      for (let b = 0; b < mod; b++) {
        const c = (a + b) % mod;
        
        let input;
        if (useOneHot) {
          // One-hot encoding: [one-hot(a), one-hot(b)]
          input = new Float32Array(mod * 2);
          input[a] = 1;           // One-hot for a
          input[mod + b] = 1;     // One-hot for b
        } else {
          // Scalar encoding (original)
          input = [a / mod, b / mod];
        }
        
        data.push({ 
          input,
          target: c,
          original: [a, b] // Keep original for display
        });
      }
    }
  } else {
    // Random sampling (old method)
    for (let i = 0; i < size; i++) {
      const a = Math.floor(Math.random() * mod);
      const b = Math.floor(Math.random() * mod);
      const c = (a + b) % mod;
      
      let input;
      if (useOneHot) {
        input = new Float32Array(mod * 2);
        input[a] = 1;
        input[mod + b] = 1;
      } else {
        input = [a / mod, b / mod];
      }
      
      data.push({ 
        input,
        target: c,
        original: [a, b]
      });
    }
  }
  
  return data;
}

/**
 * Split dataset into training and test sets
 * @param {Array} dataset - Full dataset
 * @param {number} trainSplit - Fraction for training (0-1)
 * @returns {Object} {train, test}
 */
function splitDataset(dataset, trainSplit) {
  // Shuffle dataset
  const shuffled = [...dataset];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  const splitIdx = Math.floor(shuffled.length * trainSplit);
  return {
    train: shuffled.slice(0, splitIdx),
    test: shuffled.slice(splitIdx)
  };
}

/**
 * One-hot encode target
 */
function oneHot(target, size) {
  const encoded = new Float32Array(size);
  encoded[target] = 1;
  return encoded;
}

/**
 * Calculate accuracy
 */
function calculateAccuracy(network, dataset) {
  let correct = 0;
  for (const example of dataset) {
    const prediction = network.predict(example.input);
    if (prediction === example.target) {
      correct++;
    }
  }
  return correct / dataset.length;
}

export { NeuralNetwork, generateDataset, splitDataset, oneHot, calculateAccuracy };
