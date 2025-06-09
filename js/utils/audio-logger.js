/**
 * Audio Integration Logger - Vanilla JS Implementation
 * 
 * Ported from ui-studio for WebsitePrototype
 * Provides detailed logging for audio WebSocket connections and processing
 * All logs are prefixed with component names for easy filtering
 */

class AudioLogger {
  constructor(componentName) {
    this.componentName = componentName;
    this.logHistory = [];
    this.maxHistorySize = 1000;
    
    // Enable detailed logging based on local storage or development mode
    this.isEnabled = localStorage.getItem('AUDIO_DEBUG') === 'true' ||
                    location.hostname === 'localhost';
  }

  _formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${this.componentName}] [${level}] ${message}`;
    
    // Store in history
    this.logHistory.push({
      timestamp,
      component: this.componentName,
      level,
      message,
      data
    });
    
    // Keep history size manageable
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
    
    return { formatted, data };
  }

  debug(message, data = null) {
    if (!this.isEnabled) return;
    const { formatted, data: logData } = this._formatMessage('DEBUG', message, data);
    console.log(`🔍 ${formatted}`, logData || '');
  }

  info(message, data = null) {
    const { formatted, data: logData } = this._formatMessage('INFO', message, data);
    console.log(`ℹ️ ${formatted}`, logData || '');
  }

  warn(message, data = null) {
    const { formatted, data: logData } = this._formatMessage('WARN', message, data);
    console.warn(`⚠️ ${formatted}`, logData || '');
  }

  error(message, error = null) {
    const { formatted } = this._formatMessage('ERROR', message, error);
    console.error(`❌ ${formatted}`, error || '');
  }

  websocket(event, data = null) {
    if (!this.isEnabled) return;
    const icons = {
      connecting: '🔄',
      connected: '✅',
      disconnected: '🔌',
      message: '📨',
      error: '❌',
      reconnecting: '🔁'
    };
    const icon = icons[event] || '📡';
    this.debug(`${icon} WebSocket ${event}`, data);
  }

  audio(event, data = null) {
    if (!this.isEnabled) return;
    const icons = {
      recording_start: '🎤',
      recording_stop: '⏹️',
      chunk_processed: '📦',
      chunk_ended: '📋',
      transcript_received: '📝',
      tts_requested: '🔊',
      tts_queued: '📥',
      tts_playing: '▶️',
      playback_stopped: '⏹️',
      playback_paused: '⏸️',
      playback_resumed: '▶️',
      error: '❌'
    };
    const icon = icons[event] || '🎵';
    this.debug(`${icon} Audio ${event}`, data);
  }

  performance(metric, value, unit = 'ms') {
    if (!this.isEnabled) return;
    this.debug(`⚡ Performance: ${metric} = ${value}${unit}`);
  }

  getHistory(filter = {}) {
    let filtered = this.logHistory;
    
    if (filter.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }
    
    if (filter.component) {
      filtered = filtered.filter(log => log.component === filter.component);
    }
    
    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
    }
    
    return filtered;
  }

  downloadLogs() {
    const logs = this.getHistory();
    const content = JSON.stringify(logs, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-logs-${this.componentName}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearHistory() {
    this.logHistory = [];
    this.info('Log history cleared');
  }
}

// Factory function to create loggers
function createAudioLogger(componentName) {
  return new AudioLogger(componentName);
}

// Global logger instance for shared logging
const globalAudioLogger = new AudioLogger('AudioIntegration');

// Enable debug mode from console
window.enableAudioDebug = () => {
  localStorage.setItem('AUDIO_DEBUG', 'true');
  console.log('🎤 Audio debug mode enabled. Refresh page to see detailed logs.');
};

window.disableAudioDebug = () => {
  localStorage.removeItem('AUDIO_DEBUG');
  console.log('🔇 Audio debug mode disabled.');
};

window.downloadAudioLogs = () => {
  globalAudioLogger.downloadLogs();
};

// Export for use in other modules
window.AudioLogger = AudioLogger;
window.createAudioLogger = createAudioLogger;
window.globalAudioLogger = globalAudioLogger;