# 🎨 PosterPro Canvas Editor

A high-performance, web-based design tool built with Next.js and Fabric.js.

## 🚀 Setup Instructions
1. **Clone the repo:** `git clone [(https://github.com/travin22-debug/poster-canvas-editor.git)](https://github.com/travin22-debug/poster-canvas-editor.git)`
2. **Install dependencies:** `npm install`
3. **Run development server:** `npm run dev`
4. **Open browser:** Navigate to `http://localhost:3000`

## 🏗 Architecture Explanation
- **Frontend:** React (Next.js App Router) for the UI, Tailwind CSS for styling.
- **Canvas Engine:** [Fabric.js v6+](https://fabricjs.com/) for object manipulation.
- **State Management:** React `useRef` and `useCallback` for high-frequency history tracking (Undo/Redo).
- **Backend:** Next.js API Routes for persisting design JSON.



## 🛠 Features
- **Manipulation:** Add text, shapes, and images. Drag, resize, and rotate.
- **Persistence:** Save design state to JSON and reload later.
- **Export:** High-resolution PNG export with transparency options.
- **History:** Unlimited Undo/Redo stack.

## ⚠️ Known Limitations
- Canvas size is currently fixed to a 1:1 ratio.
- Mobile touch-controls are experimental.
- Images from external URLs require CORS headers for export.
