'use client';
import { useFabric } from '@/hooks/useFabric';
import * as fabric from 'fabric';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function Editor() {
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const historyRef = useRef<string[]>([]);
  const isUndoing = useRef(false);

  // --- 1. HISTORY ENGINE ---
  const saveHistory = useCallback(() => {
    if (isUndoing.current || !fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    if (historyRef.current[currentIndex] === json) return;
    const newHistory = historyRef.current.slice(0, currentIndex + 1);
    newHistory.push(json);
    historyRef.current = newHistory;
    setCurrentIndex(newHistory.length - 1);
  }, [currentIndex]);

  const { canvasRef, fabricRef } = useFabric(saveHistory);

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    if (historyRef.current.length === 0) {
      historyRef.current = [JSON.stringify(canvas.toJSON())];
      setCurrentIndex(0);
    }
    const handleEvents = () => { if (!isUndoing.current) saveHistory(); };
    canvas.on('object:added', handleEvents);
    canvas.on('object:modified', handleEvents);
    canvas.on('object:removed', handleEvents);
    return () => {
      canvas.off('object:added', handleEvents);
      canvas.off('object:modified', handleEvents);
      canvas.off('object:removed', handleEvents);
    };
  }, [fabricRef, saveHistory]);

  // --- 2. NEW: SAVE & LOAD LOGIC ---

  // 💾 SAVE TO BACKEND (JSON)
  const saveToBackend = async () => {
    if (!fabricRef.current) return;
    const canvasData = fabricRef.current.toJSON();
    const jsonPayload = JSON.stringify(canvasData);
    
    // Log for verification
    console.log("Saving Design JSON:", jsonPayload);
    
    // In a real app, you would use:
    // await fetch('/api/posters', { method: 'POST', body: jsonPayload });
    
    alert("Project State Saved! (View JSON in browser console)");
  };

  // 📂 LOAD FROM SAVED JSON
  const loadProject = (jsonString: string) => {
    if (!fabricRef.current || !jsonString) return;
    isUndoing.current = true;
    fabricRef.current.loadFromJSON(JSON.parse(jsonString)).then(() => {
      fabricRef.current?.renderAll();
      // Reset history stack to this loaded state
      historyRef.current = [jsonString];
      setCurrentIndex(0);
      setTimeout(() => { isUndoing.current = false; }, 100);
    });
  };

  // --- 3. EXISTING ACTIONS (Text, Shapes, Stickers) ---
  const undo = () => {
    if (currentIndex > 0 && fabricRef.current) {
      isUndoing.current = true;
      const prevState = historyRef.current[currentIndex - 1];
      fabricRef.current.loadFromJSON(JSON.parse(prevState)).then(() => {
        fabricRef.current?.renderAll();
        setCurrentIndex(currentIndex - 1);
        setTimeout(() => { isUndoing.current = false; }, 100);
      });
    }
  };

  const redo = () => {
    if (currentIndex < historyRef.current.length - 1 && fabricRef.current) {
      isUndoing.current = true;
      const nextState = historyRef.current[currentIndex + 1];
      fabricRef.current.loadFromJSON(JSON.parse(nextState)).then(() => {
        fabricRef.current?.renderAll();
        setCurrentIndex(currentIndex + 1);
        setTimeout(() => { isUndoing.current = false; }, 100);
      });
    }
  };

  const addText = () => {
    if (fabricRef.current) {
      const text = new fabric.IText('Edit Me', { left: 100, top: 100, fontSize: 40, fill: '#333' });
      fabricRef.current.add(text);
      fabricRef.current.setActiveObject(text);
    }
  };

  const setTextAlign = (alignment: 'left' | 'center' | 'right') => {
    const activeObject = fabricRef.current?.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
      (activeObject as fabric.IText).set('textAlign', alignment);
      fabricRef.current?.renderAll();
      saveHistory();
    }
  };

  const addRect = () => {
    if (fabricRef.current) {
      const rect = new fabric.Rect({ left: 150, top: 150, fill: selectedColor, width: 100, height: 100, rx: 8, ry: 8 });
      fabricRef.current.add(rect);
    }
  };

  const addCircle = () => {
    if (fabricRef.current) {
      const circle = new fabric.Circle({ radius: 50, fill: selectedColor, left: 100, top: 100 });
      fabricRef.current.add(circle);
    }
  };

  const changeElementColor = (color: string) => {
    setSelectedColor(color);
    const activeObject = fabricRef.current?.getActiveObject();
    if (activeObject) {
      activeObject.set('fill', color);
      fabricRef.current?.renderAll();
      saveHistory();
    }
  }

  const changeBackgroundColor = (color: string) => {
    if (fabricRef.current) {
      fabricRef.current.set('backgroundColor', color);
      fabricRef.current.renderAll();
      saveHistory();
    }
  };

  const addPresetImage = async (url: string) => {
    if (fabricRef.current) {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      img.scaleToWidth(120);
      fabricRef.current.add(img);
      fabricRef.current.centerObject(img);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;
    const reader = new FileReader();
    reader.onload = async (f) => {
      const data = f.target?.result;
      if (typeof data === 'string') {
        const img = await fabric.FabricImage.fromURL(data);
        img.scaleToWidth(200);
        fabricRef.current?.add(img);
        fabricRef.current?.centerObject(img);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (fabricRef.current) {
      const activeObjects = fabricRef.current.getActiveObjects();
      fabricRef.current.remove(...activeObjects);
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
    }
  };

  // 🖼 EXPORT AS PNG
  const exportToImage = () => {
    if (fabricRef.current) {
      const dataURL = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
      const link = document.createElement('a');
      link.download = 'my-design.png';
      link.href = dataURL;
      link.click();
    }
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">{children}</label>
  );

  return (
    <div className="flex flex-row h-screen bg-white text-gray-800 antialiased font-sans">
      {/* SIDEBAR */}
      <div className="w-72 bg-white border-r border-gray-100 p-6 flex flex-col h-full shadow-sm overflow-y-auto">
        <h1 className="font-extrabold text-2xl tracking-tight mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic">DesignStudio</h1>

        {/* 1. PROJECT CONTROLS (NEW) */}
        <div className="mb-8 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <SectionLabel>Project Actions</SectionLabel>
          <div className="flex flex-col gap-2">
            <button onClick={saveToBackend} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-[11px] font-bold hover:bg-indigo-700 transition">Save Project (JSON)</button>
            <button onClick={() => {
              const data = prompt("Paste your saved JSON here:");
              if (data) loadProject(data);
            }} className="w-full bg-white border border-indigo-200 text-indigo-600 py-2 rounded-lg text-[11px] font-bold hover:bg-indigo-50 transition">Load Project</button>
          </div>
        </div>

        {/* 2. HISTORY */}
        <div className="mb-8">
          <SectionLabel>History</SectionLabel>
          <div className="flex gap-2">
            <button onClick={undo} disabled={currentIndex <= 0} className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 p-2 rounded-lg text-xs font-bold transition">↺ Undo</button>
            <button onClick={redo} disabled={currentIndex >= historyRef.current.length - 1} className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 p-2 rounded-lg text-xs font-bold transition">↻ Redo</button>
          </div>
        </div>

        {/* 3. TYPOGRAPHY */}
        <div className="mb-8">
          <SectionLabel>Typography</SectionLabel>
          <button onClick={addText} className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium mb-3">Add Textbox</button>
          <div className="flex gap-1">
            <button onClick={() => setTextAlign('left')} className="flex-1 bg-gray-50 border p-2 text-[10px] font-bold rounded">L</button>
            <button onClick={() => setTextAlign('center')} className="flex-1 bg-gray-50 border p-2 text-[10px] font-bold rounded">C</button>
            <button onClick={() => setTextAlign('right')} className="flex-1 bg-gray-50 border p-2 text-[10px] font-bold rounded">R</button>
          </div>
        </div>

        {/* 4. SHAPES & COLOR */}
        <div className="mb-8">
          <SectionLabel>Elements & Color</SectionLabel>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={addRect} className="flex flex-col items-center border-2 border-dashed p-3 rounded-xl hover:border-blue-400"><div className="w-6 h-6 bg-blue-500 rounded-sm mb-1"></div><span className="text-[10px] font-bold">Square</span></button>
            <button onClick={addCircle} className="flex flex-col items-center border-2 border-dashed p-3 rounded-xl hover:border-blue-400"><div className="w-6 h-6 bg-blue-500 rounded-full mb-1"></div><span className="text-[10px] font-bold">Circle</span></button>
          </div>
          <input type="color" value={selectedColor} onChange={(e) => changeElementColor(e.target.value)} className="w-full h-8 cursor-pointer rounded-lg mb-2" />
          <SectionLabel>Canvas Background</SectionLabel>
          <input type="color" defaultValue="#ffffff" onChange={(e) => changeBackgroundColor(e.target.value)} className="w-full h-8 cursor-pointer rounded-lg" />
        </div>

        {/* 5. STICKERS & UPLOADS */}
        <div className="mb-8">
          <SectionLabel>Stickers & Uploads</SectionLabel>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { id: 'star', url: 'https://img.icons8.com/color/96/star--v1.png' },
              { id: 'fire', url: 'https://img.icons8.com/color/96/fire-element.png' },
              { id: 'check', url: 'https://img.icons8.com/color/96/checked-checkbox.png' },
            ].map((item) => (
              <button key={item.id} onClick={() => addPresetImage(item.url)} className="p-1 border rounded-lg hover:bg-blue-50 transition"><img src={item.url} alt={item.id} className="w-full h-auto" /></button>
            ))}
          </div>
          <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-blue-400">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <p className="text-[10px] font-bold text-gray-400">Upload Image</p>
          </div>
        </div>

        <div className="mt-auto border-t pt-6">
          <button onClick={deleteSelected} className="w-full text-red-500 text-xs font-bold mb-4 hover:underline transition">Delete Selected</button>
          <button onClick={exportToImage} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">Export PNG</button>
        </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-12 overflow-auto">
        <div className="bg-white shadow-2xl ring-1 ring-gray-200">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}