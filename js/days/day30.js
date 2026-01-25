/**
 * Genuary 2026 - Day 30
 * Prompt: "It's not a bug, it's a feature"
 * 
 * @fileoverview Synesthesia Experiment - Become Dave Bowman
 * 
 * Cross-sensory perception inspired by 2001: A Space Odyssey Stargate sequence.
 * Audio distorts/colors the video. Video influences audio visualization.
 * Bidirectional feedback loop creates a synesthetic experience.
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import { Game, Painter, Button, Screen, WebGLRenderer, StateMachine, Scene, VerticalLayout, HorizontalLayout, Text, ToggleButton } from '@guinetik/gcanvas';

// Import shaders as raw strings (Vite handles this with ?raw suffix)
import VERTEX_SHADER from '../../glsl/day30.vert?raw';
import FRAGMENT_SHADER from '../../glsl/day30.frag?raw';

const CONFIG = {
  // Visualization
  lineWidth: 3,
  glowAmount: 15,

  // Wave parameters
  wave: {
    noiseScale: 0.02,
    maxAmplitude: 0.3,
    colorSpeed: 1.5,
  },

  // Colors
  hue: 135,             // Terminal green
  hueRange: 60,         // Color variation range

  // Performance: Video texture undersampling
  // Limits the texture resolution uploaded to GPU
  // Lower = better performance, higher = sharper video
  maxTextureWidth: 640,   // Max texture width (GPU upload limit)
  maxTextureHeight: 480,  // Max texture height (GPU upload limit)

  // Cover scale: how much larger than canvas to draw video
  // 1.0 = exact fit, 1.05 = 5% larger (hides edge artifacts from distortion)
  coverScale: 1.06,       // Slightly overscan to hide distortion edges

  // Synesthesia effects
  effects: {
    // Audio → Visual
    bassBlurIntensity: 0.3,      // Zoom/blur pulse from bass
    midHueRotationSpeed: 2.0,    // Hue rotation speed from mids
    highEdgeIntensity: 0.5,      // Edge detection/sharpening from highs
    amplitudeSaturation: 1.5,    // Saturation boost from amplitude
    silenceSolarization: 0.8,    // Solarization when silent
    
    // Visual → Audio (for visualization)
    colorTintStrength: 0.3,      // How much dominant color tints audio viz
    motionParticleRate: 0.1,      // Particle spawn rate from motion
    brightnessReverb: 0.2,       // Reverb/echo effect from brightness
  },
};

/**
 * Day 30 Demo
 * 
 * Synesthesia experiment: webcam + microphone bidirectional effects
 * 
 * @class Day30Demo
 * @extends {Game}
 */
class Day30Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    Screen.init(this);
    Painter.init(this.ctx);

    this.time = 0;
    this.idlePhase = 0;
    this.colorPhase = 0;

    // WebGL renderer
    this.webgl = null;
    this.webglAvailable = false;
    this.videoTexture = null;

    // Media streams
    this.videoStream = null;
    this.videoElement = null;
    this.audioContext = null;
    this.analyser = null;
    this.audioSource = null;
    this.audioBuffer = null;
    this.isPlaying = false;
    
    // Video processing
    this.videoCanvas = null;
    this.videoCtx = null;
    this.currentFrame = null;

    // Undersampled texture canvas (for GPU upload performance)
    this.textureCanvas = null;
    this.textureCtx = null;
    this.textureWidth = 0;
    this.textureHeight = 0;
    
    // Audio analysis
    this.frequencyData = null;
    this.bassLevel = 0;
    this.midLevel = 0;
    this.highLevel = 0;
    this.amplitude = 0;
    
    // Visual analysis
    this.dominantColor = { r: 0, g: 255, b: 0 }; // Terminal green default
    this.motionAmount = 0;
    this.brightness = 0.5;
    this.prevFrame = null;
    
    // Video-to-audio frequency mapping (equalizer-style)
    this.videoFrequencyData = null; // Combined array for visualization
    this.videoBrightnessData = null; // Brightness per band (for bass frequencies)
    this.videoColorData = null; // Color saturation per band (for mid frequencies)
    this.videoMotionData = null; // Motion per band (for high frequencies)
    this.spectrumBars = 64; // Number of bars in spectrum analyzer
    this.smoothedAudioFreq = new Float32Array(64); // Smoothed audio frequencies
    this.smoothedVideoFreq = new Float32Array(64); // Smoothed video frequencies
    
    // Mouse tracking for ripple effect
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.mouseDown = false;
    this.rippleTime = 0; // Time since last ripple

    // Settings state
    this.videoSource = 'camera'; // 'camera' or 'file'
    this.audioSource = 'mic'; // 'mic' or 'file'
    this.settingsScene = null;
    this.selectedVideoFile = null;
    this.selectedAudioFile = null;
    this.videoFileInput = null;
    this.audioFileInput = null;

    // Create buttons
    this.startButton = new Button(this, {
      text: "start synesthesia",
      width: 200,
      height: 50,
      font: '16px "Fira Code", monospace',
      onClick: () => this.fsm.setState('settings'),
    });
    this.startButton.x = this.width / 2;
    this.startButton.y = this.height / 2 + 100;
    this.pipeline.add(this.startButton);

    this.backButton = new Button(this, {
      x: 80,
      y: 30,
      width: 100,
      height: 30,
      text: "← Back",
      onClick: () => this.fsm.setState('intro'),
    });
    this.pipeline.add(this.backButton);

    // Initialize state machine
    this.initStateMachine();
  }

  /**
   * Initialize state machine
   */
  initStateMachine() {
    this.fsm = new StateMachine({
      initial: 'intro',
      context: this,
      states: {
        intro: {
          enter: () => {
            // Show start button, hide back button
            this.startButton.visible = true;
            this.startButton.interactive = true;
            this.backButton.visible = false;
            this.backButton.interactive = false;
            // Remove settings scene if it exists
            if (this.settingsScene) {
              this.pipeline.remove(this.settingsScene);
              this.settingsScene = null;
            }
          },
        },
        settings: {
          enter: () => {
            // Hide start button, show back button
            this.startButton.visible = false;
            this.startButton.interactive = false;
            this.backButton.visible = true;
            this.backButton.interactive = true;
            // Create settings UI
            this.createSettingsUI();
          },
          exit: () => {
            // Remove settings scene
            if (this.settingsScene) {
              this.pipeline.remove(this.settingsScene);
              this.settingsScene = null;
            }
          },
        },
        synesthesia: {
          enter: () => {
            // Hide start button, show back button
            this.startButton.visible = false;
            this.startButton.interactive = false;
            this.backButton.visible = true;
            this.backButton.interactive = true;
            // Start synesthesia setup
            this.startSynesthesia();
          },
          exit: () => {
            // Clean up synesthesia resources
            this.cleanupSynesthesia();
          },
        },
      },
    });
  }

  /**
   * Create settings UI with video and audio source selection
   */
  createSettingsUI() {
    // Create main vertical layout scene (centered)
    this.settingsScene = new Scene(this, {
      width: this.width,
      height: this.height,
      anchor: 'center'
    });
    this.settingsScene.x = this.width / 2;
    this.settingsScene.y = this.height / 2;

    // Main vertical layout container
    const mainLayout = new VerticalLayout(this, {
      spacing: 30,
      padding: 20,
    });
    this.settingsScene.add(mainLayout);

    // --- VIDEO SECTION ---
    const videoLabel = new Text(this, "--- VIDEO ---", {
      font: '18px "Fira Code", monospace',
      color: '#0f0',
      align: 'center',
      baseline: 'middle',
    });
    mainLayout.add(videoLabel);

    // Video section container (vertical layout for buttons + filename)
    const videoSection = new VerticalLayout(this, {
      spacing: 8,
      padding: 0,
    });
    mainLayout.add(videoSection);

    // Video source horizontal layout (Camera/File radio buttons)
    const videoLayout = new HorizontalLayout(this, {
      spacing: 20,
      padding: 10,
    });
    videoSection.add(videoLayout);

    const cameraBtn = new ToggleButton(this, {
      text: "Camera",
      width: 120,
      height: 40,
      font: '14px "Fira Code", monospace',
      startToggled: this.videoSource === 'camera',
      onToggle: (isOn) => {
        if (isOn) {
          this.videoSource = 'camera';
          this.videoFileBtn.toggle(false);
          // Reset button text and filename label
          this.videoFileBtn.text = "File";
          this.selectedVideoFile = null;
          if (this.videoFileNameLabel) {
            this.videoFileNameLabel.text = "";
          }
        }
      },
    });
    videoLayout.add(cameraBtn);

    // Store button references for updating text
    this.videoFileBtn = new ToggleButton(this, {
      text: "File",
      width: 120,
      height: 40,
      font: '14px "Fira Code", monospace',
      startToggled: this.videoSource === 'file',
      onToggle: (isOn) => {
        if (isOn) {
          this.videoSource = 'file';
          cameraBtn.toggle(false);
          // Trigger file picker
          this.selectVideoFile();
        }
      },
    });
    videoLayout.add(this.videoFileBtn);

    // Video filename label (shown when file is selected)
    this.videoFileNameLabel = new Text(this, "", {
      font: '11px "Fira Code", monospace',
      color: '#0f0',
      align: 'center',
      baseline: 'top',
    });
    videoSection.add(this.videoFileNameLabel);

    // --- AUDIO SECTION ---
    const audioLabel = new Text(this, "--- AUDIO ---", {
      font: '18px "Fira Code", monospace',
      color: '#0f0',
      align: 'center',
      baseline: 'middle',
    });
    mainLayout.add(audioLabel);

    // Audio section container (vertical layout for buttons + filename)
    const audioSection = new VerticalLayout(this, {
      spacing: 8,
      padding: 0,
    });
    mainLayout.add(audioSection);

    // Audio source horizontal layout (MIC/FILE radio buttons)
    const audioLayout = new HorizontalLayout(this, {
      spacing: 20,
      padding: 10,
    });
    audioSection.add(audioLayout);

    const micBtn = new ToggleButton(this, {
      text: "MIC",
      width: 120,
      height: 40,
      font: '14px "Fira Code", monospace',
      startToggled: this.audioSource === 'mic',
      onToggle: (isOn) => {
        if (isOn) {
          this.audioSource = 'mic';
          this.audioFileBtn.toggle(false);
          // Reset button text and filename label
          this.audioFileBtn.text = "FILE";
          this.selectedAudioFile = null;
          if (this.audioFileNameLabel) {
            this.audioFileNameLabel.text = "";
          }
        }
      },
    });
    audioLayout.add(micBtn);

    // Store button reference for updating text
    this.audioFileBtn = new ToggleButton(this, {
      text: "FILE",
      width: 120,
      height: 40,
      font: '14px "Fira Code", monospace',
      startToggled: this.audioSource === 'file',
      onToggle: (isOn) => {
        if (isOn) {
          this.audioSource = 'file';
          micBtn.toggle(false);
          // Trigger file picker
          this.selectAudioFile();
        }
      },
    });
    audioLayout.add(this.audioFileBtn);

    // Audio filename label (shown when file is selected)
    this.audioFileNameLabel = new Text(this, "", {
      font: '11px "Fira Code", monospace',
      color: '#0f0',
      align: 'center',
      baseline: 'top',
    });
    audioSection.add(this.audioFileNameLabel);

    // Start button
    const startBtn = new Button(this, {
      text: "start",
      width: 200,
      height: 50,
      font: '16px "Fira Code", monospace',
      onClick: () => this.fsm.setState('synesthesia'),
    });
    mainLayout.add(startBtn);

    // Add settings scene to pipeline
    this.pipeline.add(this.settingsScene);

    // Create hidden file inputs
    this.createFileInputs();

    // Initialize filename labels if files are already selected
    if (this.selectedVideoFile) {
      this.updateVideoFileName(this.selectedVideoFile.name);
      this.videoFileBtn.text = "File ✓";
    }
    if (this.selectedAudioFile) {
      this.updateAudioFileName(this.selectedAudioFile.name);
      this.audioFileBtn.text = "FILE ✓";
    }
  }

  /**
   * Create hidden file input elements for video and audio
   */
  createFileInputs() {
    // Video file input
    this.videoFileInput = document.createElement('input');
    this.videoFileInput.type = 'file';
    this.videoFileInput.accept = 'video/*';
    this.videoFileInput.style.display = 'none';
    this.videoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedVideoFile = file;
        // Update filename label with ellipsis if needed
        this.updateVideoFileName(file.name);
        // Add visual indicator (checkmark)
        this.videoFileBtn.text = "File ✓";
      }
    });
    document.body.appendChild(this.videoFileInput);

    // Audio file input
    this.audioFileInput = document.createElement('input');
    this.audioFileInput.type = 'file';
    this.audioFileInput.accept = 'audio/*';
    this.audioFileInput.style.display = 'none';
    this.audioFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedAudioFile = file;
        // Update filename label with ellipsis if needed
        this.updateAudioFileName(file.name);
        // Add visual indicator (checkmark)
        this.audioFileBtn.text = "FILE ✓";
      }
    });
    document.body.appendChild(this.audioFileInput);
  }

  /**
   * Update video filename label with ellipsis truncation
   */
  updateVideoFileName(fileName) {
    if (!this.videoFileNameLabel) return;
    
    // Simple character-based truncation (monospace font, ~18 chars fits in 200px at 11px)
    const maxChars = 25;
    let displayName = fileName;
    
    if (fileName.length > maxChars) {
      // Truncate with ellipsis
      displayName = fileName.substring(0, maxChars - 1) + '…';
    }
    
    this.videoFileNameLabel.text = displayName;
    this.videoFileNameLabel.color = '#0f0';
  }

  /**
   * Update audio filename label with ellipsis truncation
   */
  updateAudioFileName(fileName) {
    if (!this.audioFileNameLabel) return;
    
    // Simple character-based truncation (monospace font, ~18 chars fits in 200px at 11px)
    const maxChars = 25;
    let displayName = fileName;
    
    if (fileName.length > maxChars) {
      // Truncate with ellipsis
      displayName = fileName.substring(0, maxChars - 1) + '…';
    }
    
    this.audioFileNameLabel.text = displayName;
    this.audioFileNameLabel.color = '#0f0';
  }

  /**
   * Trigger video file picker
   */
  selectVideoFile() {
    if (this.videoFileInput) {
      this.videoFileInput.click();
    }
  }

  /**
   * Trigger audio file picker
   */
  selectAudioFile() {
    if (this.audioFileInput) {
      this.audioFileInput.click();
    }
  }

  /**
   * Request webcam access and audio file selection, start synesthesia
   */
  async startSynesthesia() {
    try {
      // Validate file selections if needed
      if (this.videoSource === 'file' && !this.selectedVideoFile) {
        alert('Please select a video file first.');
        // Switch back to camera
        this.videoSource = 'camera';
        if (this.videoFileBtn) this.videoFileBtn.toggle(false);
        return;
      }
      if (this.audioSource === 'file' && !this.selectedAudioFile) {
        alert('Please select an audio file first.');
        // Switch back to mic
        this.audioSource = 'mic';
        if (this.audioFileBtn) this.audioFileBtn.toggle(false);
        return;
      }

      // Setup video source (camera or file)
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true; // Mute video - audio comes from selected audio source only
      this.videoElement.width = this.width;
      this.videoElement.height = this.height;
      this.videoElement.loop = true; // Loop video files

      if (this.videoSource === 'camera') {
        // Request webcam with canvas dimensions
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: this.width },
            height: { ideal: this.height }
          }
        });
        this.videoStream = stream.getVideoTracks()[0];
        this.videoElement.srcObject = stream;
      } else {
        // Use selected video file
        const videoURL = URL.createObjectURL(this.selectedVideoFile);
        this.videoElement.src = videoURL;
        this.videoElement.addEventListener('loadedmetadata', () => {
          // Video file loaded, start playback and processing
          this.videoElement.play().then(() => {
            this.processVideo();
          }).catch(err => {
            console.error('Video play failed:', err);
            // Try processing anyway - some browsers may still work
            this.processVideo();
          });
        });
      }
      
    // Create offscreen canvas for video capture (full resolution for display)
    this.videoCanvas = document.createElement('canvas');
    this.videoCanvas.width = this.width;
    this.videoCanvas.height = this.height;
    // Use willReadFrequently for better performance when reading pixels frequently
    this.videoCtx = this.videoCanvas.getContext('2d', { willReadFrequently: true });

    // Create undersampled texture canvas for GPU upload performance
    // This smaller canvas is what gets uploaded to the GPU texture each frame
    this.textureCanvas = document.createElement('canvas');
    this.textureCtx = this.textureCanvas.getContext('2d', { willReadFrequently: false });

      // Initialize WebGL renderer
      this.webgl = new WebGLRenderer(this.width, this.height);
      if (!this.webgl.isAvailable()) {
        console.warn('WebGL not available, falling back to canvas 2D');
        this.webglAvailable = false;
      } else {
        this.webglAvailable = true;
        this.webgl.useProgram('synesthesia', VERTEX_SHADER, FRAGMENT_SHADER);
        
        // Create video texture
        const gl = this.webgl.gl;
        this.videoTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      }

      // Setup audio source (mic or file)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Initialize video frequency data arrays (equalizer-style)
      this.videoFrequencyData = new Float32Array(this.spectrumBars); // Combined for visualization
      this.videoBrightnessData = new Float32Array(this.spectrumBars); // For bass frequencies
      this.videoColorData = new Float32Array(this.spectrumBars); // For mid frequencies
      this.videoMotionData = new Float32Array(this.spectrumBars); // For high frequencies
      
      // Initialize smoothed frequency arrays
      this.smoothedAudioFreq = new Float32Array(this.spectrumBars);
      this.smoothedVideoFreq = new Float32Array(this.spectrumBars);
      
      // Setup mouse event handlers for ripple effect
      this.setupMouseHandlers();
      
      // Create audio processing nodes for video-to-audio influence
      // Use multiple BiquadFilterNodes as an EQ to boost frequencies based on video
      this.audioFilters = [];
      
      // Create filter nodes for different frequency bands (match spectrumBars)
      const numBands = Math.min(this.spectrumBars, 16); // Limit to 16 for performance
      for (let i = 0; i < numBands; i++) {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'peaking';
        // Distribute frequencies logarithmically across audio spectrum
        const minFreq = 60; // ~60Hz (low bass)
        const maxFreq = 8000; // ~8kHz (highs)
        const freq = numBands > 1 
          ? minFreq * Math.pow(maxFreq / minFreq, i / (numBands - 1))
          : (minFreq + maxFreq) / 2;
        filter.frequency.value = freq;
        filter.Q.value = 2; // Narrower Q for more precise frequency control
        filter.gain.value = 0; // Start neutral (no boost/attenuation)
        
        this.audioFilters.push(filter);
      }

      if (this.audioSource === 'mic') {
        // Request microphone access
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = this.audioContext.createMediaStreamSource(audioStream);
        
        // Connect through filters for video influence
        this.connectAudioWithFilters(source);
      } else {
        // Use selected audio file
        await this.loadAudioFile(this.selectedAudioFile);
      }

      // Start video processing (for camera, start immediately; for file, wait for loadedmetadata)
      if (this.videoSource === 'camera') {
        this.processVideo();
      }
      // For video file, processVideo() is called in the loadedmetadata event handler

    } catch (err) {
      console.error('Error starting synesthesia:', err);
      if (this.videoSource === 'camera') {
        alert('Could not access webcam. Please allow permissions.');
      } else if (this.audioSource === 'mic') {
        alert('Could not access microphone. Please allow permissions.');
      } else {
        alert('Error starting synesthesia: ' + err.message);
      }
    }
  }

  /**
   * Clean up synesthesia resources (called on state exit)
   */
  cleanupSynesthesia() {
    // Stop media streams
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    if (this.audioSource) {
      try {
        if (this.audioSource.stop) {
          this.audioSource.stop();
        }
        if (this.audioSource.disconnect) {
          this.audioSource.disconnect();
        }
      } catch (e) {
        // Ignore errors (may already be stopped)
      }
      this.audioSource = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {
        // Ignore errors
      });
      this.audioContext = null;
    }
    if (this.videoElement) {
      // Pause video first
      this.videoElement.pause();
      // Revoke object URL if it was a file
      if (this.videoElement.src && this.videoElement.src.startsWith('blob:')) {
        URL.revokeObjectURL(this.videoElement.src);
      }
      this.videoElement.srcObject = null;
      this.videoElement.src = '';
      this.videoElement = null;
    }
    
    // Reset state
    this.currentFrame = null;
    this.videoCanvas = null;
    this.videoCtx = null;
    this.textureCanvas = null;
    this.textureCtx = null;
    this.textureWidth = 0;
    this.textureHeight = 0;
    this.rawAnalysisCanvas = null;
    this.rawAnalysisCtx = null;
    this.frequencyData = null;
    // Note: Keep selectedVideoFile and selectedAudioFile for next time
    
    // Clean up WebGL texture
    if (this.webglAvailable && this.webgl && this.videoTexture) {
      const gl = this.webgl.gl;
      gl.deleteTexture(this.videoTexture);
      this.videoTexture = null;
    }
  }

  /**
   * Create file input for audio selection
   */
  createAudioFileInput() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        await this.loadAudioFile(e.target.files[0]);
        fileInput.remove();
      }
    });

    // Trigger file picker
    fileInput.click();
  }

  /**
   * Load and play audio file
   */
  async loadAudioFile(file) {
    try {
      // Load audio buffer
      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Create source and connect through filters
      this.audioSource = this.audioContext.createBufferSource();
      this.audioSource.buffer = this.audioBuffer;
      
      // Connect through filters for video influence
      this.connectAudioWithFilters(this.audioSource);

      // Handle playback end
      this.audioSource.onended = () => {
        this.isPlaying = false;
        // Loop the track
        this.startAudioPlayback();
      };

      // Start playback
      this.startAudioPlayback();
      // Note: processVideo() is called separately for video processing

    } catch (err) {
      console.error('Error loading audio file:', err);
      alert('Could not load audio file.');
    }
  }

  /**
   * Start audio playback
   */
  startAudioPlayback() {
    if (!this.audioBuffer || !this.audioContext) return;

    // Create new source (needed for looping)
    this.audioSource = this.audioContext.createBufferSource();
    this.audioSource.buffer = this.audioBuffer;
    // Connect through filters for video influence
    this.connectAudioWithFilters(this.audioSource);

    this.audioSource.onended = () => {
      this.isPlaying = false;
      // Loop
      this.startAudioPlayback();
    };

    this.audioSource.start(0);
    this.isPlaying = true;
  }

  /**
   * Process video frames - capture and upload to WebGL texture
   *
   * Performance optimization: Uses an undersampled texture canvas for GPU upload.
   * The shader samples from this smaller texture (WebGL LINEAR filtering interpolates).
   * This dramatically improves performance with large videos (4K, etc.).
   */
  processVideo() {
    if (!this.fsm.is('synesthesia') || !this.videoElement) return;

    // Get actual video dimensions
    const videoWidth = this.videoElement.videoWidth || this.width;
    const videoHeight = this.videoElement.videoHeight || this.height;

    // Calculate undersampled texture dimensions (maintain aspect ratio)
    // This is what gets uploaded to the GPU each frame
    const videoAspect = videoWidth / videoHeight;
    let texWidth = CONFIG.maxTextureWidth;
    let texHeight = CONFIG.maxTextureHeight;

    // Fit within max bounds while maintaining aspect ratio
    if (texWidth / videoAspect > texHeight) {
      // Height-limited
      texWidth = Math.floor(texHeight * videoAspect);
    } else {
      // Width-limited
      texHeight = Math.floor(texWidth / videoAspect);
    }

    // Update texture canvas size if needed
    if (this.textureCanvas.width !== texWidth || this.textureCanvas.height !== texHeight) {
      this.textureCanvas.width = texWidth;
      this.textureCanvas.height = texHeight;
      this.textureWidth = texWidth;
      this.textureHeight = texHeight;
      console.log(`[Day30] Texture undersampled: ${videoWidth}x${videoHeight} → ${texWidth}x${texHeight}`);
    }

    // Update video canvas to match canvas size (for display if needed)
    if (this.videoCanvas.width !== this.width || this.videoCanvas.height !== this.height) {
      this.videoCanvas.width = this.width;
      this.videoCanvas.height = this.height;
    }

    // Draw video frame to undersampled texture canvas (GPU upload source)
    // Draw at native video aspect ratio - fills the texture canvas
    this.textureCtx.drawImage(this.videoElement, 0, 0, texWidth, texHeight);

    // Draw video frame scaled to cover canvas while maintaining aspect ratio
    // Use "cover" mode: video fills canvas completely, may crop edges
    const canvasAspect = this.width / this.height;

    let drawWidth, drawHeight, drawX, drawY;
    if (canvasAspect > videoAspect) {
      // Canvas is wider than video - fit to canvas width, crop top/bottom
      drawWidth = this.width;
      drawHeight = this.width / videoAspect;
      drawX = 0;
      drawY = (this.height - drawHeight) / 2;
    } else {
      // Canvas is taller than video - fit to canvas height, crop left/right
      drawHeight = this.height;
      drawWidth = this.height * videoAspect;
      drawX = (this.width - drawWidth) / 2;
      drawY = 0;
    }

    // Clear and draw video frame (for fallback 2D rendering)
    this.videoCtx.fillStyle = '#000';
    this.videoCtx.fillRect(0, 0, this.width, this.height);
    this.videoCtx.drawImage(this.videoElement, drawX, drawY, drawWidth, drawHeight);

    // Analyze visual properties from undersampled texture (faster than raw video)
    // Use texture canvas for analysis - already downsampled, good enough for frequency data
    if (!this.rawAnalysisCanvas) {
      this.rawAnalysisCanvas = document.createElement('canvas');
      this.rawAnalysisCtx = this.rawAnalysisCanvas.getContext('2d', { willReadFrequently: true });
    }

    // Set analysis canvas to match texture dimensions (already undersampled)
    if (this.rawAnalysisCanvas.width !== texWidth || this.rawAnalysisCanvas.height !== texHeight) {
      this.rawAnalysisCanvas.width = texWidth;
      this.rawAnalysisCanvas.height = texHeight;
    }

    // Draw from texture canvas (already undersampled)
    this.rawAnalysisCtx.drawImage(this.textureCanvas, 0, 0, texWidth, texHeight);

    // Analyze undersampled video frame (much faster than full resolution)
    const rawImageData = this.rawAnalysisCtx.getImageData(0, 0, texWidth, texHeight);
    this.analyzeVisual(rawImageData);

    // Store current frame for motion detection (from undersampled feed)
    this.prevFrame = new Uint8Array(rawImageData.data);

    // Upload undersampled texture to WebGL (MUCH smaller = MUCH faster)
    if (this.webglAvailable && this.videoTexture && this.webgl) {
      const gl = this.webgl.gl;
      // Check if texture is still valid before using it
      if (gl.isTexture(this.videoTexture)) {
        gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
        // Upload smaller texture canvas instead of full-res video canvas
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textureCanvas);
      }
    }

    // Continue processing
    requestAnimationFrame(() => this.processVideo());
  }

  /**
   * Analyze visual properties from video frame and create frequency-like data
   */
  analyzeVisual(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let rSum = 0, gSum = 0, bSum = 0;
    let brightnessSum = 0;
    let motionSum = 0;
    const pixelCount = data.length / 4;

    // Initialize video frequency data arrays (equalizer-style)
    if (!this.videoFrequencyData) {
      this.videoFrequencyData = new Float32Array(this.spectrumBars);
      this.videoBrightnessData = new Float32Array(this.spectrumBars);
      this.videoColorData = new Float32Array(this.spectrumBars);
      this.videoMotionData = new Float32Array(this.spectrumBars);
    }
    
    // Clear video frequency data
    for (let i = 0; i < this.videoFrequencyData.length; i++) {
      this.videoFrequencyData[i] = 0;
      this.videoBrightnessData[i] = 0;
      this.videoColorData[i] = 0;
      this.videoMotionData[i] = 0;
    }

    // Analyze pixels and create frequency-like bands
    // Divide image into horizontal bands (like spectrum analyzer bars)
    const bands = this.videoFrequencyData.length;
    const pixelsPerBand = Math.floor(width / bands);
    
    for (let band = 0; band < bands; band++) {
      let bandBrightness = 0;
      let bandColor = 0;
      let bandMotion = 0;
      let bandPixelCount = 0;
      
      const startX = band * pixelsPerBand;
      const endX = Math.min((band + 1) * pixelsPerBand, width);
      
      // Sample pixels in this band (sample vertically too for better representation)
      for (let y = 0; y < height; y += 2) { // Sample every other row for performance
        for (let x = startX; x < endX; x += 2) { // Sample every other column
          const idx = (y * width + x) * 4;
          if (idx + 2 < data.length) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            // Brightness
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
            bandBrightness += brightness;
            
            // Color intensity (use saturation)
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max > 0 ? (max - min) / max : 0;
            bandColor += saturation;
            
            // Motion detection
            if (this.prevFrame && idx < this.prevFrame.length) {
              const prevR = this.prevFrame[idx];
              const prevG = this.prevFrame[idx + 1];
              const prevB = this.prevFrame[idx + 2];
              const diff = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
              bandMotion += diff / 765;
            }
            
            bandPixelCount++;
          }
        }
      }
      
      // Store normalized frequency values separately (equalizer-style)
      if (bandPixelCount > 0) {
        const avgBrightness = bandBrightness / bandPixelCount;
        const avgColor = bandColor / bandPixelCount;
        const avgMotion = bandPixelCount > 0 ? bandMotion / bandPixelCount : 0;
        
        // Store separately for equalizer mapping
        this.videoBrightnessData[band] = avgBrightness;
        this.videoColorData[band] = avgColor;
        this.videoMotionData[band] = avgMotion;
        
        // Combined value for visualization (spectrum analyzer display)
        this.videoFrequencyData[band] = (avgBrightness * 0.5 + avgColor * 0.3 + avgMotion * 0.2);
      }
    }

    // Overall frame analysis
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      rSum += r;
      gSum += g;
      bSum += b;
      
      // Brightness (luminance)
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      brightnessSum += brightness;
      
      // Motion detection (compare with previous frame)
      if (this.prevFrame) {
        const prevR = this.prevFrame[i];
        const prevG = this.prevFrame[i + 1];
        const prevB = this.prevFrame[i + 2];
        const diff = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
        motionSum += diff / 765; // Normalize to 0-1
      }
    }

    // Calculate dominant color
    this.dominantColor = {
      r: Math.floor(rSum / pixelCount),
      g: Math.floor(gSum / pixelCount),
      b: Math.floor(bSum / pixelCount),
    };

    this.brightness = brightnessSum / pixelCount;
    this.motionAmount = motionSum / pixelCount;
  }

  /**
   * Analyze audio frequency bands
   */
  analyzeAudio() {
    if (!this.analyser || !this.frequencyData) {
      this.bassLevel = 0;
      this.midLevel = 0;
      this.highLevel = 0;
      this.amplitude = 0;
      return;
    }

    // Get frequency data (already modified by video filters)
    this.analyser.getByteFrequencyData(this.frequencyData);
    
    // Update audio filters based on video frequencies (affects actual audio playback)
    this.updateAudioFilters();
    
    // Smooth frequency data for spectrum analyzer (prevent jittery colors)
    const smoothingFactor = 0.85; // Higher = more smoothing (0-1)
    if (this.smoothedAudioFreq && this.smoothedVideoFreq) {
      for (let i = 0; i < this.spectrumBars; i++) {
        // Get raw audio frequency for this bar
        const freqIndex = Math.floor((i / this.spectrumBars) * this.frequencyData.length);
        const rawAudio = this.frequencyData[freqIndex] / 255.0;
        
        // Smooth audio frequencies
        this.smoothedAudioFreq[i] = this.smoothedAudioFreq[i] * smoothingFactor + rawAudio * (1.0 - smoothingFactor);
        
        // Smooth video frequencies
        const rawVideo = this.videoFrequencyData[i] || 0;
        this.smoothedVideoFreq[i] = this.smoothedVideoFreq[i] * smoothingFactor + rawVideo * (1.0 - smoothingFactor);
      }
    }
    
    // Analyze frequency bands
    const bassEnd = Math.floor(this.frequencyData.length * 0.1); // 0-10%
    const midStart = Math.floor(this.frequencyData.length * 0.1);
    const midEnd = Math.floor(this.frequencyData.length * 0.5); // 10-50%
    const highStart = Math.floor(this.frequencyData.length * 0.5); // 50-100%

    // Calculate levels
    let bassSum = 0, midSum = 0, highSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += this.frequencyData[i];
    for (let i = midStart; i < midEnd; i++) midSum += this.frequencyData[i];
    for (let i = highStart; i < this.frequencyData.length; i++) highSum += this.frequencyData[i];

    this.bassLevel = bassSum / (bassEnd * 255);
    this.midLevel = midSum / ((midEnd - midStart) * 255);
    this.highLevel = highSum / ((this.frequencyData.length - highStart) * 255);
    // Weight amplitude more toward bass for bass-heavy tracks (drum & bass, etc.)
    // This helps the kaleidoscopic effect activate on bass-heavy music
    this.amplitude = (this.bassLevel * 0.5 + this.midLevel * 0.3 + this.highLevel * 0.2);
  }
  
  /**
   * Connect audio source through filter chain for video influence
   */
  connectAudioWithFilters(source) {
    if (!this.audioFilters || this.audioFilters.length === 0) {
      // Fallback: direct connection if filters not initialized
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      return;
    }
    
    // Connect source -> filters -> analyser -> destination
    let currentNode = source;
    
    // Chain filters in parallel (each filter processes a frequency band)
    // Actually, we need to chain them in series for proper EQ effect
    for (let i = 0; i < this.audioFilters.length; i++) {
      currentNode.connect(this.audioFilters[i]);
      currentNode = this.audioFilters[i];
    }
    
    // Connect to analyser and destination
    currentNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  /**
   * Update audio filters based on video frequencies (equalizer-style)
   * Maps different video properties to different audio frequency ranges:
   * - Brightness → Bass frequencies (60-200Hz)
   * - Color saturation → Mid frequencies (200-2000Hz)
   * - Motion → High frequencies (2000-8000Hz)
   */
  updateAudioFilters() {
    if (!this.videoFrequencyData || !this.audioFilters || this.audioFilters.length === 0) return;
    if (!this.videoBrightnessData || !this.videoColorData || !this.videoMotionData) return;
    
    const numBands = this.audioFilters.length;
    const videoBands = this.videoFrequencyData.length;
    
    // Frequency ranges for equalizer mapping
    const bassEnd = Math.floor(numBands * 0.3); // First 30% = bass (60-200Hz)
    const midStart = bassEnd;
    const midEnd = Math.floor(numBands * 0.7); // 30-70% = mids (200-2000Hz)
    const highStart = midEnd; // 70-100% = highs (2000-8000Hz)
    
    // Map video properties to audio filter gains (equalizer-style)
    for (let i = 0; i < numBands; i++) {
      // Map filter band to video band
      const videoBandIndex = Math.floor((i / numBands) * videoBands);
      let gain = 0;
      
      if (i < bassEnd) {
        // BASS: Brightness affects low frequencies
        // Dark screens reduce bass, bright screens boost bass
        const brightness = this.videoBrightnessData[videoBandIndex] || 0;
        gain = brightness * 12.0; // 0 to 12dB boost for bass
      } else if (i >= midStart && i < midEnd) {
        // MIDS: Color saturation affects mid frequencies
        // Vibrant colors boost mids, desaturated reduces mids
        const colorSat = this.videoColorData[videoBandIndex] || 0;
        gain = colorSat * 15.0; // 0 to 15dB boost for mids
      } else if (i >= highStart) {
        // HIGHS: Motion affects high frequencies
        // Moving objects boost highs, static scenes reduce highs
        const motion = this.videoMotionData[videoBandIndex] || 0;
        gain = motion * 18.0; // 0 to 18dB boost for highs
      }
      
      // Apply gain with smoothing to prevent audio clicks
      const currentGain = this.audioFilters[i].gain.value;
      const targetGain = gain;
      const smoothedGain = currentGain * 0.85 + targetGain * 0.15; // Smooth transition
      this.audioFilters[i].gain.value = smoothedGain;
    }
  }

  /**
   * Helper function for mixing values
   */
  mix(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Setup mouse event handlers for ripple effect
   */
  setupMouseHandlers() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) / rect.width;
      this.mouseY = (e.clientY - rect.top) / rect.height;
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      this.rippleTime = 0; // Reset ripple time on click
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) / rect.width;
      this.mouseY = (e.clientY - rect.top) / rect.height;
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.mouseDown = false;
    });
  }


  update(dt) {
    super.update(dt);
    
    // Update state machine
    if (this.fsm) {
      this.fsm.update(dt);
    }
    
    this.time += dt;
    this.idlePhase += dt * 0.5;
    
    // Update ripple time
    if (this.fsm && this.fsm.is('synesthesia')) {
      this.rippleTime += dt;
    }
    this.colorPhase += dt * CONFIG.wave.colorSpeed;

    // Analyze audio if synesthesia is active
    if (this.fsm && this.fsm.is('synesthesia')) {
      this.analyzeAudio();
    }

    // Update button position (center-based coordinates)
    if (this.startButton && this.fsm && this.fsm.is('intro')) {
      this.startButton.x = this.width / 2;
      this.startButton.y = this.height / 2 + 100;
    }

    // Update settings scene position
    if (this.settingsScene && this.fsm && this.fsm.is('settings')) {
      //this.settingsScene.x = this.width / 2;
      //this.settingsScene.y = this.height / 2;
    }

    // Resize WebGL if needed
    if (this.webglAvailable && this.webgl && 
        (this.webgl.width !== this.width || this.webgl.height !== this.height)) {
      this.webgl.resize(this.width, this.height);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Set Painter context for pipeline rendering
    Painter.setContext(ctx);

    if (this.fsm && this.fsm.is('synesthesia')) {
      if (this.webglAvailable && this.webgl && this.videoTexture) {
        // Render using WebGL shader
        const gl = this.webgl.gl;
        
        // Check if texture is still valid (not deleted)
        if (gl.isTexture(this.videoTexture)) {
          // Ensure program is active before setting uniforms (like day26/spongegl.js)
          this.webgl.useProgram('synesthesia', VERTEX_SHADER, FRAGMENT_SHADER);
          
          // Bind video texture to texture unit 0
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
          
          // Set sampler2D uniform manually (must use glUniform1i, not glUniform1f)
          const program = this.webgl.programs?.get('synesthesia');
          if (program) {
            const textureLocation = gl.getUniformLocation(program, 'uVideoTexture');
            if (textureLocation) {
              gl.uniform1i(textureLocation, 0); // Texture unit 0
            }
          }
        
        // Set shader uniforms (same pattern as day31.js)
        // Note: uVideoTexture is set manually above (sampler2D requires glUniform1i)
        const uniforms = {
          uResolution: [w, h],
          uTime: this.time,
          uBassLevel: this.bassLevel || 0,
          uMidLevel: this.midLevel || 0,
          uHighLevel: this.highLevel || 0,
          uAmplitude: this.amplitude || 0,
          uSilence: (this.amplitude || 0) < 0.1 ? 1.0 : 0.0,
          uDominantColor: [
            this.dominantColor?.r || 0,
            this.dominantColor?.g || 0,
            this.dominantColor?.b || 0
          ],
          uMotionAmount: this.motionAmount || 0,
          uBrightness: this.brightness || 0.5,
          uSpectrumBars: 0, // Disabled to avoid uniform type mismatch error
          uMouse: [this.mouseX || 0, this.mouseY || 0],
          uMouseDown: this.mouseDown ? 1.0 : 0.0,
          uRippleTime: this.rippleTime || 0,
        };
        
        // NOTE: Array uniforms temporarily disabled due to WebGL uniform type mismatch error
        // The WebGLRenderer may not handle array uniforms correctly
        // Spectrum analyzer distortion is disabled by setting uSpectrumBars to 0
        // Uncomment below to re-enable (but may cause the uniform error):
        /*
        // Use smoothed frequency data for shader
        // Always set all 64 elements (shader declares array size 64)
        // Explicitly convert to numbers to avoid WebGL uniform type issues
        if (this.smoothedAudioFreq && this.smoothedVideoFreq) {
          for (let i = 0; i < 64; i++) {
            const audioVal = (i < this.spectrumBars && this.smoothedAudioFreq[i] != null) 
              ? Number(this.smoothedAudioFreq[i]) 
              : 0.0;
            const videoVal = (i < this.spectrumBars && this.smoothedVideoFreq[i] != null) 
              ? Number(this.smoothedVideoFreq[i]) 
              : 0.0;
            uniforms[`uAudioFrequencies[${i}]`] = audioVal;
            uniforms[`uVideoFrequencies[${i}]`] = videoVal;
          }
        } else {
          // Fallback: fill all 64 elements with zeros
          for (let i = 0; i < 64; i++) {
            uniforms[`uAudioFrequencies[${i}]`] = 0.0;
            uniforms[`uVideoFrequencies[${i}]`] = 0.0;
          }
        }
        */
        
        // Set uniforms (same pattern as day31.js)
        this.webgl.setUniforms(uniforms);
          
        // Render
        this.webgl.clear(0, 0, 0, 1);
        this.webgl.render();
          
          // Composite WebGL output onto main canvas
          ctx.drawImage(this.webgl.getCanvas(), 0, 0, w, h);
        }
      } else {
        // Fallback to canvas 2D if WebGL not available
        if (this.currentFrame) {
          ctx.drawImage(this.currentFrame, 0, 0, w, h);
        }
      }

      // Render back button
      if (this.backButton && this.backButton.visible) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        this.backButton.render();
        ctx.restore();
      }
    } else {
      // Render wave animation for intro and settings states
      const cy = h / 2;

      // Motion blur trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // Generate wave points
      const points = this.generateWavePoints(w, h, cy);

      if (points.length >= 2) {
        // Draw the wave
        this.drawWave(ctx, points, w, h, cy);
      }

      // Render button manually after custom rendering (intro state only)
      if (this.fsm && this.fsm.is('intro') && this.startButton) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        this.startButton.render();
        ctx.restore();
      }

      // Render pipeline objects (settings scene, buttons, etc.)
      this.pipeline.render(ctx);

      // Render back button manually (settings state) - on top of everything
      if (this.fsm && this.fsm.is('settings') && this.backButton && this.backButton.visible) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        this.backButton.render();
        ctx.restore();
      }
    }
  }

  /**
   * Generate wave points for idle animation
   */
  generateWavePoints(w, h, cy) {
    const points = [];
    const numPoints = 200;
    const chaos = 0.5; // Moderate animation level

    for (let i = 0; i < numPoints; i++) {
      const x = (i / numPoints) * w;
      const t = this.idlePhase;

      // Multiple sine waves for organic movement
      const v = Math.sin(i * 0.05 + t * 0.8) * chaos * 0.3 +
                Math.sin(i * 0.12 - t * 1.2) * chaos * 0.2 +
                Math.sin(i * 0.03 + t * 0.3) * 0.05 +
                (Math.random() - 0.5) * chaos * 0.1;

      const y = cy + v * h * 0.4;
      points.push({ x, y, v });
    }

    return points;
  }

  /**
   * Draw the wave with effects
   */
  drawWave(ctx, points, w, h, cy) {
    ctx.save();

    // Color variation based on phase
    const hue = CONFIG.hue + Math.sin(this.colorPhase) * CONFIG.hueRange;
    const saturation = 70;
    const lightness = 50;

    // Glow effect
    ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.shadowBlur = CONFIG.glowAmount;

    ctx.lineWidth = CONFIG.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    // Draw the wave
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      // Smooth curves
      const cpX = p1.x + (p2.x - p1.x) * 0.5;
      const cpY = p1.y + (p2.y - p1.y) * 0.5;
      ctx.quadraticCurveTo(p1.x, p1.y, cpX, cpY);
    }

    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();

    // Bright core overlay
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = CONFIG.lineWidth * 0.5;
    ctx.strokeStyle = `hsl(${hue}, 100%, 90%)`;
    ctx.stroke();

    ctx.restore();
  }

  stop() {
    // Call cleanupSynesthesia to ensure all synesthesia resources are cleaned up
    this.cleanupSynesthesia();
    
    // Pause and stop video element if it exists
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement.src = '';
    }
    
    // Stop media streams
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    
    // Stop audio source if it exists
    if (this.audioSource) {
      try {
        if (this.audioSource.stop) {
          this.audioSource.stop();
        }
        if (this.audioSource.disconnect) {
          this.audioSource.disconnect();
        }
      } catch (e) {
        // Ignore errors (may already be stopped)
      }
      this.audioSource = null;
    }
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {
        // Ignore errors
      });
      this.audioContext = null;
    }
    
    // Clean up WebGL
    if (this.webglAvailable && this.webgl) {
      if (this.videoTexture) {
        const gl = this.webgl.gl;
        gl.deleteTexture(this.videoTexture);
        this.videoTexture = null;
      }
      this.webgl.destroy();
      this.webgl = null;
    }

    // Clean up file inputs
    if (this.videoFileInput && this.videoFileInput.parentNode) {
      this.videoFileInput.parentNode.removeChild(this.videoFileInput);
      this.videoFileInput = null;
    }
    if (this.audioFileInput && this.audioFileInput.parentNode) {
      this.audioFileInput.parentNode.removeChild(this.audioFileInput);
      this.audioFileInput = null;
    }
    
    super.stop();
  }
}

/**
 * Create Day 30 visualization
 * 
 * Factory function that creates and starts the Day 30 demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {Day30Demo} returns.game - The game instance
 */
export default function day30(canvas) {
  const game = new Day30Demo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game,
  };
}
