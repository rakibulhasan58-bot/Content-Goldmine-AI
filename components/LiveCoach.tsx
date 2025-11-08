import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob as GenaiBlob } from "@google/genai";
import type { TranscriptEntry } from '../types';
import { Mic, MicOff, Copy, Bot } from 'lucide-react';

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
}
// ------------------------------

type SessionStatus = 'idle' | 'connecting' | 'active' | 'error';

export const LiveCoach: React.FC<{ onError: (message: string) => void }> = ({ onError }) => {
    const [status, setStatus] = useState<SessionStatus>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [isCopied, setIsCopied] = useState(false);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const currentInputRef = useRef('');
    const currentOutputRef = useRef('');

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopSession();
        };
    }, []);
    
    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => setIsCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isCopied]);

    const handleMessage = async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            currentOutputRef.current += text;
        }
        if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputRef.current += text;
        }
        if (message.serverContent?.turnComplete) {
            const userInput = currentInputRef.current.trim();
            const aiInput = currentOutputRef.current.trim();
            
            setTranscript(prev => {
                const newEntries: TranscriptEntry[] = [];
                if (userInput) newEntries.push({ id: crypto.randomUUID(), speaker: 'user', text: userInput });
                if (aiInput) newEntries.push({ id: crypto.randomUUID(), speaker: 'ai', text: aiInput });
                return [...prev, ...newEntries];
            });

            currentInputRef.current = '';
            currentOutputRef.current = '';
        }

        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio) {
            if (!outputAudioContextRef.current) return;
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
            });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
        }

        if (message.serverContent?.interrupted) {
            for (const source of audioSourcesRef.current.values()) {
                source.stop();
                audioSourcesRef.current.delete(source);
            }
            nextStartTimeRef.current = 0;
        }
    };

    const startSession = async () => {
        setStatus('connecting');
        setTranscript([]);
        try {
            if (!process.env.API_KEY) throw new Error("API Key not found.");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const inputCtx = inputAudioContextRef.current!;
                        mediaStreamSourceRef.current = inputCtx.createMediaStreamSource(streamRef.current!);
                        scriptProcessorRef.current = inputCtx.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: GenaiBlob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputCtx.destination);
                        setStatus('active');
                    },
                    onmessage: handleMessage,
                    onerror: (e) => {
                        console.error('Live session error:', e);
                        onError("Live session error. Check console for details.");
                        setStatus('error');
                    },
                    onclose: () => {
                         setStatus('idle');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: "You are a friendly and helpful AI content coach. Your goal is to help the user brainstorm, refine, and plan their online content. Keep your answers concise and encouraging.",
                },
            });

        } catch (err) {
            console.error("Failed to start session:", err);
            onError("Could not access microphone or start AI session.");
            setStatus('error');
            stopSession();
        }
    };

    const stopSession = async () => {
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
            sessionPromiseRef.current = null;
        }
        
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        
        setStatus('idle');
    };

    const handleCopyTranscript = () => {
        const text = transcript.map(entry => `${entry.speaker.toUpperCase()}: ${entry.text}`).join('\n\n');
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
        });
    };

    return (
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                    <Bot className="h-5 w-5 mr-3 text-indigo-400" />
                    AI Content Coach
                </h2>
                {transcript.length > 0 && status === 'idle' && (
                     <button
                        onClick={handleCopyTranscript}
                        className="flex items-center text-sm text-slate-400 hover:text-white transition-colors"
                    >
                         <Copy size={16} className="mr-2" />
                         {isCopied ? 'Copied!' : 'Copy Transcript'}
                    </button>
                )}
            </div>
            <div className="flex-grow bg-slate-900/50 rounded-lg p-4 flex flex-col justify-between min-h-[200px]">
                {status === 'idle' && transcript.length === 0 && (
                    <div className="flex-grow flex flex-col items-center justify-center text-center">
                         <Mic className="h-10 w-10 text-slate-500 mb-4" />
                         <p className="text-slate-400">Start a live session to brainstorm ideas.</p>
                    </div>
                )}
                
                {(status !== 'idle' || transcript.length > 0) && (
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4 max-h-[300px]">
                        {transcript.map((entry) => (
                            <div key={entry.id} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${entry.speaker === 'user' ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                                    <p className="text-sm text-white">{entry.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}


                <div className="flex justify-center items-center pt-4 border-t border-slate-700/50">
                    {status === 'idle' || status === 'error' ? (
                        <button onClick={startSession} className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full transition duration-200">
                             <Mic className="h-5 w-5 mr-2" />
                             Start Live Session
                        </button>
                    ) : (
                         <button onClick={stopSession} className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full transition duration-200">
                             <MicOff className="h-5 w-5 mr-2" />
                             End Session
                        </button>
                    )}
                </div>
                 {status === 'connecting' && <p className="text-center text-sm text-slate-400 mt-2">Connecting...</p>}
                 {status === 'active' && <p className="text-center text-sm text-green-400 mt-2 animate-pulse">Listening...</p>}
            </div>
        </div>
    );
};