import React, { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Play, Square, RotateCcw } from "lucide-react";

const VisualPage5 = ({
  data = [10, 20, 30, 40, 50],
  spacing = 2.0,
  deleteIndex = 2,
  stepDuration = 700,
}) => {
  const originalRef = useRef(data.slice());
  const [boxes, setBoxes] = useState(() =>
    createBoxes(originalRef.current, spacing)
  );
  const animRef = useRef({ cancelled: false });
  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  function createBoxes(arr, spacingVal) {
    const n = arr.length;
    const mid = (n - 1) / 2;
    return arr.map((v, i) => ({
      id: `b${i}`,
      value: v,
      x: (i - mid) * spacingVal,
      targetX: (i - mid) * spacingVal,
      opacity: 1,
    }));
  }

  const reset = () => {
    animRef.current.cancelled = true;
    setBoxes(createBoxes(originalRef.current, spacing));
    setStatus("Idle");
    setProgress(0);
    setIsPlaying(false);
  };

  const animateMove = (boxId, toX) => {
    return new Promise((resolve) => {
      const startX = boxes.find((b) => b.id === boxId).x;
      const duration = stepDuration;
      const startTime = performance.now();

      function frame(now) {
        if (animRef.current.cancelled) return resolve();
        const t = Math.min((now - startTime) / duration, 1);
        setBoxes((prev) =>
          prev.map((b) =>
            b.id === boxId ? { ...b, x: startX + (toX - startX) * t } : b
          )
        );
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }

      requestAnimationFrame(frame);
    });
  };

  const animateFadeOut = (boxId) => {
    return new Promise((resolve) => {
      const duration = stepDuration / 2;
      const startTime = performance.now();

      function frame(now) {
        if (animRef.current.cancelled) return resolve();
        const t = Math.min((now - startTime) / duration, 1);
        setBoxes((prev) =>
          prev.map((b) => (b.id === boxId ? { ...b, opacity: 1 - t } : b))
        );
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }

      requestAnimationFrame(frame);
    });
  };

  const handlePlay = async () => {
    if (isPlaying) return;
    animRef.current.cancelled = false;
    setBoxes(createBoxes(originalRef.current, spacing));
    setProgress(0);
    setStatus(`Deleting element at index ${deleteIndex}...`);
    setIsPlaying(true);

    const n = boxes.length;

    // Fade out the deleted box
    await animateFadeOut(boxes[deleteIndex].id);

    // Shift left the boxes on the right
    for (let i = deleteIndex + 1; i < n; i++) {
      if (animRef.current.cancelled) break;
      const targetX = boxes[i].x - spacing;
      setStatus(`Shifting element at index ${i} left`);
      await animateMove(boxes[i].id, targetX);
      setProgress(Math.round(((i - deleteIndex) / (n - deleteIndex)) * 100));
    }

    // Remove the deleted element and finalize array
    const newArr = originalRef.current.slice();
    newArr.splice(deleteIndex, 1);
    setBoxes(createBoxes(newArr, spacing));
    setStatus(`✅ Deletion complete`);
    setProgress(100);
    setIsPlaying(false);
  };

  const handleStop = () => {
    animRef.current.cancelled = true;
    setIsPlaying(false);
    setStatus("Stopped");
  };

  const handleReset = () => reset();

  return (
    <div className="w-full h-[300px] flex flex-col items-center justify-center">
      {/* Video Player Controls */}
      <div className="w-2/3 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            <Play size={20} />
          </button>
          <button
            onClick={handleStop}
            disabled={!isPlaying}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <Square size={20} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
          >
            <RotateCcw size={20} />
          </button>
        </div>
        <div className="w-full h-2 bg-gray-300 rounded">
          <div
            className="h-2 bg-green-500 rounded"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-gray-700 font-mono text-sm text-center">
          {status}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-[60%]">
        <Canvas camera={{ position: [0, 4, 8], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          {boxes.map((b, i) => (
            <Box
              key={b.id}
              value={b.value}
              index={i}
              position={[b.x, 0, 0]}
              opacity={b.opacity}
            />
          ))}
          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};

const Box = ({ value, index, position, opacity = 1 }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#60a5fa" transparent opacity={opacity} />
      </mesh>
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color={`rgba(0,0,0,${opacity})`}
      >
        {value}
      </Text>
      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
        color={`rgba(0,0,0,${opacity})`}
      >
        [{index}]
      </Text>
    </group>
  );
};

export default VisualPage5;
