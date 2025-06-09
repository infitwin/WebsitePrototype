/**
 * Message builder utility for constructing properly formatted WebSocket messages
 * Ported from ui-studio to vanilla JS for WebsitePrototype
 * 
 * CRITICAL: Message formats must match exactly with ui-studio (DO NOT MODIFY)
 */

/**
 * Build a StartInterview message (UI -> Orchestrator)
 */
function buildStartInterviewMessage(params) {
  const {
    interviewId = `pending_${Date.now()}`,
    userId,
    twinId,
    subject,
    interviewType = 'voice',
    correlationId = `corr_${Date.now()}`,
    additionalParams = {}
  } = params;

  return {
    type: 'StartInterview',
    payload: {
      metadata: {
        interviewId,
        correlationId,
        userId,
        twinId,
        timestamp: new Date().toISOString(),
        source: 'websiteprototype', // Changed from 'ui-studio'
        version: '2.0'
      },
      data: {
        subject,
        interviewType,
        sessionParams: {
          autoRecord: true,
          enableTranscription: true,
          language: 'en-US',
          maxDuration: 3600, // 1 hour
          ...(additionalParams.sessionParams || {})
        },
        userContext: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: navigator.language,
          userAgent: navigator.userAgent,
          ...(additionalParams.userContext || {})
        }
      }
    }
  };
}

/**
 * Build a SendAudioChunk message (UI -> AudioProcessingService)
 * For when audio service is ready
 */
function buildSendAudioChunkMessage(params) {
  const {
    interviewId,
    sessionId,
    chunkIndex,
    audioData, // ArrayBuffer or Blob
    isFirstChunk = false,
    isLastChunk = false,
    correlationId = `corr_${Date.now()}`
  } = params;

  // For first chunk, include audio config in header
  const audioConfig = isFirstChunk ? {
    sampleRate: 16000,
    channels: 1,
    encoding: 'LINEAR16',
    languageCode: 'en-US'
  } : null;

  return {
    type: 'SendAudioChunk',
    payload: {
      metadata: {
        interviewId,
        sessionId,
        correlationId,
        chunkIndex,
        timestamp: new Date().toISOString(),
        isFirstChunk,
        isLastChunk
      },
      data: {
        audioData, // Binary data will be handled by WebSocket
        audioConfig,
        chunkMetadata: {
          size: audioData.byteLength || audioData.size,
          duration: null // Can be calculated if needed
        }
      }
    }
  };
}

/**
 * Build a RequestTextToSpeech message (UI -> AudioProcessingService)
 * For when audio service is ready
 */
function buildRequestTTSMessage(params) {
  const {
    interviewId,
    sessionId,
    text,
    voice = 'en-US-Standard-C',
    speed = 1.0,
    correlationId = `corr_${Date.now()}`
  } = params;

  return {
    type: 'RequestTextToSpeech',
    payload: {
      metadata: {
        interviewId,
        sessionId,
        correlationId,
        timestamp: new Date().toISOString()
      },
      data: {
        text,
        ttsConfig: {
          voice,
          speed,
          pitch: 0,
          volumeGainDb: 0,
          speakingRate: speed,
          effectsProfileId: ['headphone-class-device']
        },
        audioConfig: {
          audioEncoding: 'MP3',
          sampleRateHertz: 24000
        }
      }
    }
  };
}

/**
 * Build a heartbeat message
 */
function buildHeartbeatMessage() {
  return {
    type: 'heartbeat',
    payload: {
      metadata: {
        timestamp: new Date().toISOString()
      },
      data: {
        clientTime: Date.now(),
        sequenceNumber: Math.floor(Math.random() * 1000000)
      }
    }
  };
}

/**
 * Parse incoming messages from Orchestrator
 */
function parseOrchestratorMessage(message) {
  const { type, payload = {} } = message;
  const { metadata = {}, data = {} } = payload;

  switch (type) {
    case 'InterviewStarted':
      return {
        type,
        interviewId: metadata.interviewId,
        sessionId: metadata.sessionId,
        correlationId: metadata.correlationId,
        status: data.status,
        message: data.message,
        interviewDetails: data.interviewDetails,
        sessionDetails: data.sessionDetails
      };

    case 'SendQuestion':
      return {
        type,
        interviewId: metadata.interviewId,
        sessionId: metadata.sessionId,
        correlationId: metadata.correlationId,
        turnNumber: metadata.turnNumber,
        questionText: data.questionText,
        context: data.context,
        followUpPrompts: data.followUpPrompts,
        questionMetadata: data.questionMetadata
      };

    case 'ReturnAudioChunks':
      // Audio service pending
      return {
        type,
        interviewId: metadata.interviewId,
        correlationId: metadata.correlationId,
        chunkIndex: metadata.chunkIndex,
        isLastChunk: metadata.isLastChunk,
        audioData: data.audioData,
        audioMetadata: data.audioMetadata
      };

    case 'error':
      return {
        type,
        error: message.error,
        message: message.message,
        details: message.details,
        correlationId: metadata.correlationId
      };

    default:
      return message;
  }
}

/**
 * Generate a correlation ID
 */
function generateCorrelationId() {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate an interview ID
 */
function generateInterviewId() {
  return `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export for use in other modules
window.buildStartInterviewMessage = buildStartInterviewMessage;
window.buildSendAudioChunkMessage = buildSendAudioChunkMessage;
window.buildRequestTTSMessage = buildRequestTTSMessage;
window.buildHeartbeatMessage = buildHeartbeatMessage;
window.parseOrchestratorMessage = parseOrchestratorMessage;
window.generateCorrelationId = generateCorrelationId;
window.generateInterviewId = generateInterviewId;