import { getAccessToken, transcribeSocketUrl } from '@/lib/api';

/**
 * Deepgram WebSocket client.
 * Streams audio to the SermonFlow backend (/api/v1/transcribe), which relays it
 * to Deepgram nova-3 with the key it holds. The access token rides along as the
 * second subprotocol, since browsers can't set headers on a WebSocket.
 */

export interface DeepgramCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onOpen: () => void;
  onClose: () => void;
}

export class DeepgramService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private callbacks: DeepgramCallbacks;

  constructor(callbacks: DeepgramCallbacks) {
    this.callbacks = callbacks;
  }

  async start(deviceId?: string): Promise<void> {
    try {
      // Get microphone audio
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      const token = await getAccessToken();
      if (!token) {
        this.callbacks.onError('Not signed in');
        return;
      }
      this.ws = new WebSocket(transcribeSocketUrl(), ['bearer', token]);

      this.ws.onopen = () => {
        this.callbacks.onOpen();
        this.startAudioCapture();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'Results') {
            const transcript = data.channel?.alternatives?.[0]?.transcript;
            if (transcript) {
              const isFinal = data.is_final === true;
              this.callbacks.onTranscript(transcript, isFinal);
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onerror = () => {
        this.callbacks.onError('WebSocket connection failed');
      };

      this.ws.onclose = () => {
        this.callbacks.onClose();
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start Deepgram';
      this.callbacks.onError(message);
    }
  }

  private startAudioCapture(): void {
    if (!this.mediaStream || !this.ws) return;

    // Create AudioContext at native sample rate, then downsample to 16kHz
    this.audioContext = new AudioContext();
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Use ScriptProcessorNode to capture raw PCM
    const bufferSize = 4096;
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    const nativeSampleRate = this.audioContext.sampleRate;
    const targetSampleRate = 16000;

    this.processor.onaudioprocess = (e) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);

      // Downsample to 16kHz
      const ratio = nativeSampleRate / targetSampleRate;
      const outputLength = Math.floor(inputData.length / ratio);
      const output = new Int16Array(outputLength);

      for (let i = 0; i < outputLength; i++) {
        const index = Math.floor(i * ratio);
        // Convert float32 [-1,1] to int16
        const s = Math.max(-1, Math.min(1, inputData[index]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      this.ws.send(output.buffer);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
  }
}
