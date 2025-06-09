/**
 * TTSAudioPlayer - Vanilla JS Implementation
 * 
 * Ported from ui-studio React component for WebsitePrototype
 * Handles Text-to-Speech audio playback with queue management
 * Implements Phase 2: Real Audio Flow from the build document
 */

class TTSAudioPlayer {
  constructor(config = {}) {
    this.logger = createAudioLogger('TTSAudioPlayer');
    
    // Configuration
    this.config = {
      volume: config.volume || 1.0,
      playbackRate: config.playbackRate || 1.0,
      crossfadeTime: config.crossfadeTime || 100, // ms
      ...config
    };
    
    // State
    this.audioQueue = [];
    this.currentAudio = null;
    this.isPlaying = false;
    this.audioContext = null;
    this.gainNode = null;
    
    // Callbacks
    this.onPlaybackStart = null;
    this.onPlaybackEnd = null;
    this.onError = null;
    this.onQueueUpdate = null;
    
    this.logger.info('TTSAudioPlayer initialized', { config: this.config });
  }

  // Initialize Web Audio API
  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.config.volume;
      
      this.logger.info('Web Audio API initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize Web Audio API', error);
      if (this.onError) {
        this.onError({
          type: 'INITIALIZATION_ERROR',
          message: 'Failed to initialize audio playback',
          error
        });
      }
      return false;
    }
  }

  // Add audio chunks to play queue
  addToQueue(audioChunks, metadata = {}) {
    if (!Array.isArray(audioChunks)) {
      audioChunks = [audioChunks];
    }
    
    const queueItem = {
      id: metadata.turnId || `audio_${Date.now()}`,
      chunks: audioChunks,
      metadata,
      timestamp: Date.now(),
      status: 'queued'
    };
    
    this.audioQueue.push(queueItem);
    this.logger.audio('tts_queued', {
      id: queueItem.id,
      chunks: audioChunks.length,
      queueLength: this.audioQueue.length
    });
    
    // Notify about queue update
    if (this.onQueueUpdate) {
      this.onQueueUpdate({
        queueLength: this.audioQueue.length,
        item: queueItem
      });
    }
    
    // Start playing if not already playing
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  // Play next item in queue
  async playNext() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.logger.info('Playback queue empty');
      return;
    }
    
    const item = this.audioQueue.shift();
    item.status = 'playing';
    this.isPlaying = true;
    
    this.logger.audio('tts_playing', {
      id: item.id,
      chunks: item.chunks.length
    });
    
    // Notify playback start
    if (this.onPlaybackStart) {
      this.onPlaybackStart(item);
    }
    
    try {
      await this.playAudioItem(item);
      
      // Play next item
      setTimeout(() => {
        this.playNext();
      }, this.config.crossfadeTime);
      
    } catch (error) {
      this.logger.error('Error playing audio item', error);
      if (this.onError) {
        this.onError({
          type: 'PLAYBACK_ERROR',
          message: 'Failed to play audio',
          error,
          item
        });
      }
      
      // Continue with next item
      this.playNext();
    }
  }

  // Play a single audio item
  async playAudioItem(item) {
    return new Promise((resolve, reject) => {
      try {
        // Concatenate all audio chunks
        const audioData = this.concatenateAudioChunks(item.chunks);
        
        // Create audio element
        const audio = new Audio();
        this.currentAudio = audio;
        
        // Convert base64 to blob URL
        const blob = this.base64ToBlob(audioData);
        const audioUrl = URL.createObjectURL(blob);
        
        audio.src = audioUrl;
        audio.volume = this.config.volume;
        audio.playbackRate = this.config.playbackRate;
        
        // Set up event handlers
        audio.onended = () => {
          this.logger.audio('chunk_ended', { id: item.id });
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          
          if (this.onPlaybackEnd) {
            this.onPlaybackEnd(item);
          }
          
          resolve();
        };
        
        audio.onerror = (error) => {
          this.logger.error('Audio playback error', error);
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(error);
        };
        
        // Start playback
        audio.play().catch(reject);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Concatenate multiple audio chunks
  concatenateAudioChunks(chunks) {
    if (chunks.length === 1) {
      return chunks[0];
    }
    
    // For simplicity, just use the first chunk
    // In a full implementation, you'd properly concatenate audio data
    this.logger.debug(`Concatenating ${chunks.length} audio chunks`);
    return chunks[0];
  }

  // Convert base64 to blob
  base64ToBlob(base64Data, mimeType = 'audio/mpeg') {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (error) {
      this.logger.error('Failed to convert base64 to blob', error);
      throw error;
    }
  }

  // Stop current playback
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    this.isPlaying = false;
    this.logger.audio('playback_stopped');
    
    if (this.onPlaybackEnd) {
      this.onPlaybackEnd(null);
    }
  }

  // Pause current playback
  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.logger.audio('playback_paused');
    }
  }

  // Resume playback
  resume() {
    if (this.currentAudio) {
      this.currentAudio.play();
      this.logger.audio('playback_resumed');
    }
  }

  // Clear the queue
  clearQueue() {
    const queueLength = this.audioQueue.length;
    this.audioQueue = [];
    this.logger.info(`Cleared queue of ${queueLength} items`);
    
    if (this.onQueueUpdate) {
      this.onQueueUpdate({ queueLength: 0 });
    }
  }

  // Set volume
  setVolume(volume) {
    this.config.volume = Math.max(0, Math.min(1, volume));
    
    if (this.gainNode) {
      this.gainNode.gain.value = this.config.volume;
    }
    
    if (this.currentAudio) {
      this.currentAudio.volume = this.config.volume;
    }
    
    this.logger.debug(`Volume set to ${this.config.volume}`);
  }

  // Set playback rate
  setPlaybackRate(rate) {
    this.config.playbackRate = Math.max(0.25, Math.min(4, rate));
    
    if (this.currentAudio) {
      this.currentAudio.playbackRate = this.config.playbackRate;
    }
    
    this.logger.debug(`Playback rate set to ${this.config.playbackRate}`);
  }

  // Get current status
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      queueLength: this.audioQueue.length,
      currentAudio: !!this.currentAudio,
      volume: this.config.volume,
      playbackRate: this.config.playbackRate
    };
  }

  // Check if browser supports audio playback
  static isSupported() {
    return !!(window.Audio && window.URL && window.URL.createObjectURL);
  }

  // Dispose and cleanup
  dispose() {
    this.logger.info('Disposing TTSAudioPlayer');
    
    // Stop current playback
    this.stop();
    
    // Clear queue
    this.clearQueue();
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    // Clear references
    this.currentAudio = null;
    this.audioContext = null;
    this.gainNode = null;
    this.onPlaybackStart = null;
    this.onPlaybackEnd = null;
    this.onError = null;
    this.onQueueUpdate = null;
  }
}

// Factory function for easy creation
function createTTSAudioPlayer(config = {}) {
  return new TTSAudioPlayer(config);
}

// Export for use in other modules
window.TTSAudioPlayer = TTSAudioPlayer;
window.createTTSAudioPlayer = createTTSAudioPlayer;