'use client';

/**
 * Deepgram Speech-to-Text Service
 * Real-time transcription with Bible keyword boosting
 * Optimized for African/Ghanaian English accents
 */

export interface DeepgramConfig {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

interface DeepgramResult {
  channel: {
    alternatives: Array<{
      transcript: string;
      confidence: number;
    }>;
  };
  is_final: boolean;
  speech_final: boolean;
}

export class DeepgramService {
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private config: DeepgramConfig;
  private isRunning = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(config: DeepgramConfig) {
    this.config = config;
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'WebSocket' in window &&
      'AudioContext' in window &&
      navigator.mediaDevices?.getUserMedia !== undefined;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      // Get Deepgram connection config from our API
      const response = await fetch('/api/deepgram');
      if (!response.ok) {
        const data = await response.json();
        if (data.error?.includes('not configured')) {
          // Fall back to browser speech recognition
          throw new Error('Deepgram not configured - using browser speech recognition');
        }
        throw new Error('Failed to get Deepgram config');
      }

      const { wsUrl, apiKey } = await response.json();

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio processing with noise reduction
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create audio processing chain for better quality
      const audioProcessor = await this.createAudioProcessor(source);

      // Connect to Deepgram WebSocket
      this.ws = new WebSocket(wsUrl, ['token', apiKey]);

      this.ws.onopen = () => {
        this.isRunning = true;
        this.reconnectAttempts = 0;
        this.config.onStart();

        // Start sending audio
        audioProcessor.connect(this.audioContext!.destination);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'Results') {
            const result = data as DeepgramResult;
            const transcript = result.channel.alternatives[0]?.transcript;

            if (transcript) {
              // Deepgram uses speech_final for utterance end, is_final for chunk
              const isFinal = result.speech_final || result.is_final;
              this.config.onTranscript(transcript, isFinal);
            }
          }
        } catch (e) {
          console.error('Error parsing Deepgram response:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        this.config.onError('Connection error - check your internet');
      };

      this.ws.onclose = (event) => {
        this.isRunning = false;

        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          // Abnormal close, try to reconnect
          this.reconnectAttempts++;
          console.log(`Deepgram connection lost, reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.start(), 1000);
        } else {
          this.cleanup();
          this.config.onEnd();
        }
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start transcription';
      this.config.onError(message);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Create audio processor with noise reduction and normalization
   */
  private async createAudioProcessor(source: MediaStreamAudioSourceNode): Promise<ScriptProcessorNode> {
    const context = this.audioContext!;

    // Create a high-pass filter to remove low frequency rumble (< 80Hz)
    const highpass = context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 80;

    // Create a low-pass filter to remove high frequency noise (> 8000Hz)
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 8000;

    // Create compressor for consistent volume levels
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Create gain node for normalization
    const gain = context.createGain();
    gain.gain.value = 1.5; // Slight boost

    // Connect the processing chain
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(gain);

    // Create script processor for sending audio to Deepgram
    // Using 4096 buffer size for balance between latency and performance
    this.processor = context.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (event) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = event.inputBuffer.getChannelData(0);

      // Convert Float32Array to Int16Array (linear16 PCM)
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        // Clamp and convert to 16-bit PCM
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Send to Deepgram
      this.ws.send(pcmData.buffer);
    };

    gain.connect(this.processor);

    return this.processor;
  }

  stop(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send close message to Deepgram
      this.ws.send(JSON.stringify({ type: 'CloseStream' }));
      this.ws.close(1000, 'User stopped recording');
    }
    this.cleanup();
    this.config.onEnd();
  }

  abort(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.isRunning = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.ws = null;
  }
}
