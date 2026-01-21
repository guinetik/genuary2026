/**
 * Web Worker for Factored MLP Training (Grokking)
 * Based on Google's grokking implementation
 */

import { FactoredNetwork, generateAllPairs, splitData, calcAccuracy } from './day19.grokking.js';
import { shuffledIndices } from './day19.utils.js';

console.log('[Worker] Factored MLP module loaded');

// Worker state
let network = null;
let trainData = [];
let testData = [];
let originalTestData = null; // Store original test data for grok mode toggle
let epoch = 0;
let trainAccuracy = 0;
let testAccuracy = 0;
let isTraining = false;

/**
 * Handle messages from main thread
 */
self.onmessage = function(e) {
  const { type, data } = e.data;
  console.log(`[Worker] Received: ${type}`);
  
  switch (type) {
    case 'init': {
      try {
        const config = data.config;
        console.log('[Worker] Config:', config);
        
        // Create network
        network = new FactoredNetwork(config);
        
        // Generate and split data (symmetric defaults to true)
        const allData = generateAllPairs(config.nTokens, config.symmetric ?? true);
        const split = splitData(allData, config.trainFraction || 0.4);
        trainData = split.train;
        testData = split.test;
        
        console.log(`[Worker] Data: ${trainData.length} train, ${testData.length} test`);
        
        epoch = 0;
        trainAccuracy = 0;
        testAccuracy = 0;
        
        sendState();
        console.log('[Worker] Init complete');
      } catch (err) {
        console.error('[Worker] Init error:', err);
        self.postMessage({ type: 'error', error: err.message });
      }
      break;
    }
    
    case 'train': {
      if (!network || isTraining) return;
      isTraining = true;
      
      const startTime = performance.now();
      const { epochsPerFrame, batchSize = 64 } = data;
      
      for (let e = 0; e < epochsPerFrame; e++) {
        // Shuffle training indices
        const indices = shuffledIndices(trainData.length);
        
        // Full batch training (like Google's implementation)
        network.resetGradients();
        
        for (let i = 0; i < trainData.length; i++) {
          const ex = trainData[indices[i]];
          const { cache } = network.forward(ex.a, ex.b);
          network.backward(ex.target, cache);
        }
        
        network.applyAdamW(trainData.length);
        epoch++;
      }
      
      // Calculate accuracies
      trainAccuracy = calcAccuracy(network, trainData);
      testAccuracy = calcAccuracy(network, testData);
      
      const elapsed = performance.now() - startTime;
      
      // Log progress periodically
      if (epoch % 100 === 0) {
        console.log(`[Worker] Epoch ${epoch}: train=${(trainAccuracy*100).toFixed(1)}%, test=${(testAccuracy*100).toFixed(1)}% (${elapsed.toFixed(0)}ms)`);
      }
      
      isTraining = false;
      sendState();
      break;
    }
    
    case 'forward': {
      if (!network) return;
      const { a, b } = data;
      const { probs, hidden } = network.forward(a, b);
      self.postMessage({
        type: 'forward',
        hiddenActivations: network.getGridActivations(), // 256 values for 16x16 grid
        outputActivations: probs, // Float32Array - no need to convert
        prediction: network.predict(a, b),
      });
      break;
    }
    
    case 'syncWeights': {
      // Send all network weights to main thread for synchronization
      // postMessage uses structured clone which handles Float32Array[] natively
      if (!network) return;
      
      self.postMessage({
        type: 'syncWeights',
        weights: {
          embed: network.embed,       // Float32Array[] - cloned by structured clone
          Whidden: network.Whidden,   // Float32Array[] - cloned by structured clone
          Wout: network.Wout,         // Float32Array[] - cloned by structured clone
        },
        config: {
          nTokens: network.nTokens,
          embedSize: network.embedSize,
          hiddenSize: network.hiddenSize,
        }
      });
      break;
    }
    
    case 'reset': {
      if (!network) return;
      const config = data.config;
      network = new FactoredNetwork(config);
      
      const allData = generateAllPairs(config.nTokens, config.symmetric ?? true);
      const split = splitData(allData, config.trainFraction || 0.4);
      trainData = split.train;
      testData = split.test;
      originalTestData = null; // Reset grok mode state
      
      epoch = 0;
      trainAccuracy = 0;
      testAccuracy = 0;
      sendState();
      break;
    }
    
    case 'grokMode': {
      // Toggle grok mode: swap test set with train set
      const enabled = e.data.enabled;
      if (enabled) {
        // Save original and swap
        originalTestData = testData;
        testData = [...trainData];
        console.log(`[Worker] Grok mode ON - test set = train set (${testData.length} examples)`);
      } else {
        // Restore original
        if (originalTestData) {
          testData = originalTestData;
          originalTestData = null;
        }
        console.log(`[Worker] Grok mode OFF - original test set restored (${testData.length} examples)`);
      }
      // Recalculate accuracy with new test set
      if (network) {
        testAccuracy = calcAccuracy(network, testData);
        sendState();
      }
      break;
    }
  }
};

/**
 * Send current state to main thread
 */
function sendState() {
  if (!network) return;
  
  // Get a sample input for visualization
  const sample = testData[0] || trainData[0];
  if (sample) {
    network.forward(sample.a, sample.b);
  }
  
  self.postMessage({
    type: 'state',
    epoch,
    trainAccuracy,
    testAccuracy,
    hiddenActivations: network.getGridActivations(), // 256 values for grid
    outputActivations: network.outputActivations, // Float32Array - no need to convert
    hiddenSize: network.hiddenSize, // Actual hidden size
    nTokens: network.nTokens,
  });
}
