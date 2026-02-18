
import React from 'react';
import { MessageSquare, Image as ImageIcon, Mic, Settings, Sparkles } from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'chat' as TabType, icon: MessageSquare, label: 'ჩატი / Chat' },
    { id: 'image' as TabType, icon: ImageIcon, label: 'სურათები / Images' },
    { id: 'voice' as TabType, icon: Mic, label: 'ხმა / Voice' },
    { id: 'settings' as TabType, icon: Settings, label: 'პარამეტრები' },
  ];

  return (
    <aside className="w-72 border-r border-slate-800 flex flex-col glass z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold font-outfit tracking-tight">Lumina AI</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">Pro Version</p>
          <p className="text-sm text-slate-300 mb-4">მიიღე წვდომა უახლეს მოდელებზე.</p>
          <button className="w-full py-2 bg-white text-slate-950 text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
};
