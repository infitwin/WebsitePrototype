/**
 * AudioRecorder - Vanilla JS Implementation
 * 
 * Ported from ui-studio React component for WebsitePrototype
 * Handles microphone capture and streaming using MediaRecorder API
 * Implements Phase 1: Audio recording with 100ms chunks as specified
 */

class AudioRecorder {
  constructor(config = {}) {
    this.logger = createAudioLogger('AudioRecorder');
    
    // Configuration
    this.config = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 16000,
      chunkInterval: 100, // 100ms chunks as specified
      ...config
    };
    
    // State
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.isRecording = false;
    this.audioContext = null;
    this.analyser = null;
    
    // Callbacks
    this.onAudioChunk = null;
    this.onError = null;
    this.onStateChange = null;
    
    // Performance tracking
    this.chunkCount = 0;
    this.startTime = null;
    
    this.logger.info('AudioRecorder initialized', { config: this.config });
  }

  // Request microphone permission and initialize
  async initialize() {
    try {
      this.logger.info('Requesting microphone permission');
      
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });
      
      this.logger.info('Microphone permission granted');
      
      // Setup audio context for visualization
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      
      // Check supported mime types
      const supportedType = this.getSupportedMimeType();
      if (supportedType) {
        this.config.mimeType = supportedType;
        this.logger.info('Using mime type', { mimeType: supportedType });
      }
      
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize audio recorder', error);
      if (this.onError) {
        this.onError({
          type: 'PERMISSION_DENIED',
          message: 'Microphone permission denied',
          error
        });
      }
      throw error;
    }
  }

  // Get supported mime type
  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return null;
  }

  // Start recording
  start(onAudioChunk, onError, onStateChange) {
    if (this.isRecording) {
      this.logger.warn('Already recording');
      return;
    }

    if (!this.mediaStream) {
      this.logger.error('Not initialized - call initialize() first');
      throw new Error('AudioRecorder not initialized');
    }

    // Set callbacks
    this.onAudioChunk = onAudioChunk;
    this.onError = onError;
    this.onStateChange = onStateChange;
    
    try {
      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: this.config.mimeType,
        audioBitsPerSecond: this.config.audioBitsPerSecond
      });
      
      // Handle data available
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          this.handleAudioChunk(event.data);
        }
      };
      
      // Handle errors
      this.mediaRecorder.onerror = (error) => {
        this.logger.error('MediaRecorder error', error);
        if (this.onError) {
          this.onError({
            type: 'RECORDING_ERROR',
            message: 'Recording failed',
            error
          });
        }
      };
      
      // Handle state changes
      this.mediaRecorder.onstart = () => {
        this.logger.audio('recording_start');
        this.isRecording = true;
        this.startTime = Date.now();
        this.chunkCount = 0;
        if (this.onStateChange) {
          this.onStateChange({ recording: true });
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const duration = this.startTime ? Date.now() - this.startTime : 0;
        this.logger.audio('recording_stop', { 
          duration,
          chunks: this.chunkCount 
        });
        this.isRecording = false;
        if (this.onStateChange) {
          this.onStateChange({ recording: false });
        }
      };
      
      // Start recording with chunk interval
      this.mediaRecorder.start(this.config.chunkInterval);
      
    } catch (error) {
      this.logger.error('Failed to start recording', error);
      if (this.onError) {
        this.onError({
          type: 'START_ERROR',
          message: 'Failed to start recording',
          error
        });
      }
      throw error;
    }
  }

  // Stop recording
  stop() {
    if (!this.isRecording || !this.mediaRecorder) {
      this.logger.warn('Not recording');
      return;
    }

    try {
      this.mediaRecorder.stop();
      this.logger.info('Recording stopped');
    } catch (error) {
      this.logger.error('Failed to stop recording', error);
    }
  }

  // Handle audio chunk
  async handleAudioChunk(blob) {
    try {
      const startTime = Date.now();
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        const processingTime = Date.now() - startTime;
        
        this.chunkCount++;
        this.logger.audio('chunk_processed', {
          size: blob.size,
          chunkNumber: this.chunkCount,
          processingTime
        });
        this.logger.performance('chunk_processing', processingTime);
        
        // Call callback with audio data
        if (this.onAudioChunk) {
          this.onAudioChunk({
            audio: base64Audio,
            mimeType: this.config.mimeType,
            timestamp: Date.now(),
            chunkNumber: this.chunkCount,
            size: blob.size
          });
        }
      };
      
      reader.onerror = (error) => {
        this.logger.error('Failed to read audio chunk', error);
        if (this.onError) {
          this.onError({
            type: 'CHUNK_ERROR',
            message: 'Failed to process audio chunk',
            error
          });
        }
      };
      
    } catch (error) {
      this.logger.error('Error handling audio chunk', error);
    }
  }

  // Get audio levels for visualization
  getAudioLevels() {
    if (!this.analyser) return null;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
    
    return {
      levels: dataArray,
      average: average / 255, // Normalize to 0-1
      peak: Math.max(...dataArray) / 255
    };
  }

  // Clean up resources
  dispose() {
    this.logger.info('Disposing AudioRecorder');
    
    // Stop recording if active
    if (this.isRecording) {
      this.stop();
    }
    
    // Stop all tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    // Clear references
    this.mediaRecorder = null;
    this.analyser = null;
    this.onAudioChunk = null;
    this.onError = null;
    this.onStateChange = null;
  }

  // Get recorder status
  getStatus() {
    return {
      initialized: !!this.mediaStream,
      recording: this.isRecording,
      mimeType: this.config.mimeType,
      chunks: this.chunkCount,
      duration: this.isRecording && this.startTime ? Date.now() - this.startTime : 0
    };
  }

  // Check if browser supports audio recording
  static isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder);
  }

  // Get available audio input devices
  async getAudioDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      this.logger.error('Failed to enumerate audio devices', error);
      return [];
    }
  }
}

// Factory function for easy creation
function createAudioRecorder(config = {}) {
  return new AudioRecorder(config);
}

// Export for use in other modules
window.AudioRecorder = AudioRecorder;
window.createAudioRecorder = createAudioRecorder;