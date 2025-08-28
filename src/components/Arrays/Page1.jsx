import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import content from "../../../public/markdown/ArrayPage1.md?raw";
import { Scan } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const Page1 = () => {
  const [showWarning, setShowWarning] = useState(false);

  const handleArClick = async () => {
    try {
      // Check AR/WebXR support
      if (
        navigator.xr &&
        (await navigator.xr.isSessionSupported("immersive-ar"))
      ) {
        console.log("✅ AR Mode Activated!");
        setShowWarning(false);
      } else {
        throw new Error("AR not supported");
      }
    } catch (err) {
      setShowWarning(true);

      // Reset back to icon after 2.5s
      setTimeout(() => {
        setShowWarning(false);
      }, 2500);
    }
  };

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(86vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <div className="markdown-body">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      {/* 3D Viewer Container */}
      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        {/* 🔥 Inline VisualPage1 component */}
        <VisualPage1 />

        {/* AR Mode Button */}
        <button
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all duration-300 ${
            showWarning
              ? "bg-red-500 text-white px-3"
              : "bg-white text-gray-900 hover:bg-gray-100"
          }`}
          onClick={handleArClick}
        >
          {showWarning ? (
            <span className="text-sm font-medium">AR not supported</span>
          ) : (
            <Scan size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

// =======================
// 🔽 VisualPage1 inline
// =======================
const VisualPage1 = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  // positions for boxes along the X axis
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  return (
    <div className="w-full h-[300px] bg-gray-50">
      <Canvas camera={{ position: [0, 4, 20], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Row of boxes */}
        {data.map((value, i) => (
          <Box key={i} index={i} value={value} position={positions[i]} />
        ))}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// Box component
const Box = ({ index, value, position = [0, 0, 0] }) => {
  const size = [1.6, 1.2, 1];

  return (
    <group position={position}>
      {/* Box */}
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={index % 2 === 0 ? "#60a5fa" : "#34d399"} />
      </mesh>

      {/* Number value */}
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index */}
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

export default Page1;
