/**
 * AudioRecorder LINEAR16 - Google Speech-to-Text Optimized Implementation
 * 
 * Captures raw PCM audio data in LINEAR16 format for optimal Google Speech-to-Text compatibility
 * Replaces WEBM_OPUS format to eliminate AudioProcessingError issues
 * Based on Google's recommendations: 16000 Hz, 16-bit signed PCM, mono
 */

class AudioRecorderLinear16 {
  constructor(config = {}) {
    this.logger = createAudioLogger('AudioRecorderLinear16');
    
    // Configuration - optimized for Google Speech-to-Text
    this.config = {
      sampleRate: 16000,        // Google's recommended sample rate
      channels: 1,              // Mono audio 
      bitDepth: 16,            // 16-bit signed integers
      chunkInterval: 100,       // 100ms chunks = 1600 samples at 16kHz
      encoding: 'LINEAR16',     // Raw PCM format
      bufferSize: 4096,        // AudioContext buffer size
      ...config
    };
    
    // Calculate samples per chunk (100ms at 16kHz = 1600 samples)
    this.samplesPerChunk = Math.floor(this.config.sampleRate * this.config.chunkInterval / 1000);
    this.bytesPerChunk = this.samplesPerChunk * 2; // 16-bit = 2 bytes per sample
    
    // State
    this.mediaStream = null;
    this.audioContext = null;
    this.sourceNode = null;
    this.processorNode = null;
    this.analyser = null;
    this.isRecording = false;
    
    // Audio data buffer
    this.audioBuffer = [];
    this.chunkCount = 0;
    this.startTime = null;
    
    // Callbacks
    this.onAudioChunk = null;
    this.onError = null;
    this.onStateChange = null;
    
    this.logger.info('AudioRecorderLinear16 initialized', { 
      config: this.config,
      samplesPerChunk: this.samplesPerChunk,
      bytesPerChunk: this.bytesPerChunk
    });
  }

  // Request microphone permission and initialize AudioContext
  async initialize() {
    try {
      this.logger.info('Requesting microphone permission for LINEAR16 capture');
      
      // Request microphone access with specific constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels
        }
      });
      
      this.logger.info('Microphone permission granted');
      
      // Create AudioContext with specific sample rate
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });
      
      // Ensure AudioContext is using correct sample rate
      if (this.audioContext.sampleRate !== this.config.sampleRate) {
        this.logger.warn('AudioContext sample rate mismatch', {
          requested: this.config.sampleRate,
          actual: this.audioContext.sampleRate
        });
      }
      
      // Create audio processing chain
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create analyser for visualization (optional)
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.sourceNode.connect(this.analyser);
      
      // Create ScriptProcessor for raw audio data capture
      // Note: ScriptProcessor is deprecated but still widely supported
      // TODO: Migrate to AudioWorklet when browser support improves
      this.processorNode = this.audioContext.createScriptProcessor(
        this.config.bufferSize, 
        this.config.channels, 
        this.config.channels
      );
      
      // Set up audio processing callback
      this.processorNode.onaudioprocess = (event) => {
        if (this.isRecording) {
          this.processAudioData(event.inputBuffer);
        }
      };
      
      // Connect audio processing chain
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
      
      this.logger.info('AudioContext initialized successfully', {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state,
        bufferSize: this.config.bufferSize
      });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize LINEAR16 audio recorder', error);
      if (this.onError) {
        this.onError({
          type: 'INITIALIZATION_ERROR',
          message: 'Failed to initialize LINEAR16 audio capture',
          error
        });
      }
      throw error;
    }
  }

  // Start recording LINEAR16 audio
  async start(onAudioChunk, onError, onStateChange) {
    if (!this.mediaStream || !this.audioContext) {
      this.logger.error('Not initialized - call initialize() first');
      throw new Error('AudioRecorderLinear16 not initialized');
    }

    // Set callbacks
    this.onAudioChunk = onAudioChunk;
    this.onError = onError;
    this.onStateChange = onStateChange;
    
    try {
      // Resume AudioContext if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        this.logger.info('AudioContext resumed');
      }
      
      // Reset state
      this.audioBuffer = [];
      this.chunkCount = 0;
      this.startTime = Date.now();
      
      // Start recording
      this.isRecording = true;
      
      // Notify state change
      if (this.onStateChange) {
        this.onStateChange({ recording: true, format: 'LINEAR16' });
      }
      
      this.logger.audio('recording_start', { format: 'LINEAR16', sampleRate: this.config.sampleRate });
      
    } catch (error) {
      this.logger.error('Failed to start LINEAR16 recording', error);
      if (this.onError) {
        this.onError({
          type: 'START_ERROR',
          message: 'Failed to start LINEAR16 recording',
          error
        });
      }
      throw error;
    }
  }

  // Process raw audio data from AudioContext
  processAudioData(inputBuffer) {
    try {
      // Get audio data from first channel (mono)
      const audioData = inputBuffer.getChannelData(0);
      
      // Add samples to buffer
      for (let i = 0; i < audioData.length; i++) {
        this.audioBuffer.push(audioData[i]);
      }
      
      // Process complete chunks
      while (this.audioBuffer.length >= this.samplesPerChunk) {
        this.processChunk();
      }
      
    } catch (error) {
      this.logger.error('Error processing audio data', error);
      if (this.onError) {
        this.onError({
          type: 'PROCESSING_ERROR',
          message: 'Failed to process audio data',
          error
        });
      }
    }
  }

  // Process a complete audio chunk
  processChunk() {
    // Extract chunk samples
    const chunkSamples = this.audioBuffer.splice(0, this.samplesPerChunk);
    
    // Convert Float32 samples to 16-bit signed integers
    const int16Array = new Int16Array(chunkSamples.length);
    for (let i = 0; i < chunkSamples.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit signed integer
      const sample = Math.max(-1, Math.min(1, chunkSamples[i]));
      int16Array[i] = Math.round(sample * 32767);
    }
    
    // Create binary data (ArrayBuffer)
    const binaryData = int16Array.buffer;
    
    // Create chunk metadata
    const chunkInfo = {
      chunkNumber: this.chunkCount++,
      size: binaryData.byteLength,
      samples: chunkSamples.length,
      format: 'LINEAR16',
      sampleRate: this.config.sampleRate,
      channels: this.config.channels,
      timestamp: Date.now(),
      audio: binaryData // Raw binary PCM data
    };
    
    // Log chunk info
    this.logger.audio('chunk_generated', {
      chunkNumber: chunkInfo.chunkNumber,
      size: chunkInfo.size,
      samples: chunkInfo.samples,
      format: chunkInfo.format
    });
    
    // Send chunk to callback
    if (this.onAudioChunk) {
      this.onAudioChunk(chunkInfo);
    }
  }

  // Stop recording
  stop() {
    if (!this.isRecording) {
      this.logger.warn('Not currently recording');
      return;
    }

    try {
      this.isRecording = false;
      
      // Process any remaining samples
      if (this.audioBuffer.length > 0) {
        // Pad to minimum chunk size or process partial chunk
        if (this.audioBuffer.length > this.samplesPerChunk / 2) {
          // Pad with zeros to reach full chunk size
          while (this.audioBuffer.length < this.samplesPerChunk) {
            this.audioBuffer.push(0);
          }
          this.processChunk();
        }
        // Clear remaining samples
        this.audioBuffer = [];
      }
      
      // Notify state change
      if (this.onStateChange) {
        this.onStateChange({ recording: false, format: 'LINEAR16' });
      }
      
      const duration = Date.now() - this.startTime;
      this.logger.audio('recording_stop', {
        duration,
        totalChunks: this.chunkCount,
        format: 'LINEAR16'
      });
      
    } catch (error) {
      this.logger.error('Error stopping LINEAR16 recording', error);
      if (this.onError) {
        this.onError({
          type: 'STOP_ERROR',
          message: 'Failed to stop LINEAR16 recording',
          error
        });
      }
    }
  }

  // Get recording state
  getState() {
    return {
      isRecording: this.isRecording,
      isInitialized: !!(this.mediaStream && this.audioContext),
      format: 'LINEAR16',
      sampleRate: this.config.sampleRate,
      channels: this.config.channels,
      chunkCount: this.chunkCount,
      audioContextState: this.audioContext?.state
    };
  }

  // Get supported formats (for compatibility)
  getSupportedFormats() {
    return ['LINEAR16']; // Only LINEAR16 is supported by this implementation
  }

  // Get audio levels for visualization
  getAudioLevels() {
    if (!this.analyser) return { volume: 0, frequency: new Uint8Array(0) };

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const volume = sum / bufferLength / 255;

    return {
      volume,
      frequency: dataArray
    };
  }

  // Cleanup resources
  destroy() {
    try {
      // Stop recording
      this.stop();
      
      // Disconnect audio nodes
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      
      if (this.processorNode) {
        this.processorNode.disconnect();
        this.processorNode = null;
      }
      
      if (this.analyser) {
        this.analyser.disconnect();
        this.analyser = null;
      }
      
      // Close AudioContext
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      
      // Stop media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      // Clear buffers
      this.audioBuffer = [];
      
      this.logger.info('AudioRecorderLinear16 destroyed');
      
    } catch (error) {
      this.logger.error('Error destroying AudioRecorderLinear16', error);
    }
  }
}

// Export for use in other modules
window.AudioRecorderLinear16 = AudioRecorderLinear16;