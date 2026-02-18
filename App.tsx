
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ImageView } from './components/ImageView';
import { VoiceView } from './components/VoiceView';
import { TabType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'image' && <ImageView />}
        {activeTab === 'voice' && <VoiceView />}
        {activeTab === 'settings' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="glass p-8 rounded-3xl max-w-md w-full text-center">
              <h2 className="text-2xl font-bold mb-4 font-outfit">პარამეტრები / Settings</h2>
              <p className="text-slate-400">პარამეტრების მართვა შესაძლებელია აქ.</p>
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-xl flex justify-between items-center">
                  <span>ინტერფეისის ენა</span>
                  <span className="text-blue-400 font-medium">Georgian / English</span>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl flex justify-between items-center">
                  <span>მუქი რეჟიმი</span>
                  <div className="w-12 h-6 bg-blue-500 rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
