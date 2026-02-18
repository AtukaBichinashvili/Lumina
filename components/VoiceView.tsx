
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Power, AlertCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { VoiceState } from '../types';

export const VoiceView: React.FC = () => {
  const [state, setState] = useState<VoiceState>(VoiceState.IDLE);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startVoice = async () => {
    try {
      setState(VoiceState.CONNECTING);
      setErrorMessage(null);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setState(VoiceState.LISTENING);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              setState(VoiceState.SPEAKING);
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
              
              const source = audioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioCtx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setState(VoiceState.LISTENING);
              };
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setState(VoiceState.LISTENING);
            }

            if (message.serverContent?.outputTranscription) {
               setTranscript(prev => [...prev.slice(-4), `AI: ${message.serverContent?.outputTranscription?.text}`]);
            }
          },
          onerror: (e) => {
            console.error(e);
            setState(VoiceState.ERROR);
            setErrorMessage("კავშირის შეცდომა.");
          },
          onclose: () => {
            setState(VoiceState.IDLE);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "შენ ხარ Lumina, ხმოვანი ასისტენტი. იყავი მოკლე და კონკრეტული პასუხებში. ისაუბრე ქართულად.",
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error(error);
      setState(VoiceState.ERROR);
      setErrorMessage("მიკროფონთან წვდომა ვერ მოხერხდა.");
    }
  };

  const stopVoice = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setState(VoiceState.IDLE);
    nextStartTimeRef.current = 0;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-950 to-blue-950/20">
      <div className="max-w-xl w-full text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold font-outfit tracking-tight">Real-time Voice</h2>
          <p className="text-slate-400">ესაუბრე Lumina-ს პირდაპირ, ხმით</p>
        </div>

        {/* Visualization */}
        <div className="relative flex items-center justify-center h-64">
          <div className={`absolute w-48 h-48 rounded-full border-2 border-blue-500/20 transition-all duration-700 ${
            state === VoiceState.LISTENING ? 'scale-125 border-blue-400/40' : 
            state === VoiceState.SPEAKING ? 'scale-150 border-purple-500/40 animate-pulse' : 'scale-100'
          }`}></div>
          <div className={`absolute w-32 h-32 rounded-full border border-blue-500/30 transition-all duration-500 ${
            state === VoiceState.LISTENING ? 'scale-110' : 
            state === VoiceState.SPEAKING ? 'scale-125 border-purple-400/50' : 'scale-100'
          }`}></div>
          
          <button
            onClick={state === VoiceState.IDLE ? startVoice : stopVoice}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              state === VoiceState.IDLE 
                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' 
                : state === VoiceState.ERROR
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white animate-pulse'
            }`}
          >
            {state === VoiceState.IDLE ? <Power className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </button>
        </div>

        <div className="space-y-4">
          <div className="inline-block px-4 py-2 rounded-full glass text-sm font-medium">
            {state === VoiceState.IDLE && 'მზადყოფნა'}
            {state === VoiceState.CONNECTING && 'უკავშირდება...'}
            {state === VoiceState.LISTENING && 'გისმენ...'}
            {state === VoiceState.SPEAKING && 'Lumina საუბრობს...'}
            {state === VoiceState.ERROR && 'შეცდომა'}
          </div>

          {errorMessage && (
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm mt-4">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {transcript.length > 0 && (
            <div className="mt-8 glass p-6 rounded-2xl text-left max-h-40 overflow-y-auto space-y-2">
              {transcript.map((t, i) => (
                <p key={i} className="text-sm text-slate-300 border-l-2 border-blue-500/30 pl-3">{t}</p>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-12 text-slate-500 text-xs uppercase tracking-widest font-bold">
          <div className="flex flex-col items-center gap-2">
            <Mic className="w-4 h-4" />
            <span>Low Latency</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <span>Natural Audio</span>
          </div>
        </div>
      </div>
    </div>
  );
};
