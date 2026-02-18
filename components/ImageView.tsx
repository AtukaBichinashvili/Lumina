
import React, { useState } from 'react';
import { Wand2, Download, Maximize2, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { GeneratedImage } from '../types';

export const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newImg: GeneratedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt,
          timestamp: Date.now()
        };
        setHistory(prev => [newImg, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error("Image generation error:", error);
      alert("სურათის გენერაცია ვერ მოხერხდა.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="px-8 py-6 border-b border-slate-800 glass">
        <h2 className="text-xl font-bold font-outfit">Image Studio</h2>
        <p className="text-sm text-slate-500">შექმენი ვიზუალური ხელოვნება</p>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Controls */}
          <div className="glass p-6 rounded-3xl space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">რა გინდა რომ შევქმნა?</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="აღწერე შენი იდეა... (მაგ: კოსმონავტი კატა მთვარეზე)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">ასპექტის თანაფარდობა</label>
                <div className="flex gap-2">
                  {['1:1', '16:9', '9:16', '3:4', '4:3'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        aspectRatio === ratio 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateImage}
                disabled={!prompt.trim() || isGenerating}
                className="ml-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    გენერაცია...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    შექმნა
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {history.map((img) => (
              <div key={img.id} className="group relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
                <img src={img.url} alt={img.prompt} className="w-full h-auto object-cover aspect-square" />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <p className="text-sm text-white line-clamp-2 mb-4">{img.prompt}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center gap-2 text-white text-sm transition-all">
                      <Download className="w-4 h-4" /> ჩამოტვირთვა
                    </button>
                    <button className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {history.length === 0 && !isGenerating && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Wand2 className="w-10 h-10 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-300">არანაირი სურათი</h3>
                  <p className="text-slate-500">დაწერე აღწერა და დაიწყე გენერაცია</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
