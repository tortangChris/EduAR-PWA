import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Play, Square, RotateCcw } from "lucide-react";

const VisualPage3 = ({
  data = [10, 20, 30, 40, 50],
  spacing = 2.0,
  target = 40,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Idle");
  const intervalRef = useRef(null);

  // positions for boxes along the X axis
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const handlePlay = () => {
    if (isPlaying) return;
    setProgress(0);
    setActiveIndex(null);
    setStatus("Starting search...");
    setIsPlaying(true);

    let currentIndex = 0;
    intervalRef.current = setInterval(() => {
      setActiveIndex(currentIndex);
      setStatus(`Checking index ${currentIndex}...`);
      setProgress(((currentIndex + 1) / data.length) * 100);

      if (data[currentIndex] === target) {
        setStatus(`✅ Found ${target} at index ${currentIndex}`);
        clearInterval(intervalRef.current);
        setIsPlaying(false);
      } else if (currentIndex === data.length - 1) {
        setStatus(`❌ ${target} not found`);
        clearInterval(intervalRef.current);
        setIsPlaying(false);
      } else {
        currentIndex++;
      }
    }, 1000);
  };

  const handleStop = () => {
    clearInterval(intervalRef.current);
    setIsPlaying(false);
    setStatus("Stopped");
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsPlaying(false);
    setProgress(0);
    setActiveIndex(null);
    setStatus("Idle");
  };

  return (
    <div className="w-full h-[300px] bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-2/3 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={handlePlay}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
            disabled={isPlaying}
          >
            <Play size={20} />
          </button>
          <button
            onClick={handleStop}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
            disabled={!isPlaying}
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

      {/* 3D Scene */}
      <div className="w-full h-[60%]">
        <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {/* Row of boxes */}
          {data.map((value, i) => (
            <Box
              key={i}
              index={i}
              value={value}
              position={positions[i]}
              fade={activeIndex === i ? 1 : 0}
            />
          ))}

          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};

const Box = ({ index, value, position = [0, 0, 0], fade }) => {
  const size = [1.6, 1.2, 1];

  return (
    <group position={position}>
      {/* Box */}
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={index % 2 === 0 ? "#60a5fa" : "#34d399"}
          emissive={fade ? "#facc15" : "#000000"}
          emissiveIntensity={fade ? 0.9 : 0}
        />
      </mesh>

      {/* Number shown on the front face (3D text) */}
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        rotation={[0, 0, 0]}
        fontSize={0.35}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        depthOffset={1}
      >
        {String(value)}
      </Text>

      {/* Index shown below the value on the front face */}
      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        rotation={[0, 0, 0]}
        fontSize={0.2}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        depthOffset={1}
      >
        {`[${index}]`}
      </Text>
    </group>
  );
};

export default VisualPage3;
