import React, { useState, ChangeEvent } from 'react';
import { Layers, Upload, Image as ImageIcon, RotateCcw, Download } from 'lucide-react';
import { DepthPreview } from './components/DepthPreview';
import { Slider } from './components/Slider';
import { ExportModal } from './components/ExportModal';
import { DEFAULT_PARAMS, PARAM_CONFIG } from './constants';
import { ShaderParams } from './types';

function App() {
  const [params, setParams] = useState<ShaderParams>(DEFAULT_PARAMS);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [depth, setDepth] = useState<HTMLImageElement | null>(null);
  const [imgName, setImgName] = useState<string>("No file selected");
  const [depthName, setDepthName] = useState<string>("No file selected");
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleParamChange = (key: keyof ShaderParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, isDepth: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (isDepth) {
          setDepth(img);
          setDepthName(file.name);
        } else {
          setImage(img);
          setImgName(file.name);
          // If no depth map is uploaded yet, use the image as depth map initially for fun
          if (!depth) {
            // Optional: Auto-set depth to same image if user hasn't provided one? 
            // Nah, let's keep it explicit.
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-gray-200 overflow-hidden">
      
      {/* Sidebar Controls */}
      <aside className="w-80 flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex flex-col h-full z-20">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-2">
          <Layers className="w-6 h-6 text-cyan-500" />
          <h1 className="text-xl font-bold tracking-tight text-white">DepthFX</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* File Uploads */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Assets</h2>
            
            {/* Image Upload */}
            <div className="relative group">
               <label className="block w-full p-3 border border-dashed border-zinc-700 rounded-lg hover:border-cyan-500 hover:bg-zinc-800/50 transition cursor-pointer group-hover:shadow-lg group-hover:shadow-cyan-900/10">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-zinc-800 rounded-md text-cyan-500">
                     <ImageIcon size={20} />
                   </div>
                   <div className="overflow-hidden">
                     <div className="text-sm font-medium text-gray-300">Base Image</div>
                     <div className="text-xs text-zinc-500 truncate w-32">{imgName}</div>
                   </div>
                 </div>
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
               </label>
            </div>

            {/* Depth Upload */}
            <div className="relative group">
               <label className="block w-full p-3 border border-dashed border-zinc-700 rounded-lg hover:border-purple-500 hover:bg-zinc-800/50 transition cursor-pointer group-hover:shadow-lg group-hover:shadow-purple-900/10">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-zinc-800 rounded-md text-purple-500">
                     <Layers size={20} />
                   </div>
                   <div className="overflow-hidden">
                     <div className="text-sm font-medium text-gray-300">Depth Map</div>
                     <div className="text-xs text-zinc-500 truncate w-32">{depthName}</div>
                   </div>
                 </div>
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
               </label>
            </div>
          </div>

          <div className="w-full h-px bg-zinc-800" />

          {/* Sliders */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Parameters</h2>
              <button 
                onClick={handleReset}
                className="text-xs flex items-center gap-1 text-zinc-500 hover:text-white transition"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
            
            <div className="space-y-6">
              {PARAM_CONFIG.map((conf) => (
                <Slider
                  key={conf.key}
                  label={conf.label}
                  min={conf.min}
                  max={conf.max}
                  step={conf.step}
                  value={params[conf.key as keyof ShaderParams]}
                  onChange={(val) => handleParamChange(conf.key as keyof ShaderParams, val)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
          <button
            onClick={() => setIsExportOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition"
          >
            <Download size={16} />
            Export Settings & Code
          </button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 h-full bg-zinc-950 relative overflow-hidden">
         {/* Background Grid Pattern */}
         <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
              style={{ 
                  backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', 
                  backgroundSize: '20px 20px' 
              }} 
         />
         
         <div className="relative z-10 w-full h-full">
           <DepthPreview 
             image={image} 
             depth={depth} 
             params={params} 
           />
           
           {/* Hint Overlay if no image */}
           {!image && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm pointer-events-none">
                <Upload className="w-12 h-12 text-zinc-600 mb-4" />
                <h3 className="text-xl font-medium text-zinc-400">Upload an image to begin</h3>
                <p className="text-zinc-600 mt-2 max-w-md text-center">
                    Upload a base image and a grayscale depth map to generate a 3D parallax preview.
                </p>
             </div>
           )}
         </div>
      </main>

      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        params={params} 
      />
    </div>
  );
}

export default App;