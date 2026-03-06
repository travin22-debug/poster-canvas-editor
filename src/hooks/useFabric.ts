import { useEffect, useRef } from 'react';
import * as fabric from 'fabric'; 

export const useFabric = (onChange: () => void) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  

  useEffect(() => {
    if (!canvasRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        canvas.discardActiveObject();
        canvas.remove(...activeObjects);
        canvas.renderAll();
    }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Remember to remove it in the cleanup return function:
    // window.removeEventListener('keydown', handleKeyDown);

    // Initialize Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 700,
      backgroundColor: '#ffffff',
    });

    fabricRef.current = canvas;

    // Inside useFabric.ts useEffect
    canvas.on('object:added', onChange);
    canvas.on('object:modified', onChange);
    canvas.on('object:removed', onChange);

    return () => {
      canvas.dispose();
    };
  }, []);

  return { canvasRef, fabricRef };
};