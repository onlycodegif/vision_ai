# Vision AI: Interactive Perception System

A real-time, multimodal perception interface capable of processing live video and audio streams simultaneously. This project demonstrates an implementation of a "sight-enabled" conversational agent using modern web standards.

## 🏗 System Architecture

The application is built on a **React 19** frontend that orchestrates a low-latency, bidirectional streaming session with a multimodal LLM backend.

### Core Components

1.  **Audio Pipeline (Web Audio API)**
    *   **Input**: Captures microphone input at 16kHz (mono). Uses `ScriptProcessorNode` to intercept raw `Float32` audio buffers.
    *   **Processing**: Converts `Float32` audio data to `Int16` PCM (Pulse Code Modulation) in real-time to match the required byte format for the upstream socket.
    *   **Output**: Receives raw PCM chunks (24kHz) from the server. Implements a dynamic audio queueing system using `AudioBufferSourceNode` to schedule chunks sequentially, ensuring gapless playback despite network jitter.

2.  **Visual Cortex (Canvas API)**
    *   Instead of standard WebRTC video streaming, this implementation uses a "Frame Sampling" approach.
    *   Video is captured via `navigator.mediaDevices.getUserMedia`.
    *   Frames are extracted onto an off-screen `HTMLCanvasElement` at a regulated interval (approx. 1 FPS to balance bandwidth/latency).
    *   Frames are compressed to JPEG (base64) and injected into the active WebSocket session alongside audio data.

3.  **State Management (React)**
    *   A custom hook `useVisionSystem` encapsulates the complex imperative logic of WebSocket management and AudioContext lifecycles, exposing a clean reactive interface (`state`, `connect`, `disconnect`) to the UI layer.
    *   **Recharts** is used to render real-time telemetry (CPU simulation, latency, confidence intervals).

## 🛠 Tech Stack

*   **Frontend Framework**: React 19 + TypeScript
*   **Styling**: Tailwind CSS (Utility-first architecture)
*   **Audio/Video**: Native Web Audio API & HTML5 Canvas
*   **Visualization**: Recharts
*   **Icons**: Lucide React
*   **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites

*   Node.js 18+
*   A valid API Key with access to the Gemini 2.5 Flash (Native Audio) model.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/vision-ai-system.git
    cd vision-ai-system
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_api_key_here
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

## 📂 Project Structure

```
/
├── components/         # UI Components (Metrics, Logs, Layout)
├── hooks/             # Core Logic
│   └── useVisionSystem.ts  # Audio/Video Streaming Implementation
├── utils/             # Helpers
│   └── audio-utils.ts      # PCM Encoding/Decoding logic
├── types.ts           # TypeScript interfaces
├── App.tsx            # Main Application Entry
└── index.tsx          # React Root
```

## 🔧 Technical Implementation Details

### Audio Buffering & Synchronization
The system handles the "Wait-to-talk" interrupt problem by monitoring the `serverContent.interrupted` flag. When the user speaks while the AI is replying:
1.  The audio output queue is immediately cleared.
2.  Active source nodes are stopped.
3.  The playback cursor (`nextStartTime`) is reset to zero.

### PCM Conversion
Browser audio runs on floating-point numbers (`-1.0` to `1.0`). To communicate with the backend model, we manually transcode this to 16-bit integers (`-32768` to `32767`).

```typescript
// utils/audio-utils.ts
export function float32To16BitPCM(float32Arr: Float32Array): Int16Array {
  const int16Arr = new Int16Array(float32Arr.length);
  for (let i = 0; i < float32Arr.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Arr[i]));
    int16Arr[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Arr;
}
```

## 📄 License

MIT
