import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { ARButton, XR, Interactive, Controllers } from "@react-three/xr";

const VisualPage2 = ({ data = [10, 20, 30, 40, 50], spacing = 2.0 }) => {
  const [selectedBox, setSelectedBox] = useState(null);

  // X positions of boxes
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  // Toggle selection
  const handleBoxClick = (i) => {
    setSelectedBox((prev) => (prev === i ? null : i));
  };

  // Pseudo code generator
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
      {/* AR Button */}
      <ARButton sessionInit={{ requiredFeatures: ["hit-test"] }} />

      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        gl={{ antialias: true }}
      >
        <XR>
          <Controllers />

          {/* Lights */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {/* Header */}
          <FadeText
            text="Array Access Operation (O(1))"
            position={[0, 4, -8]}
            fontSize={0.6}
            color="#facc15"
          />

          {/* Instruction */}
          <FadeText
            text="Tap a box to view its value and pseudo code"
            position={[0, 3.2, -8]}
            fontSize={0.35}
            color="white"
          />

          {/* Boxes (placed 8 units in front of camera) */}
          <group position={[0, 0, -8]}>
            {data.map((value, i) => (
              <Interactive key={i} onSelect={() => handleBoxClick(i)}>
                <Box
                  index={i}
                  value={value}
                  position={positions[i]}
                  selected={selectedBox === i}
                />
              </Interactive>
            ))}
          </group>

          {/* Code panel (also in front) */}
          {selectedBox !== null && (
            <CodePanel
              code={generateCode(selectedBox, data[selectedBox])}
              position={[6, 1, -8]}
            />
          )}

          <OrbitControls makeDefault />
        </XR>
      </Canvas>
    </div>
  );
};

// === Box ===
const Box = ({ index, value, position, selected }) => {
  const size = [1.6, 1.2, 1];
  const color = selected ? "#f87171" : index % 2 === 0 ? "#60a5fa" : "#34d399";

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? "#fbbf24" : "#000000"}
          emissiveIntensity={selected ? 0.6 : 0}
        />
      </mesh>

      {/* Value */}
      <Text
        position={[0, size[1] / 2 + 0.1, size[2] / 2 + 0.01]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index */}
      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.02]}
        fontSize={0.25}
        color="#fde68a"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {/* Floating label */}
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

  React.useEffect(() => {
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
