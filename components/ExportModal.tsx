import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { ShaderParams } from '../types';
import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from '../shaders';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: ShaderParams;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, params }) => {
  const [activeTab, setActiveTab] = useState<'json' | 'vertex' | 'fragment'>('json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getCode = () => {
    switch (activeTab) {
      case 'json':
        return JSON.stringify(params, null, 2);
      case 'vertex':
        return VERTEX_SHADER_SOURCE;
      case 'fragment':
        return FRAGMENT_SHADER_SOURCE;
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Export Configuration</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-4 pt-2">
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'json' 
                ? 'border-cyan-500 text-cyan-500' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Settings (JSON)
          </button>
          <button
            onClick={() => setActiveTab('vertex')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'vertex' 
                ? 'border-cyan-500 text-cyan-500' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Vertex Shader
          </button>
          <button
            onClick={() => setActiveTab('fragment')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'fragment' 
                ? 'border-cyan-500 text-cyan-500' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Fragment Shader
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-[#0d1117] p-4 font-mono text-sm relative group">
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 p-2 bg-zinc-800/90 border border-zinc-700 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-700 transition flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            <span className="text-xs">{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
          
          <pre className="text-zinc-300 whitespace-pre-wrap break-all">
            {getCode()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-xl flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition"
          >
            Close
          </button>
          <button 
            onClick={handleCopy}
            className="px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-900/20 transition flex items-center gap-2"
          >
             {copied ? <Check size={16} /> : <Copy size={16} />}
             Copy to Clipboard
          </button>
        </div>

      </div>
    </div>
  );
};