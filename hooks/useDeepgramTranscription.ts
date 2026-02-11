'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {DeepgramConfig, DeepgramService} from '@/lib/deepgramService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BrowserSpeechRecognitionInstance = any;

interface UseDeepgramTranscriptionOptions {
    onTranscript?: (text: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
}

interface UseDeepgramTranscriptionReturn {
    isRecording: boolean;
    isSupported: boolean;
    transcript: string;
    interimTranscript: string;
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    clearTranscript: () => void;
}

/**
 * Hook for Deepgram speech-to-text with automatic fallback to browser speech recognition
 * Optimized for African/Ghanaian English accents with Bible keyword boosting
 */
export function useDeepgramTranscription(
    options: UseDeepgramTranscriptionOptions = {}
): UseDeepgramTranscriptionReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [useDeepgram, setUseDeepgram] = useState(true);

    const deepgramRef = useRef<DeepgramService | null>(null);
    const browserRecognitionRef = useRef<BrowserSpeechRecognitionInstance>(null);
    const transcriptRef = useRef('');

    // Check if Deepgram is supported (WebSocket + AudioContext)
    const isDeepgramSupported = typeof window !== 'undefined' && DeepgramService.isSupported();

    // Check if browser speech recognition is supported
    const isBrowserSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const isSupported = isDeepgramSupported || isBrowserSupported;

    // Keep transcript ref in sync
    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    /**
     * Start Deepgram transcription
     */
    const startDeepgram = useCallback(async () => {
        const config: DeepgramConfig = {
            onTranscript: (text, isFinal) => {
                if (isFinal) {
                    // Append final transcript with space
                    const newTranscript = transcriptRef.current
                        ? `${transcriptRef.current} ${text}`
                        : text;
                    setTranscript(newTranscript);
                    setInterimTranscript('');
                    options.onTranscript?.(text, true);
                } else {
                    setInterimTranscript(text);
                    options.onTranscript?.(text, false);
                }
            },
            onError: (err) => {
                console.error('Deepgram error:', err);

                // If Deepgram fails, fall back to browser speech recognition
                if (err.includes('not configured') || err.includes('Connection error')) {
                    console.log('Falling back to browser speech recognition');
                    setUseDeepgram(false);
                    startBrowserRecognition();
                } else {
                    setError(err);
                    options.onError?.(err);
                }
            },
            onStart: () => {
                setIsRecording(true);
                setError(null);
            },
            onEnd: () => {
                setIsRecording(false);
            },
        };

        deepgramRef.current = new DeepgramService(config);

        try {
            await deepgramRef.current.start();
        } catch (err) {
            // Error handled in onError callback
            console.error('Failed to start Deepgram:', err);
        }
    }, [options]);

    /**
     * Start browser speech recognition as fallback
     */
    const startBrowserRecognition = useCallback(() => {
        if (!isBrowserSupported) {
            setError('Speech recognition not supported in this browser');
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognitionClass();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsRecording(true);
            setError(null);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }

            if (final) {
                const newTranscript = transcriptRef.current
                    ? `${transcriptRef.current} ${final}`
                    : final;
                setTranscript(newTranscript);
                options.onTranscript?.(final, true);
            }

            setInterimTranscript(interim);
            if (interim) {
                options.onTranscript?.(interim, false);
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.error('Browser speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
                setError(`Speech recognition error: ${event.error}`);
                options.onError?.(event.error);
            }
        };

        recognition.onend = () => {
            // Restart if still supposed to be recording
            if (isRecording && browserRecognitionRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    setIsRecording(false);
                }
            } else {
                setIsRecording(false);
            }
        };

        browserRecognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (err) {
            setError('Failed to start speech recognition');
            console.error('Failed to start browser recognition:', err);
        }
    }, [isBrowserSupported, isRecording, options]);

    /**
     * Start recording with Deepgram or browser fallback
     */
    const startRecording = useCallback(async () => {
        if (isRecording) return;

        setError(null);
        setInterimTranscript('');

        if (useDeepgram && isDeepgramSupported) {
            await startDeepgram();
        } else if (isBrowserSupported) {
            startBrowserRecognition();
        } else {
            setError('No speech recognition available');
        }
    }, [isRecording, useDeepgram, isDeepgramSupported, isBrowserSupported, startDeepgram, startBrowserRecognition]);

    /**
     * Stop recording
     */
    const stopRecording = useCallback(() => {
        if (deepgramRef.current) {
            deepgramRef.current.stop();
            deepgramRef.current = null;
        }

        if (browserRecognitionRef.current) {
            browserRecognitionRef.current.stop();
            browserRecognitionRef.current = null;
        }

        setIsRecording(false);
        setInterimTranscript('');
    }, []);

    /**
     * Clear transcript
     */
    const clearTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        transcriptRef.current = '';
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (deepgramRef.current) {
                deepgramRef.current.abort();
            }
            if (browserRecognitionRef.current) {
                browserRecognitionRef.current.stop();
            }
        };
    }, []);

    return {
        isRecording,
        isSupported,
        transcript,
        interimTranscript,
        error,
        startRecording,
        stopRecording,
        clearTranscript,
    };
}
