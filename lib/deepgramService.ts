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
      // Get microphone access first
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Use native sample rate then resample — forcing 16000 can throw on some browsers
      this.audioContext = new AudioContext();
      const nativeSampleRate = this.audioContext.sampleRate;
      console.log(`AudioContext sample rate: ${nativeSampleRate}`);
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create audio processing chain for better quality
      const audioProcessor = await this.createAudioProcessor(source);

      // Connect to our server-side WebSocket proxy (handles Deepgram auth server-side)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const proxyUrl = `${protocol}//${window.location.host}/api/deepgram-ws`;
      console.log(`[Deepgram] Connecting to proxy: ${proxyUrl}`);
      this.ws = new WebSocket(proxyUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('[Deepgram] Proxy WebSocket open, waiting for Deepgram connection...');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Proxy signals that Deepgram connection is ready
          if (data.type === 'proxy_connected') {
            console.log('[Deepgram] Proxy connected to Deepgram, starting audio');
            this.isRunning = true;
            this.reconnectAttempts = 0;
            this.config.onStart();
            audioProcessor.connect(this.audioContext!.destination);
            return;
          }

          // Proxy forwarded an error from server
          if (data.error) {
            console.error('[Deepgram] Proxy error:', data.error);
            this.config.onError(data.error);
            return;
          }

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
        console.error('[Deepgram] Proxy WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        this.isRunning = false;
        console.log(`[Deepgram] Proxy WebSocket closed: code=${event.code} reason="${event.reason}"`);

        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const attempt = this.reconnectAttempts;
          console.log(`[Deepgram] Reconnecting (${attempt}/${this.maxReconnectAttempts})...`);
          this.cleanup();
          setTimeout(() => this.start(), 1000);
          return;
        } else if (event.code !== 1000) {
          this.config.onError('Connection error - check your internet');
          this.cleanup();
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
      const nativeSR = this.audioContext!.sampleRate;
      const targetSR = 16000;

      // Downsample from native rate to 16kHz if needed
      let samples: Float32Array;
      if (nativeSR !== targetSR) {
        const ratio = nativeSR / targetSR;
        const newLength = Math.floor(inputData.length / ratio);
        samples = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
          samples[i] = inputData[Math.floor(i * ratio)];
        }
      } else {
        samples = inputData;
      }

      // Convert Float32Array to Int16Array (linear16 PCM)
      const pcmData = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
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
