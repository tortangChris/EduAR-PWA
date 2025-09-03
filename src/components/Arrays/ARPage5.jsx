// ARPage5.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const ARPage5 = ({
  data = [10, 20, 30, 40, 50],
  spacing = 2.0,
  deleteIndex = 2, // yung index ng ide-delete
  loopDelay = 3000,
}) => {
  const [boxes, setBoxes] = useState(data);
  const [status, setStatus] = useState("Idle");
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [phase, setPhase] = useState(0);

  // positions based on count
  const positions = useMemo(() => {
    const mid = (boxes.length - 1) / 2;
    return boxes.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [boxes, spacing]);

  useEffect(() => {
    let timer;

    const runSequence = async () => {
      setBoxes(data);
      setStatus(
        `Deleting value ${data[deleteIndex]} at index ${deleteIndex}...`
      );
      setHighlightIndex(deleteIndex);

      // highlight target
      await delay(2000);

      // remove target
      setHighlightIndex(null);
      setStatus(`Removing value ${data[deleteIndex]}...`);
      await delay(1000);
      const newArr = data.filter((_, i) => i !== deleteIndex);
      setBoxes(newArr);

      // shift left
      setStatus(`Shifting elements...`);
      await delay(2000);

      // finalize
      setStatus("✅ Deletion complete!");
      await delay(loopDelay);

      // reset loop
      setPhase((p) => p + 1);
    };

    runSequence();

    return () => clearTimeout(timer);
  }, [phase, data, deleteIndex, loopDelay]);

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col items-center justify-center">
      {/* Status text */}
      <div className="mb-4 text-lg font-mono text-gray-800">{status}</div>

      {/* 3D Scene */}
      <div className="w-full h-[70%]">
        <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {boxes.map((value, i) => (
            <Box
              key={i}
              index={i}
              value={value}
              position={positions[i]}
              highlight={highlightIndex === i}
            />
          ))}

          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};

const Box = ({ index, value, position, highlight }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={highlight ? "#f87171" : "#60a5fa"}
          emissive={highlight ? "#facc15" : "#000000"}
          emissiveIntensity={highlight ? 0.9 : 0}
        />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
      >
        {`[${index}]`}
      </Text>
    </group>
  );
};

// small delay utility
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default ARPage5;
