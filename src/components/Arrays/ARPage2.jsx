import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

const VisualPage2 = ({ data = [10, 20, 30, 40, 50], spacing = 2.0 }) => {
  const [selectedBox, setSelectedBox] = useState(null);
  const [isAR, setIsAR] = useState(false);

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const handleBoxClick = (i) => {
    setSelectedBox((prev) => (prev === i ? null : i));
  };

  const generateCode = (index, value) => {
    return [
      "📘 Pseudo Code Example:",
      "",
      "array = [10, 20, 30, 40, 50]",
      `index = ${index}`,
      "",
      "value = array[index]",
      "print('Accessed Value:', value)",
      "",
      `// Result: ${value}`,
    ].join("\n");
  };

  return (
    <div className="w-full h-[500px] relative">
      <Canvas
        camera={{ position: [0, 4, 12], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          document.body.appendChild(
            ARButton.createButton(gl, { requiredFeatures: ["hit-test"] })
          );
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Camera follower for AR mode */}
        {isAR && <ARAnchorGroup />}

        {/* Header text */}
        <FadeText
          text="Array Access Operation (O(1))"
          position={[0, 4, 0]}
          fontSize={0.6}
          color="#facc15"
        />

        <FadeText
          text="Click a box to view its value and pseudo code"
          position={[0, 3.2, 0]}
          fontSize={0.35}
          color="white"
        />

        {/* Boxes */}
        {data.map((value, i) => (
          <Box
            key={i}
            index={i}
            value={value}
            position={positions[i]}
            selected={selectedBox === i}
            onClick={() => handleBoxClick(i)}
          />
        ))}

        {selectedBox !== null && (
          <CodePanel
            code={generateCode(selectedBox, data[selectedBox])}
            position={[8, 1, 0]}
          />
        )}

        {/* Works in both 3D and AR */}
        {!isAR && <OrbitControls makeDefault />}
      </Canvas>

      {/* Toggle Button */}
      <button
        className="absolute bottom-2 left-2 bg-yellow-400 px-3 py-1 rounded-lg"
        onClick={() => setIsAR(!isAR)}
      >
        {isAR ? "Exit AR" : "Enter AR"}
      </button>
    </div>
  );
};

function ARAnchorGroup() {
  const { camera } = useThree();
  const group = useRef();

  // Position object in front of camera (z = -8)
  useEffect(() => {
    if (group.current) {
      group.current.position.set(0, 0, -8);
      camera.add(group.current);
    }
    return () => {
      if (group.current) camera.remove(group.current);
    };
  }, [camera]);

  return (
    <group ref={group}>
      <Text position={[0, 0, 0]} fontSize={0.4} color="#22d3ee">
        👋 AR Mode Active
      </Text>
    </group>
  );
}

// === Box ===
const Box = ({ index, value, position, selected, onClick }) => {
  const size = [1.6, 1.2, 1];
  const color = selected ? "#f87171" : index % 2 === 0 ? "#60a5fa" : "#34d399";

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
        onClick={onClick}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? "#fbbf24" : "#000000"}
          emissiveIntensity={selected ? 0.6 : 0}
        />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.1, size[2] / 2 + 0.01]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.02]}
        fontSize={0.25}
        color="#fde68a"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {selected && (
        <Text
          position={[0, size[1] + 0.8, 0]}
          fontSize={0.32}
          color="#fde68a"
          anchorX="center"
          anchorY="middle"
        >
          Value {value} at index {index}
        </Text>
      )}
    </group>
  );
};

// === Code Panel ===
const CodePanel = ({ code, position }) => (
  <group>
    <FadeText text={code} position={position} fontSize={0.3} color="#c7d2fe" />
  </group>
);

// === FadeText ===
const FadeText = ({ text, position, fontSize = 0.5, color = "white" }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const duration = 1000;

    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setOpacity(progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Text
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      fillOpacity={opacity}
      maxWidth={10}
      textAlign="left"
    >
      {text}
    </Text>
  );
};

export default VisualPage2;
