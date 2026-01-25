# Documentation Standards for Genuary 2026

This document outlines the standardized comment and JSDoc patterns used throughout the project.

## File Header Template

Every JavaScript file should start with a standardized header block:

```javascript
/**
 * Genuary 2026 - Day XX
 * Prompt: "Prompt text"
 * 
 * @fileoverview Brief description of what this file does
 * 
 * Detailed description of the implementation, key features, and techniques used.
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */
```

### For Module Files (config, utilities, etc.)

```javascript
/**
 * Day XX Module Name
 * 
 * @fileoverview Description of module purpose
 * 
 * Detailed explanation of what this module provides and how it's used.
 * 
 * @module dayXX.modulename
 * @author guinetik
 */
```

## Class Documentation

Every class should have comprehensive JSDoc:

```javascript
/**
 * Class Name
 * 
 * Detailed description of the class purpose, behavior, and key features.
 * 
 * @class ClassName
 * @extends {ParentClass}
 * @example
 * const instance = new ClassName(canvas);
 * instance.start();
 */
class ClassName extends ParentClass {
  // ...
}
```

## Method Documentation

All public methods should have JSDoc with proper tags:

```javascript
/**
 * Method description
 * 
 * Detailed explanation of what the method does, when it's called,
 * and any side effects or important behavior.
 * 
 * @param {Type} paramName - Parameter description
 * @param {Type} [optionalParam] - Optional parameter description
 * @returns {Type} Return value description
 * @throws {ErrorType} When this error occurs
 * @example
 * const result = instance.methodName(value);
 */
methodName(paramName, optionalParam) {
  // ...
}
```

## Configuration Objects

Configuration objects should have type documentation:

```javascript
/**
 * Configuration object for Day XX
 * 
 * @type {Object}
 * @property {number} propertyName - Description of property
 * @property {Object} nestedObject - Description
 * @property {number} nestedObject.subProperty - Nested property description
 */
export const CONFIG = {
  propertyName: value,
  // ...
};
```

## Export Function Documentation

The default export function should be fully documented:

```javascript
/**
 * Create Day XX visualization
 * 
 * Factory function that creates and starts the demo. Returns a control
 * object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {GameClass} returns.game - The game instance
 */
export default function dayXX(canvas) {
  // ...
}
```

## Inline Comments

Use inline comments sparingly, only for complex logic:

```javascript
// Good: Explains non-obvious behavior
// Camera yaw = mouse.x * 0.8 in shader, need strong X compensation
const bhX = this.bhPosition[0] - this.mouseX * this.mouseActive * 0.35;

// Bad: States the obvious
// Set x to 5
const x = 5;
```

## Section Dividers

Use consistent section dividers for organization:

```javascript
// ============================================
// Section Name
// ============================================

// Or shorter version:
// ------------------------------------------
// Subsection
// ------------------------------------------
```

## Author Attribution

- Always include `@author guinetik` in file headers
- For files with external credits, add: `@credit ExternalAuthorName`
- Example: Day 23 has `@credit PaoloCurtoni` for the shader inspiration

## See Also Links

Include relevant links in file headers:
- `@see {@link https://genuary.art|Genuary}` - Link to Genuary website
- `@see {@link https://gcanvas.guinetik.com|GCanvas Library}` - Link to library docs
- Additional links for algorithms, techniques, or inspirations

## Examples

### Complete Day File Template

```javascript
/**
 * Genuary 2026 - Day XX
 * Prompt: "Prompt text"
 * 
 * @fileoverview Implementation title and brief description
 * 
 * Detailed description of the visualization, techniques used, and
 * key features. Mention any notable algorithms or inspirations.
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import { Game, Camera3D, ParticleSystem } from '@guinetik/gcanvas';

/**
 * Configuration object for Day XX
 * 
 * @type {Object}
 * @property {number} propertyName - Description
 */
const CONFIG = {
  propertyName: value,
};

/**
 * Main Demo Class
 * 
 * @class DayXXDemo
 * @extends {Game}
 */
class DayXXDemo extends Game {
  /**
   * Initialize the demo
   */
  init() {
    // ...
  }

  /**
   * Update game state
   * 
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // ...
  }

  /**
   * Render the scene
   */
  render() {
    // ...
  }
}

/**
 * Create Day XX visualization
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {DayXXDemo} returns.game - The game instance
 */
export default function dayXX(canvas) {
  const game = new DayXXDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
```
